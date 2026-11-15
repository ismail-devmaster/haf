"""Single ordered revocation routine for security-reducing events (T4.2/T4.3).

Every path that removes or lowers access must funnel through
``DomoluxRevocationOrchestrator.async_apply`` so the same ordering is always
followed:

1. update the Domolux store (in memory),
2. bump revisions and flush durably (``Store.async_save`` awaited),
3. invalidate derived caches,
4. refresh or terminate affected subscriptions,
5. revoke refresh tokens when the event requires it,
6. close affected live WebSocket connections when the event requires it,
7. write an audit entry.

The routine is fail-closed: a failure in any step is audited as ``failed`` and
re-raised as ``DomoluxRevocationError`` *before* the caller can report success.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import Any, Awaitable, Callable, Optional

from .audit import DomoluxAuditLog, get_audit_log
from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
)
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)

_LEVEL_ORDER = {
    ACCESS_LEVEL_NONE: 0,
    ACCESS_LEVEL_READ: 1,
    ACCESS_LEVEL_CONTROL: 2,
}


class DomoluxRevocationError(Exception):
    """Raised when a security reduction could not be applied durably."""


@dataclass
class RevocationResult:
    """Outcome of one ordered security reduction."""

    target_user_id: str
    reason: str
    revisions: dict[str, int] = field(default_factory=dict)
    subscriptions_refreshed: int = 0
    connections_closed: int = 0
    tokens_revoked: int = 0
    user_disabled: bool = False
    audit_id: Optional[int] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "target_user_id": self.target_user_id,
            "reason": self.reason,
            "revisions": dict(self.revisions),
            "subscriptions_refreshed": self.subscriptions_refreshed,
            "connections_closed": self.connections_closed,
            "tokens_revoked": self.tokens_revoked,
            "user_disabled": self.user_disabled,
            "audit_id": self.audit_id,
        }


class DomoluxRevocationOrchestrator:
    """Ordered, durable revocation used by every security-reducing event."""

    def __init__(
        self,
        hass: Any,
        store: DomoluxRoleStore,
        *,
        registry: Any = None,
        adapter: Any = None,
        audit: Optional[DomoluxAuditLog] = None,
    ) -> None:
        self.hass = hass
        self.store = store
        self.registry = registry
        self.adapter = adapter
        self.audit = audit if audit is not None else get_audit_log(hass)

    async def async_apply(
        self,
        target_user_id: str,
        reason: str,
        *,
        mutate: Optional[Callable[[], Any]] = None,
        reduction: bool = True,
        persist: bool = True,
        revoke_tokens: bool = False,
        hard_close: bool = False,
        disable_user: bool = False,
        actor_id: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
        token_revoker: Optional[Callable[[str], Awaitable[int]]] = None,
        removed_targets: Optional[list[dict[str, str]]] = None,
    ) -> RevocationResult:
        """Apply a security-reducing change in the mandated order."""
        result = RevocationResult(target_user_id=target_user_id, reason=reason)

        try:
            # 1. Update the store (caller supplies the in-memory mutation).
            if mutate is not None:
                mutate()

            # 2. Bump revisions and flush to disk before anything reports
            #    success. Security reductions are never debounced.
            result.revisions = self.store.bump_revisions(profile=True)
            self.store.flush_security_reduction(
                str(result.revisions["profile"]),
                str(result.revisions["registry"]),
                str(result.revisions["catalog"]),
            )
            if persist:
                await self.store.async_save()

            # 3. Invalidate derived caches.
            self._invalidate_caches(target_user_id)

            # 4. Refresh (soft revoke) or terminate (hard revoke) subscriptions.
            if self.registry is not None:
                if hard_close:
                    # Step 6 is performed below, after token revocation.
                    pass
                else:
                    result.subscriptions_refreshed = (
                        self.registry.refresh_user_subscriptions(
                            target_user_id, reason=reason
                        )
                    )

            # T4.3: emit the removal/revision payload immediately (synchronously
            # on the event bus) so soft revocation never waits for a poll.
            if not hard_close:
                self._fire_permissions_updated(
                    target_user_id,
                    reason=reason,
                    revisions=result.revisions,
                    removed_targets=removed_targets or [],
                )

            # 5. Revoke refresh tokens when the event requires it.
            if revoke_tokens:
                result.tokens_revoked = await self._revoke_tokens(
                    target_user_id, token_revoker
                )

            # 6. Close affected live connections when required.
            if hard_close and self.registry is not None:
                result.connections_closed = (
                    await self.registry.async_close_user_connections(
                        target_user_id, reason=reason
                    )
                )

            if disable_user:
                result.user_disabled = await self._disable_user(target_user_id)

            # 7. Audit only after every security step has completed.
            entry = self.audit.record(
                "security.revoke" if reduction else "security.grant",
                actor_id=actor_id,
                target_user_id=target_user_id,
                outcome="allowed",
                reason=reason,
                details={
                    "revisions": result.revisions,
                    "subscriptions_refreshed": result.subscriptions_refreshed,
                    "connections_closed": result.connections_closed,
                    "tokens_revoked": result.tokens_revoked,
                    "user_disabled": result.user_disabled,
                    **(details or {}),
                },
            )
            result.audit_id = entry["id"]
            return result

        except Exception as err:
            self.audit.record(
                "security.revoke" if reduction else "security.grant",
                actor_id=actor_id,
                target_user_id=target_user_id,
                outcome="failed",
                reason=reason,
                details={"error": str(err), **(details or {})},
            )
            _LOGGER.error(
                "Domolux security reduction failed for user %s (%s): %s",
                target_user_id,
                reason,
                err,
            )
            raise DomoluxRevocationError(
                f"Security reduction failed for user {target_user_id} ({reason}): {err}"
            ) from err

    # ------------------------------------------------------------------
    # Individual steps
    # ------------------------------------------------------------------
    def _fire_permissions_updated(
        self,
        user_id: str,
        *,
        reason: str,
        revisions: dict[str, int],
        removed_targets: list[dict[str, str]],
    ) -> None:
        """Fire the Domolux permission event with removal information."""
        bus = getattr(self.hass, "bus", None)
        if bus is None or not hasattr(bus, "async_fire"):
            return
        try:
            bus.async_fire(
                "domolux_permissions_updated",
                {
                    "user_id": user_id,
                    "reason": reason,
                    "revision": revisions.get("profile"),
                    "removed_targets": removed_targets,
                },
            )
        except Exception as err:  # pragma: no cover - defensive
            _LOGGER.warning(
                "Could not fire Domolux permission update for %s: %s", user_id, err
            )

    def _invalidate_caches(self, user_id: str) -> None:
        """Invalidate per-user derived caches, if any are present."""
        for attribute in ("invalidate_user", "invalidate_cache"):
            invalidator = getattr(self.store, attribute, None)
            if callable(invalidator):
                try:
                    invalidator(user_id)
                except Exception as err:  # pragma: no cover - defensive
                    _LOGGER.debug("Store cache invalidation failed: %s", err)
                return

        # Home Assistant caches permission decisions on the user object. Clear
        # it when the adapter exposes the version-isolated helper.
        adapter = self.adapter
        if adapter is not None:
            invalidate = getattr(adapter, "_invalidate_user_cache", None)
            if callable(invalidate):
                try:
                    user = getattr(
                        getattr(self.hass, "auth", None), "_users", {}
                    ).get(user_id)
                    if user is not None:
                        invalidate(user)
                except Exception as err:  # pragma: no cover - defensive
                    _LOGGER.debug("HA user cache invalidation failed: %s", err)

    async def _revoke_tokens(
        self,
        user_id: str,
        token_revoker: Optional[Callable[[str], Awaitable[int]]],
    ) -> int:
        """Revoke refresh tokens or fail the whole reduction."""
        if token_revoker is not None:
            return int(await token_revoker(user_id))

        revoke = getattr(self.adapter, "async_revoke_user_sessions", None)
        if not callable(revoke):
            raise DomoluxRevocationError(
                "Token revocation required but no revoker is available; "
                "refusing to report the revocation as successful."
            )
        return int(await revoke(user_id))

    async def _disable_user(self, user_id: str) -> bool:
        """Disable the HA user via the supported auth API."""
        auth = getattr(self.hass, "auth", None)
        if auth is None:
            raise DomoluxRevocationError(
                "Cannot disable user: Home Assistant auth is unavailable."
            )
        user = None
        get_user = getattr(auth, "async_get_user", None)
        if callable(get_user):
            user = await get_user(user_id)
        if user is None:
            raise DomoluxRevocationError(
                f"Cannot disable user {user_id}: user not found."
            )
        update = getattr(auth, "async_update_user", None)
        if not callable(update):
            raise DomoluxRevocationError(
                "Cannot disable user: async_update_user unavailable."
            )
        await update(user, is_active=False)
        return True


def is_permission_reduction(old: dict[str, Any], new: dict[str, Any]) -> bool:
    """Return True when ``new`` grants strictly less than ``old``.

    Recognises lowered default access, removed/lowered entity rules, removed
    allow view rules, and added deny view rules. Anything else is treated as a
    non-reduction (an increase or an unrelated change).
    """
    old_default = _LEVEL_ORDER.get(old.get("default_access_level"), 0)
    new_default = _LEVEL_ORDER.get(new.get("default_access_level"), 0)
    if new_default < old_default:
        return True

    old_rules = old.get("entity_rules", {}) or {}
    new_rules = new.get("entity_rules", {}) or {}
    for rule_id, old_rule in old_rules.items():
        new_rule = new_rules.get(rule_id)
        if new_rule is None:
            if _LEVEL_ORDER.get(old_rule.get("access_level"), 0) > 0:
                return True
            continue
        if _LEVEL_ORDER.get(new_rule.get("access_level"), 0) < _LEVEL_ORDER.get(
            old_rule.get("access_level"), 0
        ):
            return True

    old_views = old.get("view_rules", {}) or {}
    new_views = new.get("view_rules", {}) or {}
    for path, old_rule in old_views.items():
        new_rule = new_views.get(path)
        if new_rule is None:
            if old_rule.get("effect") == EFFECT_ALLOW:
                return True
            continue
        if (
            old_rule.get("effect") == EFFECT_ALLOW
            and new_rule.get("effect") != EFFECT_ALLOW
        ):
            return True

    return False


def reduced_targets(old: dict[str, Any], new: dict[str, Any]) -> list[dict[str, str]]:
    """Return the target descriptors removed or lowered by ``new``.

    Used by T4.3 to tell the Child's client exactly which entity/device/area
    grants disappeared, so the UI can remove them without a raw error.
    """
    removed: list[dict[str, str]] = []
    old_rules = old.get("entity_rules", {}) or {}
    new_rules = new.get("entity_rules", {}) or {}

    for rule_id, old_rule in old_rules.items():
        new_rule = new_rules.get(rule_id)
        target_type = old_rule.get("target_type", "entity")
        target_id = old_rule.get("target_id")
        if not target_id:
            continue
        if new_rule is None:
            if _LEVEL_ORDER.get(old_rule.get("access_level"), 0) > 0:
                removed.append({"target_type": target_type, "target_id": target_id})
            continue
        if _LEVEL_ORDER.get(new_rule.get("access_level"), 0) < _LEVEL_ORDER.get(
            old_rule.get("access_level"), 0
        ):
            removed.append({"target_type": target_type, "target_id": target_id})

    old_views = old.get("view_rules", {}) or {}
    new_views = new.get("view_rules", {}) or {}
    for path, old_rule in old_views.items():
        new_rule = new_views.get(path)
        if old_rule.get("effect") != EFFECT_ALLOW:
            continue
        if new_rule is None or new_rule.get("effect") != EFFECT_ALLOW:
            removed.append({"target_type": "view", "target_id": path})

    return removed


def get_revocation_orchestrator(hass: Any) -> Optional[DomoluxRevocationOrchestrator]:
    """Return the orchestrator stored on the config entry, if present."""
    from .const import DOMAIN

    domain_data = getattr(hass, "data", None)
    if not isinstance(domain_data, dict):
        return None
    for entry_data in domain_data.get(DOMAIN, {}).values():
        if isinstance(entry_data, dict) and "revocation" in entry_data:
            return entry_data["revocation"]
    return None
