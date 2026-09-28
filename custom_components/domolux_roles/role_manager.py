"""Backend service layer and role manager for Domolux Roles.

SECURITY HARDENING & INVARIANTS:
1. Server-Side Authority: Role checks are evaluated strictly in backend Python.
2. Single Father Constraint: Maximum ONE Father role per Home Assistant instance.
3. Non-Admin Invariant: Target user MUST NOT be a HA Administrator or HA Owner.
4. Concurrency Safety: All role mutations are synchronized using an asyncio.Lock().
5. Fail-Closed Real-Time Check: Role queries verify live user status if HA auth is available.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Optional

from .const import (
    EVENT_DOMOLUX_ROLE_CHANGED,
    ROLE_FATHER,
    ROLE_USER,
)
from .models import (
    DomoluxRole,
    DomoluxRoleValidationError,
    FatherRoleAssignment,
    FatherRoleStatus,
    validate_non_admin_user,
    validate_user_id,
)
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)


class DomoluxRoleManager:
    """Manages role state, rule evaluations, and registry cross-validation."""

    def __init__(self, hass: Any, store: DomoluxRoleStore) -> None:
        self.hass = hass
        self.store = store
        self._lock = asyncio.Lock()

    async def async_initialize(self) -> None:
        """Initialize role store and cross-validate against HA user registry."""
        async with self._lock:
            await self.store.async_load()
            await self._async_validate_and_sync_locked()

    def get_father_assignment(self) -> Optional[FatherRoleAssignment]:
        """Return active Father assignment if present."""
        father = self.store.get_father()
        if father and father.status == FatherRoleStatus.ACTIVE:
            return father
        return None

    def get_user_role(self, user_id: str) -> DomoluxRole:
        """Evaluate application role for a given user ID.

        FAIL-CLOSED SECURITY EVALUATION:
        Returns DomoluxRole.FATHER if and only if:
        1. The user_id is a valid UUID.
        2. The stored Father assignment matches user_id and status is ACTIVE.
        3. Live HA user check confirms user is NOT admin, NOT owner, NOT disabled.
        """
        try:
            valid_id = validate_user_id(user_id)
        except DomoluxRoleValidationError:
            return DomoluxRole.USER

        father = self.store.get_father()
        if not father or father.user_id != valid_id or father.status != FatherRoleStatus.ACTIVE:
            return DomoluxRole.USER

        # Synchronous check against live HA auth cache if available
        if hasattr(self.hass, "auth") and self.hass.auth is not None:
            try:
                auth_users = getattr(self.hass.auth, "_users", None)
                if isinstance(auth_users, dict):
                    user = auth_users.get(valid_id)
                    if user is not None:
                        is_admin = getattr(user, "is_admin", False)
                        is_owner = getattr(user, "is_owner", False)
                        is_disabled = getattr(user, "is_disabled", False)
                        if (
                            is_admin is True
                            or is_owner is True
                            or is_disabled is True
                        ):
                            _LOGGER.warning(
                                "Live privilege check failed for Father candidate %s. Falling back to USER role.",
                                valid_id,
                            )
                            return DomoluxRole.USER
            except Exception as err:
                _LOGGER.debug("Live user check fallback exception: %s", err)

        return DomoluxRole.FATHER

    async def async_assign_father(
        self, target_user_id: str, assigned_by_user_id: str
    ) -> FatherRoleAssignment:
        """Assign the Father role atomically with concurrency lock."""
        async with self._lock:
            valid_target_id = validate_user_id(target_user_id)
            valid_assigner_id = (
                validate_user_id(assigned_by_user_id)
                if assigned_by_user_id != "system"
                else "system"
            )

            # Idempotency check: if target is already active Father, return assignment directly
            current_father = self.store.get_father()
            if (
                current_father
                and current_father.status == FatherRoleStatus.ACTIVE
                and current_father.user_id == valid_target_id
            ):
                return current_father

            # Retrieve target user from HA auth manager
            user = await self._async_get_ha_user(valid_target_id)
            if user is None:
                raise DomoluxRoleValidationError(
                    f"Target user '{valid_target_id}' does not exist in Home Assistant User Registry."
                )

            # Security invariant checks
            is_admin = getattr(user, "is_admin", False)
            is_owner = getattr(user, "is_owner", False)
            is_disabled = getattr(user, "is_disabled", False)

            if is_disabled:
                raise DomoluxRoleValidationError(
                    f"Target user '{valid_target_id}' is currently disabled in Home Assistant."
                )

            validate_non_admin_user(is_admin=is_admin, is_owner=is_owner)

            # Single Father instance invariant
            if (
                current_father
                and current_father.status == FatherRoleStatus.ACTIVE
                and current_father.user_id != valid_target_id
            ):
                raise DomoluxRoleValidationError(
                    "Phase 1 Restriction: Single Father instance limit reached. "
                    "Revoke existing Father assignment before reassigning."
                )

            assignment = FatherRoleAssignment(
                user_id=valid_target_id,
                assigned_at=datetime.now(timezone.utc).isoformat(),
                assigned_by=valid_assigner_id,
                status=FatherRoleStatus.ACTIVE,
            )

            self.store.set_father(assignment)
            await self.store.async_save()

            _LOGGER.info(
                "Domolux Role 'father' assigned successfully to HA user ID: %s",
                valid_target_id,
            )
            self._fire_role_changed_event(valid_target_id, ROLE_FATHER)

            return assignment

    async def async_revoke_father(self) -> bool:
        """Revoke current Father assignment atomically."""
        async with self._lock:
            father = self.store.get_father()
            if father is None:
                return False

            previous_user_id = father.user_id
            self.store.set_father(None)
            await self.store.async_save()

            _LOGGER.info(
                "Domolux Role 'father' revoked from HA user ID: %s",
                previous_user_id,
            )
            self._fire_role_changed_event(previous_user_id, ROLE_USER)
            return True

    async def async_validate_and_sync(self) -> None:
        """Public thread-safe wrapper for state cross-validation."""
        async with self._lock:
            await self._async_validate_and_sync_locked()

    async def _async_validate_and_sync_locked(self) -> None:
        """Internal cross-validation logic under lock."""
        father = self.store.get_father()
        if father is None or father.status not in (
            FatherRoleStatus.ACTIVE,
            FatherRoleStatus.SUSPENDED_ADMIN,
            FatherRoleStatus.SUSPENDED_DISABLED,
        ):
            return

        user = await self._async_get_ha_user(father.user_id)

        # Case 1: User deleted from HA
        if user is None:
            _LOGGER.warning(
                "Father user ID %s was deleted from Home Assistant. Marking role ORPHANED_DELETED.",
                father.user_id,
            )
            father.status = FatherRoleStatus.ORPHANED_DELETED
            self.store.set_father(None)
            await self.store.async_save()
            return

        # Case 2: User disabled in HA
        if getattr(user, "is_disabled", False):
            if father.status != FatherRoleStatus.SUSPENDED_DISABLED:
                _LOGGER.warning(
                    "Father user ID %s is disabled in HA. Suspending Father role.",
                    father.user_id,
                )
                father.status = FatherRoleStatus.SUSPENDED_DISABLED
                await self.store.async_save()
            return

        # Case 3: User elevated to HA Admin or Owner
        is_admin = getattr(user, "is_admin", False)
        is_owner = getattr(user, "is_owner", False)
        if is_admin or is_owner:
            if father.status != FatherRoleStatus.SUSPENDED_ADMIN:
                _LOGGER.warning(
                    "Father user ID %s was elevated to HA Admin/Owner. Suspending Father role.",
                    father.user_id,
                )
                father.status = FatherRoleStatus.SUSPENDED_ADMIN
                await self.store.async_save()
            return

        # Case 4: Recover to ACTIVE if conditions restored
        if father.status != FatherRoleStatus.ACTIVE:
            _LOGGER.info(
                "Father user ID %s restored to valid non-admin active state.",
                father.user_id,
            )
            father.status = FatherRoleStatus.ACTIVE
            await self.store.async_save()

    async def _async_get_ha_user(self, user_id: str) -> Any:
        """Fetch user object safely from Home Assistant auth manager."""
        if not hasattr(self.hass, "auth") or self.hass.auth is None:
            return None
        try:
            return await self.hass.auth.async_get_user(user_id)
        except Exception as err:
            _LOGGER.debug(
                "Could not query HA user registry for user_id %s: %s",
                user_id,
                err,
            )
            return None

    def _fire_role_changed_event(self, user_id: str, new_role: str) -> None:
        """Fire event when role assignment changes."""
        if hasattr(self.hass, "bus") and self.hass.bus is not None:
            self.hass.bus.async_fire(
                EVENT_DOMOLUX_ROLE_CHANGED,
                {"user_id": user_id, "role": new_role},
            )
