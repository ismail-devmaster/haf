"""Server-side service guard for Domolux Roles.

SECURITY BOUNDARY
-----------------
Every Home Assistant ingress channel ends up in
``homeassistant.core.ServiceRegistry.async_call``:

* the native WebSocket ``call_service`` command,
* the REST endpoint ``/api/services/<domain>/<service>``,
* scripts, scenes and automations,
* other integrations calling ``hass.services.async_call``.

A frontend that merely hides a button is therefore *not* a security
boundary.  This module installs a guard on ``ServiceRegistry.async_call`` so
that a **managed Child** can only execute services the Domolux policy
explicitly grants, against targets the policy explicitly allows.

Design rules
------------
1. The principal is taken from ``Context.user_id``, which Home Assistant
   derives from the authenticated connection/request.  It is never read from
   caller supplied payload fields, so a Child cannot impersonate the Father.
2. Only *managed Children* are restricted.  The Father, Home Assistant
   administrators/owners and unmanaged users keep normal Home Assistant
   behaviour (compatibility requirement).
3. Default deny: unknown domains, unknown services, wildcard targets,
   unresolvable targets and evaluator errors all deny the call.
4. Authorisation completes *before* the original ``async_call`` runs, so a
   denied call never partially executes and never mutates state.
5. The guard is installed once per process, is inert while the integration
   is not loaded, and restores the original callable on unload.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any, Optional

from homeassistant.core import ServiceRegistry
from homeassistant.exceptions import Unauthorized

from .const import ACCESS_LEVEL_CONTROL, DOMAIN, STATUS_ACTIVE
from .service_auth_api import (
    ALLOWED_CONTROL_DOMAINS,
    ALLOWED_CONTROL_SERVICES,
    DANGEROUS_DOMAINS,
)

_LOGGER = logging.getLogger(__name__)

# Stable, non-sensitive reason codes.  They are safe to store in the audit
# trail and to show in diagnostics because they never contain entity ids,
# user names or policy details.
REASON_NOT_MANAGED = "not_managed"
REASON_FATHER = "father"
REASON_ALLOWED = "entity_control_granted"
REASON_ACCOUNT_NOT_ACTIVE = "account_not_active"
REASON_DANGEROUS_DOMAIN = "dangerous_domain"
REASON_DOMAIN_NOT_ALLOWED = "domain_not_allowed"
REASON_SERVICE_NOT_ALLOWED = "service_not_allowed"
REASON_WILDCARD_TARGET = "wildcard_target"
REASON_TARGET_UNRESOLVED = "target_unresolved"
REASON_NO_TARGET = "no_target"
REASON_ENTITY_NOT_GRANTED = "entity_not_granted"
REASON_EVALUATION_ERROR = "evaluation_error"
REASON_STORAGE_ERROR = "storage_error"

# Service-call keys that Home Assistant expands into additional target
# entities (``TargetSelection`` reads exactly these keys from the service
# data).  Every one of them must be resolved and authorised, otherwise a
# Child could smuggle a device/area/label target past the policy.
TARGET_KEYS = ("entity_id", "device_id", "area_id", "floor_id", "label_id")

# Home Assistant's wildcard sentinels.  ``entity_id: all`` applies the
# service to *every* entity of the domain and must never be reachable by a
# managed Child.
WILDCARD_ENTITY_IDS = frozenset({"all", "none"})

# Maximum number of entity ids stored in a single audit entry.
AUDIT_MAX_ENTITY_IDS = 10


@dataclass(frozen=True)
class ServiceCallDecision:
    """Outcome of a service-call authorisation check."""

    allowed: bool
    reason: str
    entity_ids: tuple[str, ...] = ()


def _domolux_entry(hass: Any) -> Optional[dict[str, Any]]:
    """Return the loaded Domolux Roles config-entry data mapping, if any."""
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        return None
    container = data.get(DOMAIN)
    if not isinstance(container, dict):
        return None
    for value in container.values():
        if isinstance(value, dict) and "store" in value and "evaluator" in value:
            return value
    return None


def _normalise_target_config(
    service_data: Any, target: Any
) -> dict[str, Any]:
    """Merge the target-bearing keys of ``service_data`` and ``target``.

    Home Assistant merges ``target`` into ``service_data`` *before* the
    service schema runs, and the entity platform then expands
    ``entity_id``/``device_id``/``area_id``/``floor_id``/``label_id`` from
    the merged payload.  The guard must therefore look at both sources.
    """
    config: dict[str, Any] = {}
    for source in (service_data, target):
        if not isinstance(source, dict):
            continue
        for key in TARGET_KEYS:
            if key not in source:
                continue
            value = source[key]
            if value is None:
                continue
            if key not in config:
                config[key] = value
                continue
            existing = config[key]
            if isinstance(existing, list):
                existing.extend(value if isinstance(value, list) else [value])
            elif isinstance(value, list):
                config[key] = [existing, *value]
            else:
                config[key] = [existing, value]
    return config


def _contains_wildcard(config: dict[str, Any]) -> bool:
    """Return True when the target uses a Home Assistant wildcard sentinel."""
    raw = config.get("entity_id")
    if raw is None:
        return False
    items = raw if isinstance(raw, (list, tuple, set)) else [raw]
    return any(
        isinstance(item, str) and item.strip().lower() in WILDCARD_ENTITY_IDS
        for item in items
    )


def _extract_target_entity_ids(
    hass: Any, config: dict[str, Any]
) -> tuple[set[str], set[str], bool]:
    """Resolve a target into concrete entity ids.

    Returns ``(entity_ids, missing_references, resolved)``.  ``resolved`` is
    False when the target could not be expanded at all, in which case the
    caller must deny the call (fail closed).
    """
    if _contains_wildcard(config):
        return set(), set(), False

    try:
        from homeassistant.helpers.target import (
            TargetSelection,
            async_extract_referenced_entity_ids,
        )
    except Exception as err:  # pragma: no cover - depends on HA version
        _LOGGER.error("Domolux could not import the Home Assistant target helper: %s", err)
        return set(), set(), False

    try:
        selection = TargetSelection(config)
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.warning("Domolux could not build a target selection: %s", err)
        return set(), set(), False

    if not selection.has_any_target:
        return set(), set(), True

    try:
        selected = async_extract_referenced_entity_ids(
            hass, selection, expand_group=True
        )
    except Exception as err:
        _LOGGER.warning("Domolux could not resolve the service target: %s", err)
        return set(), set(), False

    entity_ids = set(selected.referenced) | set(selected.indirectly_referenced)
    missing = (
        set(selected.missing_devices)
        | set(selected.missing_areas)
        | set(selected.missing_floors)
        | set(selected.missing_labels)
    )
    return entity_ids, missing, True


async def async_authorize_service_call(
    hass: Any,
    user_id: str,
    domain: str,
    service: str,
    service_data: Any = None,
    target: Any = None,
) -> ServiceCallDecision:
    """Decide whether ``user_id`` may execute ``domain.service``.

    Returns a :class:`ServiceCallDecision`.  ``allowed`` is True only when
    the caller is not a managed Child, or when the Child's policy grants
    control over *every* entity the call would affect.
    """
    entry = _domolux_entry(hass)
    if entry is None:
        # The integration is not loaded: there is no managed Child, so normal
        # Home Assistant behaviour applies.
        return ServiceCallDecision(True, REASON_NOT_MANAGED)

    store = entry["store"]
    evaluator = entry["evaluator"]

    try:
        father = store.get_father()
        if father is not None and father.user_id == user_id:
            return ServiceCallDecision(True, REASON_FATHER)
        member = store.get_family_member(user_id)
        permissions = store.data.permissions
    except Exception as err:
        _LOGGER.error(
            "Domolux policy lookup failed for user %s; failing closed: %s", user_id, err
        )
        return ServiceCallDecision(False, REASON_STORAGE_ERROR)

    managed = member is not None or user_id in permissions
    if not managed:
        return ServiceCallDecision(True, REASON_NOT_MANAGED)

    if member is not None and member.status != STATUS_ACTIVE:
        return ServiceCallDecision(False, REASON_ACCOUNT_NOT_ACTIVE)

    domain_key = (domain or "").strip().lower()
    service_key = (service or "").strip().lower()

    if domain_key in DANGEROUS_DOMAINS:
        return ServiceCallDecision(False, REASON_DANGEROUS_DOMAIN)
    if domain_key not in ALLOWED_CONTROL_DOMAINS:
        return ServiceCallDecision(False, REASON_DOMAIN_NOT_ALLOWED)
    if service_key not in ALLOWED_CONTROL_SERVICES:
        return ServiceCallDecision(False, REASON_SERVICE_NOT_ALLOWED)

    config = _normalise_target_config(service_data, target)
    entity_ids, missing, resolved = _extract_target_entity_ids(hass, config)
    if not resolved:
        return ServiceCallDecision(False, REASON_WILDCARD_TARGET)
    if missing:
        return ServiceCallDecision(False, REASON_TARGET_UNRESOLVED)
    if not entity_ids:
        return ServiceCallDecision(False, REASON_NO_TARGET)

    for entity_id in sorted(entity_ids):
        try:
            result = await evaluator.evaluate_entity_access(
                user_id, entity_id, required_level=ACCESS_LEVEL_CONTROL
            )
        except Exception as err:
            _LOGGER.warning(
                "Domolux policy evaluation failed for user %s on %s; failing closed: %s",
                user_id,
                entity_id,
                err,
            )
            return ServiceCallDecision(False, REASON_EVALUATION_ERROR)
        if not getattr(result, "granted", False):
            return ServiceCallDecision(False, REASON_ENTITY_NOT_GRANTED, (entity_id,))

    return ServiceCallDecision(True, REASON_ALLOWED, tuple(sorted(entity_ids)))


def _record_denial(
    hass: Any,
    user_id: str,
    domain: str,
    service: str,
    decision: ServiceCallDecision,
) -> None:
    """Record a denied service call in the audit trail (best effort)."""
    try:
        from .audit import get_audit_log

        details: dict[str, Any] = {
            "domain": domain,
            "service": service,
            "entity_count": len(decision.entity_ids),
        }
        if decision.entity_ids:
            details["entity_ids"] = list(decision.entity_ids[:AUDIT_MAX_ENTITY_IDS])
        get_audit_log(hass).record(
            "service.call.denied",
            actor_id=user_id,
            outcome="denied",
            reason=decision.reason,
            details=details,
        )
    except Exception:  # pragma: no cover - auditing must never block a denial
        pass


# The original ``ServiceRegistry.async_call`` captured at install time.
_ORIGINAL_ASYNC_CALL = None
_INSTALLED = False


async def _guarded_async_call(
    self: Any,
    domain: str,
    service: str,
    service_data: dict[str, Any] | None = None,
    blocking: bool = False,
    context: Any = None,
    target: dict[str, Any] | None = None,
    return_response: bool = False,
    **kwargs: Any,
) -> Any:
    """Authorise managed Children before delegating to Home Assistant."""
    hass = getattr(self, "_hass", None)
    user_id = getattr(context, "user_id", None) if context is not None else None

    if hass is not None and user_id:
        decision = await async_authorize_service_call(
            hass, user_id, domain, service, service_data, target
        )
        if not decision.allowed:
            _record_denial(hass, user_id, domain, service, decision)
            _LOGGER.warning(
                "Domolux denied service call %s.%s for user %s (%s)",
                domain,
                service,
                user_id,
                decision.reason,
            )
            raise Unauthorized(user_id=user_id, permission="domolux_service_call")

    assert _ORIGINAL_ASYNC_CALL is not None  # noqa: S101 - install invariant
    return await _ORIGINAL_ASYNC_CALL(
        self,
        domain,
        service,
        service_data,
        blocking,
        context,
        target,
        return_response,
        **kwargs,
    )


def install_service_guard(hass: Any = None) -> None:
    """Install the server-side service guard.

    The guard is a process-wide class level patch of
    ``ServiceRegistry.async_call``; it resolves the Home Assistant instance
    from the registry itself so that multiple test instances stay isolated.
    """
    global _ORIGINAL_ASYNC_CALL, _INSTALLED
    if _INSTALLED:
        return
    _ORIGINAL_ASYNC_CALL = ServiceRegistry.async_call
    ServiceRegistry.async_call = _guarded_async_call
    _INSTALLED = True
    _LOGGER.info("Domolux Roles service guard installed")


def uninstall_service_guard(hass: Any = None) -> None:
    """Remove the server-side service guard and restore Home Assistant."""
    global _ORIGINAL_ASYNC_CALL, _INSTALLED
    if not _INSTALLED:
        return
    if ServiceRegistry.async_call is _guarded_async_call:
        ServiceRegistry.async_call = _ORIGINAL_ASYNC_CALL
    else:
        _LOGGER.warning(
            "Domolux service guard was replaced by another component; "
            "leaving the current implementation in place."
        )
    _ORIGINAL_ASYNC_CALL = None
    _INSTALLED = False
    _LOGGER.info("Domolux Roles service guard uninstalled")


def is_installed() -> bool:
    """Return True when the service guard is currently installed."""
    return _INSTALLED
