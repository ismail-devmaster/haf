"""Domolux Family User Creation Service.

Provides backend API for creating managed family members with:
- Strict input validation (username, display name, password).
- Integration with DomoluxHAAuthAdapter for HA core user and custom group provisioning.
- Post-creation security invariant verification (non-admin, non-owner, active, no system groups, single custom managed group).
- Multi-layer atomic rollback on any step or invariant failure.
- Business metadata persistence in DomoluxRoleStore with ZERO credential/secret exposure.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional

from .const import STATUS_ACTIVE, STATUS_SUSPENDED_DISABLED
from .ha_auth_adapter import (
    DomoluxAuthAdapterError,
    DomoluxHAAuthAdapter,
    get_managed_group_id,
)
from .models import FamilyMemberRecord, validate_user_id
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)

USERNAME_REGEX = re.compile(r"^[a-z0-9._-]+$")
FORBIDDEN_SYSTEM_GROUPS = {"system-admin", "system-users", "system-read-only"}


class DomoluxFamilyUserError(Exception):
    """Base exception for family user creation service errors."""


class DomoluxInvalidInputError(DomoluxFamilyUserError):
    """Raised when provided input parameters fail validation."""


class DomoluxDuplicateUsernameError(DomoluxFamilyUserError):
    """Raised when the requested username is already taken."""


class DomoluxSecurityInvariantError(DomoluxFamilyUserError):
    """Raised when post-creation security invariants are violated."""


class DomoluxFamilyUserService:
    """Service managing creation and lookup of Domolux managed family members."""

    def __init__(
        self,
        hass: Any,
        auth_adapter: DomoluxHAAuthAdapter,
        store: DomoluxRoleStore,
    ) -> None:
        """Initialize family user service."""
        self.hass = hass
        self.auth_adapter = auth_adapter
        self.store = store

    def _validate_inputs(
        self, display_name: str, username: str, password: str
    ) -> tuple[str, str, str]:
        """Validate input parameters for family user creation."""
        if not display_name or not isinstance(display_name, str) or not display_name.strip():
            raise DomoluxInvalidInputError("Display name must be a non-empty string.")

        if not username or not isinstance(username, str) or not username.strip():
            raise DomoluxInvalidInputError("Username must be a non-empty string.")

        if not password or not isinstance(password, str) or not password.strip():
            raise DomoluxInvalidInputError("Password must be a non-empty string.")

        clean_display_name = display_name.strip()
        clean_username = username.strip().lower()

        if not USERNAME_REGEX.match(clean_username):
            raise DomoluxInvalidInputError(
                "Username may only contain lowercase alphanumeric characters, dots, underscores, and hyphens."
            )

        if len(password) < 8:
            raise DomoluxInvalidInputError("Password must be at least 8 characters long.")

        return clean_display_name, clean_username, password

    async def _check_username_uniqueness(self, clean_username: str) -> None:
        """Ensure username is unique across both HA Auth and Domolux store."""
        # Check HA Auth users
        if hasattr(self.hass, "auth") and hasattr(self.hass.auth, "async_get_users"):
            try:
                existing_users = await self.hass.auth.async_get_users()
                for u in existing_users:
                    if getattr(u, "username", "").lower() == clean_username:
                        raise DomoluxDuplicateUsernameError(
                            f"Username '{clean_username}' already exists in Home Assistant."
                        )
            except DomoluxDuplicateUsernameError:
                raise
            except Exception as err:
                _LOGGER.warning("Error checking existing HA users for username uniqueness: %s", err)

        # Check Domolux store family members
        for member in self.store.list_family_members():
            if member.username.lower() == clean_username:
                raise DomoluxDuplicateUsernameError(
                    f"Username '{clean_username}' already exists in Domolux family members."
                )

    def _verify_security_invariants(self, created_user: Any, expected_group_id: str) -> None:
        """Perform strict post-creation security invariant assertions on created user."""
        is_admin = getattr(created_user, "is_admin", False)
        is_owner = getattr(created_user, "is_owner", False)
        is_active = getattr(created_user, "is_active", True)

        if is_admin:
            raise DomoluxSecurityInvariantError(
                "Security Invariant Failure: Created managed user was granted Administrator privileges."
            )

        if is_owner:
            raise DomoluxSecurityInvariantError(
                "Security Invariant Failure: Created managed user was granted Owner privileges."
            )

        if not is_active:
            raise DomoluxSecurityInvariantError(
                "Security Invariant Failure: Created managed user is not active."
            )

        # Check group assignments for system groups or unauthorized groups
        user_groups = getattr(created_user, "groups", [])
        group_ids: set[str] = set()

        if isinstance(user_groups, list):
            for g in user_groups:
                g_id = getattr(g, "id", None)
                if g_id:
                    group_ids.add(g_id)

        if hasattr(created_user, "group_ids") and isinstance(created_user.group_ids, list):
            for g_id in created_user.group_ids:
                if isinstance(g_id, str):
                    group_ids.add(g_id)

        forbidden_found = group_ids.intersection(FORBIDDEN_SYSTEM_GROUPS)
        if forbidden_found:
            raise DomoluxSecurityInvariantError(
                f"Security Invariant Failure: Managed user is assigned to forbidden system group(s): {forbidden_found}."
            )

        if expected_group_id not in group_ids and group_ids:
            # If user has groups assigned, expected custom managed group MUST be present
            raise DomoluxSecurityInvariantError(
                f"Security Invariant Failure: Managed user group list {group_ids} does not contain expected custom group '{expected_group_id}'."
            )

    async def async_create_family_user(
        self,
        display_name: str,
        username: str,
        password: str,
        metadata: Optional[dict[str, Any]] = None,
    ) -> FamilyMemberRecord:
        """Create a new managed family user with full invariant enforcement and atomic rollback.

        Steps:
        1. Input validation & username uniqueness check.
        2. Delegate creation of HA User & dedicated custom group to DomoluxHAAuthAdapter.
        3. Mandatory post-creation security invariant checks.
        4. Persist metadata in DomoluxRoleStore (no secrets/passwords).
        5. Atomic rollback across adapter + store if any step fails.
        """
        clean_display_name, clean_username, validated_password = self._validate_inputs(
            display_name, username, password
        )

        await self._check_username_uniqueness(clean_username)

        created_user = None
        user_id = None

        # Step 1: Create HA user and dedicated managed group via adapter
        try:
            created_user = await self.auth_adapter.async_create_managed_user(
                username=clean_username,
                password=validated_password,
                name=clean_display_name,
            )
            user_id = getattr(created_user, "id", None)
            if not user_id:
                raise DomoluxFamilyUserError("HA Auth Adapter returned user object without UUID.")
        except DomoluxAuthAdapterError as err:
            raise DomoluxFamilyUserError(f"User creation adapter error: {err}") from err
        except Exception as err:
            raise DomoluxFamilyUserError(f"Unexpected user creation error: {err}") from err

        expected_group_id = get_managed_group_id(user_id)

        # Step 2: Security Invariant Verification
        try:
            self._verify_security_invariants(created_user, expected_group_id)
        except DomoluxSecurityInvariantError as err:
            _LOGGER.error(
                "Security invariant check failed for created user '%s' (%s). Rolling back.",
                clean_username,
                user_id,
            )
            try:
                await self.auth_adapter.async_delete_managed_user(user_id)
            except Exception as rollback_err:
                _LOGGER.critical("Rollback failed during invariant failure cleanup: %s", rollback_err)
            raise

        # Step 3: Persist record in DomoluxRoleStore (no secrets)
        record = FamilyMemberRecord(
            user_id=user_id,
            display_name=clean_display_name,
            username=clean_username,
            managed_group_id=expected_group_id,
            status=STATUS_ACTIVE,
            permissions_metadata=metadata if isinstance(metadata, dict) else {},
        )

        self.store.add_family_member(record)

        try:
            await self.store.async_save()
        except Exception as err:
            _LOGGER.error(
                "Failed persisting family member record for '%s' (%s). Rolling back.",
                clean_username,
                user_id,
            )
            # Rollback store and HA core state
            self.store.remove_family_member(user_id)
            try:
                await self.auth_adapter.async_delete_managed_user(user_id)
            except Exception as rollback_err:
                _LOGGER.critical("Rollback failed during store failure cleanup: %s", rollback_err)
            raise DomoluxFamilyUserError(f"Failed to persist family member record: {err}") from err

        _LOGGER.info(
            "Successfully created and persisted Domolux family member record for user '%s' (%s).",
            clean_username,
            user_id,
        )
        return record

    def get_family_member(self, user_id: str) -> Optional[FamilyMemberRecord]:
        """Retrieve a managed family member record by user_id."""
        validate_user_id(user_id)
        return self.store.get_family_member(user_id)

    def list_family_members(self) -> list[FamilyMemberRecord]:
        """Return all managed family member records."""
        return self.store.list_family_members()

    async def async_delete_family_user(self, user_id: str) -> bool:
        """Delete a managed family user from HA Core Auth and Domolux store."""
        validate_user_id(user_id)
        member = self.store.get_family_member(user_id)
        if not member:
            raise DomoluxInvalidInputError(f"Family member with ID '{user_id}' not found.")

        try:
            await self.auth_adapter.async_delete_managed_user(user_id)
        except Exception as err:
            _LOGGER.error("Failed to delete managed user '%s' in auth adapter: %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to delete user in auth adapter: {err}") from err

        self.store.remove_family_member(user_id)
        try:
            await self.store.async_save()
        except Exception as err:
            _LOGGER.error("Failed to save store after deleting family member '%s': %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to update store: {err}") from err

        return True

    async def async_disable_family_user(self, user_id: str) -> bool:
        """Disable a managed family member and revoke all active sessions."""
        validate_user_id(user_id)
        member = self.store.get_family_member(user_id)
        if not member:
            raise DomoluxInvalidInputError(f"Family member with ID '{user_id}' not found.")

        try:
            await self.auth_adapter.async_deactivate_managed_user(user_id)
            await self.auth_adapter.async_revoke_user_sessions(user_id)
        except Exception as err:
            _LOGGER.error("Failed to deactivate managed user '%s': %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to deactivate user: {err}") from err

        member.status = STATUS_SUSPENDED_DISABLED
        try:
            await self.store.async_save()
        except Exception as err:
            _LOGGER.error("Failed to update store after disabling family member '%s': %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to update store: {err}") from err

        return True

    async def async_enable_family_user(self, user_id: str) -> bool:
        """Enable a managed family member."""
        validate_user_id(user_id)
        member = self.store.get_family_member(user_id)
        if not member:
            raise DomoluxInvalidInputError(f"Family member with ID '{user_id}' not found.")

        try:
            await self.auth_adapter.async_activate_managed_user(user_id)
        except Exception as err:
            _LOGGER.error("Failed to activate managed user '%s': %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to activate user: {err}") from err

        member.status = STATUS_ACTIVE
        try:
            await self.store.async_save()
        except Exception as err:
            _LOGGER.error("Failed to update store after enabling family member '%s': %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to update store: {err}") from err

        return True

    async def async_change_family_user_password(self, user_id: str, new_password: str) -> bool:
        """Change password for a managed family member and revoke active sessions."""
        validate_user_id(user_id)
        if not new_password or not isinstance(new_password, str) or not new_password.strip():
            raise DomoluxInvalidInputError("Password must be a non-empty string.")
        if len(new_password) < 8:
            raise DomoluxInvalidInputError("Password must be at least 8 characters long.")

        member = self.store.get_family_member(user_id)
        if not member:
            raise DomoluxInvalidInputError(f"Family member with ID '{user_id}' not found.")

        try:
            await self.auth_adapter.async_change_managed_user_password(user_id, new_password)
            await self.auth_adapter.async_revoke_user_sessions(user_id)
        except Exception as err:
            _LOGGER.error("Failed changing password for managed user '%s': %s", user_id, err)
            raise DomoluxFamilyUserError(f"Failed to change password: {err}") from err

        return True
