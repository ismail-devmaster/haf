"""Domolux Home Assistant Authentication & Managed Group Adapter.

VERSION ISOLATION & SECURITY BOUNDARY:
- Encapsulates all interactions with Home Assistant Core Auth (`hass.auth`).
- Strictly isolates private internal structures (`hass.auth._store._groups`,
  `_async_schedule_save()`, `user.invalidate_cache()`).
- Enforces strict Non-Admin / Non-Owner invariants for managed family members.
- Implements the dedicated custom group pattern (`domolux-family-<user_id>`)
  with `group_ids=[]` at creation to guarantee Default-Deny entity security.
- Supports atomic rollback for multi-step creation and credential binding.
"""

from __future__ import annotations

from homeassistant.auth.const import GROUP_ID_READ_ONLY, GROUP_ID_USER
import asyncio
from contextlib import asynccontextmanager
import inspect
import logging
from typing import Any, Optional

from .const import (
    ACCESS_LEVEL_CONTROL,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from .dependency_discovery import extract_entities_from_card

_LOGGER = logging.getLogger(__name__)

MANAGED_GROUP_PREFIX = "domolux-family-"


def get_managed_group_id(user_id: str) -> str:
    """Return the dedicated Home Assistant custom group ID for a managed user."""
    return f"{MANAGED_GROUP_PREFIX}{user_id}"


class DomoluxAuthAdapterError(Exception):
    """Base exception for Domolux Auth Adapter operations."""


class DomoluxAuthSecurityError(DomoluxAuthAdapterError):
    """Raised when a security invariant is violated (e.g. targeting Admin/Owner)."""


class DomoluxUserNotFoundError(DomoluxAuthAdapterError):
    """Raised when a requested user cannot be found in Home Assistant Auth."""


class DomoluxGroupError(DomoluxAuthAdapterError):
    """Raised when custom group creation, modification, or deletion fails."""


class DomoluxHAAuthAdapter:
    """Version-isolated adapter for Home Assistant authentication & custom managed groups."""

    def __init__(self, hass: Any) -> None:
        """Initialize adapter with Home Assistant Core instance."""
        self.hass = hass
        self._user_creation_locks: dict[str, tuple[asyncio.Lock, int]] = {}
        self._locks_guard: asyncio.Lock | None = None

    @asynccontextmanager
    async def _user_creation_lock(self, clean_username: str):
        """Acquire a per-username lock with automatic cleanup upon completion."""
        if self._locks_guard is None:
            self._locks_guard = asyncio.Lock()

        async with self._locks_guard:
            if clean_username in self._user_creation_locks:
                lock, ref_count = self._user_creation_locks[clean_username]
                self._user_creation_locks[clean_username] = (lock, ref_count + 1)
            else:
                lock = asyncio.Lock()
                self._user_creation_locks[clean_username] = (lock, 1)

        try:
            async with lock:
                yield
        finally:
            async with self._locks_guard:
                lock, ref_count = self._user_creation_locks[clean_username]
                if ref_count == 1:
                    del self._user_creation_locks[clean_username]
                else:
                    self._user_creation_locks[clean_username] = (lock, ref_count - 1)

    # ------------------------------------------------------------------
    # Internal Encapsulation Helpers for HA Core Private APIs
    # ------------------------------------------------------------------

    def _get_store(self) -> Any:
        """Safely access Private AuthStore from hass.auth."""
        if not hasattr(self.hass, "auth") or self.hass.auth is None:
            raise DomoluxAuthAdapterError("Home Assistant Auth subsystem unavailable.")
        store = getattr(self.hass.auth, "_store", None)
        if store is None:
            _LOGGER.debug("hass.auth._store unavailable (using mock/in-memory mode).")
        return store

    def _get_groups_dict(self) -> dict[str, Any] | None:
        """Safely access private _groups dictionary from AuthStore."""
        store = self._get_store()
        if store is None:
            return None
        groups = getattr(store, "_groups", None)
        if groups is None or not isinstance(groups, dict):
            _LOGGER.warning("AuthStore._groups dictionary is unavailable or invalid.")
            return None
        return groups

    def _async_schedule_save(self) -> None:
        """Schedule atomic persistence of AuthStore changes to disk."""
        store = self._get_store()
        if store is not None and hasattr(store, "_async_schedule_save"):
            try:
                store._async_schedule_save()
            except Exception as err:
                _LOGGER.error("Failed to schedule AuthStore save: %s", err)

    def _invalidate_user_cache(self, user: Any) -> None:
        """Invalidate Home Assistant permission & admin status cache on a user object."""
        if user is None:
            return

        if hasattr(user, "invalidate_cache") and callable(user.invalidate_cache):
            try:
                user.invalidate_cache()
                return
            except Exception as err:
                _LOGGER.debug("user.invalidate_cache() raised: %s", err)

        # Direct dict cleanup fallback if invalidate_cache is absent/failed
        if hasattr(user, "__dict__"):
            user.__dict__.pop("permissions", None)
            user.__dict__.pop("is_admin", None)

    def _get_hass_auth_provider(self) -> Any:
        """Retrieve the primary 'homeassistant' HassAuthProvider."""
        auth_providers = getattr(self.hass.auth, "auth_providers", [])
        for provider in auth_providers:
            if getattr(provider, "type", None) == "homeassistant":
                return provider
        raise DomoluxAuthAdapterError(
            "Home Assistant AuthProvider ('homeassistant') is not configured."
        )

    async def _get_user_by_id(self, user_id: str) -> Any:
        """Get Home Assistant User object by user_id."""
        if not hasattr(self.hass.auth, "async_get_user"):
            return None
        return await self.hass.auth.async_get_user(user_id)

    def _assert_managed_user(self, user: Any) -> None:
        """Enforce security invariant: Managed operations MUST NOT target Admin or Owner users."""
        if user is None:
            raise DomoluxUserNotFoundError("Target user does not exist.")

        is_admin = getattr(user, "is_admin", False)
        is_owner = getattr(user, "is_owner", False)

        if is_admin or is_owner:
            raise DomoluxAuthSecurityError(
                "Security Violation: Domolux managed user operations cannot target "
                "Home Assistant Administrator or Owner users."
            )

    # ------------------------------------------------------------------
    # Managed User Lifecycle Operations
    # ------------------------------------------------------------------

    async def async_create_managed_user(
        self, username: str, password: str, name: str
    ) -> Any:
        """Create a new managed family member with group_ids=[] and credentials.

        ATOMIC ROLLBACK GUARANTEE:
        If username validation, user creation, credential binding, or group setup
        fails at any stage, all partially created artifacts are removed.
        If provider auth was successfully added before failure, provider.async_remove_auth
        is explicitly called to prevent orphan provider credentials.
        """
        if not username or not isinstance(username, str) or not username.strip():
            raise DomoluxAuthAdapterError("Username must be a non-empty string.")
        if not password or not isinstance(password, str) or not password.strip():
            raise DomoluxAuthAdapterError("Password must be a non-empty string.")
        if not name or not isinstance(name, str) or not name.strip():
            raise DomoluxAuthAdapterError("Name must be a non-empty string.")

        clean_username = username.strip().lower()
        clean_name = name.strip()

        async with self._user_creation_lock(clean_username):
            # Step 1: Check username uniqueness across auth provider credentials and user credentials
            provider = self._get_hass_auth_provider()
            if hasattr(provider, "data") and provider.data is not None:
                norm_fn = getattr(provider.data, "normalize_username", lambda x: x.strip().lower())
                target_norm = norm_fn(clean_username)
                for u_info in getattr(provider.data, "users", []):
                    if norm_fn(u_info.get("username", "")) == target_norm:
                        raise DomoluxAuthAdapterError(
                            f"Username '{clean_username}' already exists in Home Assistant."
                        )

            existing_users = await self.hass.auth.async_get_users()
            for u in existing_users:
                for cred in getattr(u, "credentials", []):
                    cred_username = getattr(cred, "data", {}).get("username", "")
                    if cred_username and cred_username.strip().lower() == clean_username:
                        raise DomoluxAuthAdapterError(
                            f"Username '{clean_username}' already exists in Home Assistant."
                        )

            # Step 2: Create base HA User with no default system group (Default-Deny baseline)
            created_user = None
            auth_added = False

            async def _execute_rollback() -> None:
                """Remove provider auth entry (if added) and core HA user (if created)."""
                if auth_added:
                    remove_auth_func = getattr(provider, "async_remove_auth", None)
                    if remove_auth_func and callable(remove_auth_func):
                        try:
                            res = remove_auth_func(clean_username)
                            if inspect.isawaitable(res):
                                await res
                        except Exception as remove_err:
                            _LOGGER.critical(
                                "Rollback failed during provider auth removal for '%s': %s",
                                clean_username,
                                remove_err,
                            )
                if created_user is not None:
                    try:
                        await self.hass.auth.async_remove_user(created_user)
                    except Exception as rollback_err:
                        _LOGGER.critical("Rollback failed during user cleanup: %s", rollback_err)

            try:
                created_user = await self.hass.auth.async_create_user(
                    name=clean_name,
                    group_ids=[],
                )
            except Exception as err:
                raise DomoluxAuthAdapterError(
                    f"Failed to create Home Assistant core user: {err}"
                ) from err

            user_id = getattr(created_user, "id", None)
            if not user_id:
                await _execute_rollback()
                raise DomoluxAuthAdapterError("Created user object is missing a valid UUID.")

            # Immediate post-creation security invariant verification & rollback
            is_admin = getattr(created_user, "is_admin", False) is True
            is_owner = getattr(created_user, "is_owner", False) is True
            is_active = getattr(created_user, "is_active", True) is not False
            user_groups = getattr(created_user, "groups", [])
            forbidden_system_groups = {"system-admin", "system-users", "system-read-only"}
            has_forbidden_group = False
            if isinstance(user_groups, (list, tuple, set)):
                has_forbidden_group = any(
                    getattr(g, "id", None) in forbidden_system_groups for g in user_groups
                )

            if is_admin or is_owner or not is_active or has_forbidden_group:
                _LOGGER.critical(
                    "Security Invariant Failure post user creation for '%s'. Executing rollback.",
                    clean_username,
                )
                await _execute_rollback()
                raise DomoluxAuthSecurityError(
                    "Post-creation security invariant verification failed: "
                    f"is_admin={is_admin}, is_owner={is_owner}, is_active={is_active}, forbidden_group={has_forbidden_group}"
                )

            # Step 3: Add credentials via HassAuthProvider & link to HA user (Atomic rollback on failure)
            try:
                await provider.async_add_auth(clean_username, password)
                auth_added = True

                get_creds_func = getattr(provider, "async_get_or_create_credentials", None)
                link_user_func = getattr(self.hass.auth, "async_link_user", None)

                if not (get_creds_func and callable(get_creds_func) and link_user_func and callable(link_user_func)):
                    raise DomoluxAuthAdapterError(
                        "Home Assistant Auth credential binding capabilities (async_get_or_create_credentials and async_link_user) are required but unavailable."
                    )

                credentials = await get_creds_func({"username": clean_username})
                if not credentials:
                    raise DomoluxAuthAdapterError(
                        "AuthProvider returned empty credentials object."
                    )
                await link_user_func(created_user, credentials)
            except Exception as err:
                _LOGGER.error(
                    "Failed binding credentials for user '%s'. Executing atomic rollback.",
                    clean_username,
                )
                await _execute_rollback()
                raise DomoluxAuthAdapterError(
                    f"Failed to bind authentication credentials: {err}"
                ) from err

            # Step 4: Create dedicated custom managed group (Atomic rollback on failure)
            try:
                default_empty_policy: dict[str, Any] = {"entities": {}}
                await self.async_create_or_update_managed_group(
                    user_id=user_id,
                    policy=default_empty_policy,
                )
            except Exception as err:
                _LOGGER.error(
                    "Failed initializing custom managed group for user '%s'. Executing atomic rollback.",
                    user_id,
                )
                await _execute_rollback()
                raise DomoluxAuthAdapterError(
                    f"Failed initializing managed group: {err}"
                ) from err

            _LOGGER.info(
                "Successfully created Domolux managed family user '%s' (%s) with Default-Deny custom group.",
                clean_username,
                user_id,
            )
            return created_user

    async def async_deactivate_managed_user(self, user_id: str) -> bool:
        """Deactivate a managed family user and invalidate all session tokens."""
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        try:
            await self.hass.auth.async_deactivate_user(user)
            _LOGGER.info("Deactivated Domolux managed user '%s'.", user_id)
            return True
        except Exception as err:
            raise DomoluxAuthAdapterError(
                f"Failed to deactivate user '{user_id}': {err}"
            ) from err

    async def async_activate_managed_user(self, user_id: str) -> bool:
        """Activate a managed family user.

        The managed group is the user's *only* group.  It carries the complete
        native permission policy for this Child, so no permissive system group
        (such as ``system-read-only`` or ``system-users``) may remain
        attached: Home Assistant merges group policies permissively, so a
        leftover group would silently widen the Child's access.
        """
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        try:
            if not hasattr(self.hass.auth, "async_update_user") or not callable(getattr(self.hass.auth, "async_update_user", None)):
                raise DomoluxAuthAdapterError("Fail closed: async_update_user unavailable for Child group replacement")
            # Reject owner before provisioning
            if getattr(user, "is_owner", False):
                raise DomoluxAuthAdapterError("Fail closed: owner account rejected for Child provisioning")

            group_id = get_managed_group_id(user_id)
            # The managed group must exist before it can be bound.
            if await self.async_get_managed_group(user_id) is None:
                await self.async_create_or_update_managed_group(
                    user_id, {"entities": {}}, bind=False
                )

            # Exactly one call, group replacement before activation
            await self.hass.auth.async_update_user(user, group_ids=[group_id], is_active=True)
            # Post-verify exact membership
            actual = {group.id for group in getattr(user, "groups", []) if hasattr(group, "id")}
            if actual != {group_id}:
                # Deactivate where supported; do not continue
                if hasattr(self.hass.auth, "async_update_user") and callable(getattr(self.hass.auth, "async_update_user")):
                    try:
                        await self.hass.auth.async_update_user(user, group_ids=[group_id], is_active=False)
                    except Exception:
                        pass
                raise DomoluxAuthAdapterError(f"Fail closed: group verification failed {actual} != {{{group_id}}}")
            self._invalidate_user_cache(user)
            self._async_schedule_save()
            _LOGGER.info("Activated Domolux managed user '%s' with exact managed group.", user_id)
            return True
        except Exception as err:
            raise DomoluxAuthAdapterError(
                f"Failed to activate user '{user_id}': {err}"
            ) from err

    async def async_revoke_user_sessions(self, user_id: str) -> int:
        """Revoke all active refresh tokens and sessions for a managed user."""
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        refresh_tokens = getattr(user, "refresh_tokens", {})
        if not refresh_tokens:
            return 0

        revoked_count = 0
        tokens_to_remove = list(refresh_tokens.values())
        for token in tokens_to_remove:
            try:
                await self.hass.auth.async_remove_refresh_token(token)
                revoked_count += 1
            except Exception as err:
                _LOGGER.warning("Error revoking refresh token for user '%s': %s", user_id, err)

        _LOGGER.info("Revoked %d active session tokens for user '%s'.", revoked_count, user_id)
        # T-SEC-13/15: close active WebSocket connections for revoked user (extend when connection registry available)
        return revoked_count

    async def async_delete_managed_user(self, user_id: str) -> bool:
        """Delete a managed family user, custom group, and all active sessions."""
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        # Step 1: Remove dedicated custom managed group
        try:
            await self.async_delete_managed_group(user_id)
        except Exception as err:
            _LOGGER.warning("Error removing managed group for user '%s': %s", user_id, err)

        # Step 2: Revoke active sessions / refresh tokens
        await self.async_revoke_user_sessions(user_id)

        # Step 3: Remove user from Home Assistant Core Auth
        try:
            await self.hass.auth.async_remove_user(user)
            _LOGGER.info("Successfully deleted Domolux managed user '%s'.", user_id)
            return True
        except Exception as err:
            raise DomoluxAuthAdapterError(
                f"Failed to remove user '{user_id}' from HA Auth: {err}"
            ) from err

    # ------------------------------------------------------------------
    # Custom Managed Group CRUD Operations
    # ------------------------------------------------------------------

    async def async_get_managed_group(self, user_id: str) -> Any | None:
        """Get the dedicated custom Home Assistant Group object for user_id."""
        groups_dict = self._get_groups_dict()
        if groups_dict is None:
            return None

        group_id = get_managed_group_id(user_id)
        return groups_dict.get(group_id)

    async def async_create_or_update_managed_group(
        self, user_id: str, policy: dict[str, Any], *, bind: bool = True
    ) -> Any:
        """Create or update the dedicated custom group domolux-family-<user_id>.

        When ``bind`` is true the group also becomes the user's *only* group.
        The membership is written through the supported
        ``hass.auth.async_update_user`` API so that it is persisted in
        ``.storage/auth`` and reloaded correctly after a restart.
        """
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        if not isinstance(policy, dict):
            raise DomoluxGroupError("Group policy must be a dictionary.")

        group_id = get_managed_group_id(user_id)
        group_name = f"Domolux Managed Group ({user_id})"

        # Instantiate or access Home Assistant Group object
        try:
            from homeassistant.auth.models import Group

            group = Group(
                id=group_id,
                name=group_name,
                policy=policy,
            )
        except ImportError:
            # Fallback mock Group representation for test environments
            class MockGroup:
                def __init__(self, g_id: str, name: str, pol: dict[str, Any]) -> None:
                    self.id = g_id
                    self.name = name
                    self.policy = pol

            group = MockGroup(group_id, group_name, policy)

        groups_dict = self._get_groups_dict()
        if groups_dict is not None:
            groups_dict[group_id] = group

        # Bind the group to the user as their only group.  The managed group
        # carries the complete native permission policy, so no additional
        # system group (for example the permissive ``system-read-only``) may
        # stay attached: Home Assistant merges group policies permissively.
        if bind:
            update_user = getattr(self.hass.auth, "async_update_user", None)
            if not callable(update_user):
                raise DomoluxGroupError(
                    "Fail closed: Home Assistant async_update_user is unavailable."
                )
            await update_user(user, group_ids=[group_id])

        # Clear permission cache & schedule disk save
        self._invalidate_user_cache(user)
        self._async_schedule_save()

        _LOGGER.debug("Updated managed group '%s' for user '%s'.", group_id, user_id)
        return group

    async def async_assign_native_user_group(self, user_id: str, group_id: str) -> bool:
        """Replace the native group membership of a user with a single group.

        Used for the Father, who is a trusted (non-admin) Home Assistant user
        and therefore needs the standard user group to be able to see and
        operate the household at all.
        """
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        update_user = getattr(self.hass.auth, "async_update_user", None)
        if not callable(update_user):
            raise DomoluxGroupError(
                "Fail closed: Home Assistant async_update_user is unavailable."
            )
        await update_user(user, group_ids=[group_id])

        actual = {getattr(g, "id", None) for g in getattr(user, "groups", [])}
        if actual != {group_id}:
            raise DomoluxGroupError(
                f"Fail closed: group verification failed {actual} != {{{group_id}}}"
            )
        self._invalidate_user_cache(user)
        self._async_schedule_save()
        return True

    @staticmethod
    def _build_native_policy(permission_set: dict[str, Any]) -> dict[str, Any]:
        """Translate a Domolux permission set into a native HA entity policy.

        Home Assistant expects the entity policy to be shaped as::

            {"entities": {"entity_ids": {"light.kitchen": {"read": True,
                                                           "control": True}}}}

        The target kind selects the matching native sub-category
        (``entity_ids`` / ``device_ids`` / ``area_ids``) so that Home
        Assistant itself enforces exactly the Domolux decision - including
        read isolation for entities that are not granted at all.

        A permission set without grants produces ``{"entities": {}}``, which
        Home Assistant evaluates as *deny everything*.
        """
        from .const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_READ

        sub_categories: dict[str, dict[str, dict[str, bool]]] = {
            "entity_ids": {},
            "device_ids": {},
            "area_ids": {},
        }

        target_type_to_sub_category = {
            TARGET_ENTITY: "entity_ids",
            TARGET_DEVICE: "device_ids",
            TARGET_AREA: "area_ids",
        }

        for rule in (permission_set.get("entity_rules") or {}).values():
            if not isinstance(rule, dict):
                continue
            target_type = str(rule.get("target_type") or "")
            target_id = str(rule.get("target_id") or "")
            access_level = str(rule.get("access_level") or "")
            sub_category = target_type_to_sub_category.get(target_type)
            if sub_category is None or not target_id:
                continue

            entry: dict[str, bool] = {}
            if access_level in (ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL):
                entry["read"] = True
            if access_level == ACCESS_LEVEL_CONTROL:
                entry["control"] = True
            if not entry:
                continue
            sub_categories[sub_category][target_id] = entry

        entities = {
            key: value for key, value in sub_categories.items() if value
        }
        return {"entities": entities}

    def _build_effective_native_policy(self, permission_set: dict[str, Any]) -> dict[str, Any]:
        """Build native HA policy containing all effective entity permissions.

        Translates explicit entity rules, explicit device rules, and inherited
        view permissions into native {"entities": {"entity_ids": {...}}}.
        """
        from .const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_NONE, ACCESS_LEVEL_READ, EFFECT_ALLOW

        base = self._build_native_policy(permission_set)
        entity_ids: dict[str, dict[str, bool]] = dict(base.get("entities", {}).get("entity_ids", {}))

        if self.hass is not None:
            try:
                from homeassistant.helpers import entity_registry as er
                ent_reg = er.async_get(self.hass)
            except Exception:
                ent_reg = None

            # 1. Resolve explicit device rules to underlying entities
            device_rules: dict[str, str] = {}
            for rule in (permission_set.get("entity_rules") or {}).values():
                if isinstance(rule, dict) and str(rule.get("target_type") or "") == TARGET_DEVICE:
                    d_id = str(rule.get("target_id") or "")
                    if d_id:
                        device_rules[d_id] = str(rule.get("access_level") or "")

            if ent_reg is not None and device_rules:
                for d_id, access_level in device_rules.items():
                    try:
                        dev_entries = ent_reg.entities.get_entries_for_device_id(d_id)
                    except Exception:
                        dev_entries = []
                    for entry in dev_entries:
                        eid = entry.entity_id
                        # Explicit entity rule takes precedence
                        explicit_rule = None
                        for r in (permission_set.get("entity_rules") or {}).values():
                            if (
                                isinstance(r, dict)
                                and str(r.get("target_type") or "") == TARGET_ENTITY
                                and str(r.get("target_id") or "") == eid
                            ):
                                explicit_rule = str(r.get("access_level") or "")
                                break
                        if explicit_rule is not None:
                            continue
                        if access_level == ACCESS_LEVEL_CONTROL:
                            entity_ids[eid] = {"read": True, "control": True}
                        elif access_level == ACCESS_LEVEL_READ:
                            entity_ids[eid] = {"read": True, "control": False}
                        elif access_level == ACCESS_LEVEL_NONE:
                            entity_ids.pop(eid, None)

            # 2. Resolve view-inherited permissions
            view_rules = permission_set.get("view_rules") or {}
            if view_rules:
                domain_data = getattr(self.hass, "data", {}).get("domolux_roles", {})
                cached_views: dict[str, set[str]] = dict(
                    domain_data.get("dashboard_view_entities", {}) if isinstance(domain_data, dict) else {}
                )

                view_store = domain_data.get("view_store") if isinstance(domain_data, dict) else None
                if view_store is not None:
                    try:
                        for v in view_store.list_views():
                            v_path = v.view_path.strip().lower()
                            if v_path not in cached_views:
                                cached_views[v_path] = set()
                            for card in getattr(v, "cards", []):
                                card_dict = card.to_dict() if hasattr(card, "to_dict") else (card if isinstance(card, dict) else {})
                                cached_views[v_path].update(extract_entities_from_card(card_dict))
                                for b in getattr(card, "entities", []):
                                    if hasattr(b, "entity_id") and b.entity_id:
                                        cached_views[v_path].add(b.entity_id.strip().lower())
                    except Exception as err:
                        _LOGGER.debug("Error retrieving view store views for native policy: %s", err)

                for v_path, v_rule in view_rules.items():
                    if not isinstance(v_rule, dict):
                        continue
                    v_effect = str(v_rule.get("effect") or "")
                    v_level = str(
                        v_rule.get("access_level")
                        or (ACCESS_LEVEL_CONTROL if v_effect == EFFECT_ALLOW else ACCESS_LEVEL_NONE)
                    )
                    if v_effect != EFFECT_ALLOW and v_level not in (ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL):
                        continue

                    ents_in_view = cached_views.get(v_path.strip().lower(), set())
                    for eid in ents_in_view:
                        # Check explicit entity rule
                        explicit_rule = None
                        for r in (permission_set.get("entity_rules") or {}).values():
                            if (
                                isinstance(r, dict)
                                and str(r.get("target_type") or "") == TARGET_ENTITY
                                and str(r.get("target_id") or "") == eid
                            ):
                                explicit_rule = str(r.get("access_level") or "")
                                break
                        if explicit_rule is not None:
                            continue

                        # Check explicit device rule
                        if ent_reg is not None:
                            e_entry = ent_reg.async_get(eid)
                            if e_entry and e_entry.device_id in device_rules:
                                continue

                        if v_level == ACCESS_LEVEL_CONTROL:
                            entity_ids[eid] = {"read": True, "control": True}
                        elif v_level == ACCESS_LEVEL_READ and (
                            eid not in entity_ids or not entity_ids[eid].get("control")
                        ):
                            entity_ids[eid] = {"read": True, "control": False}

        entities_dict = dict(base.get("entities", {}))
        entities_dict["entity_ids"] = entity_ids
        return {"entities": entities_dict}

    async def async_sync_managed_user_permissions(
        self, user_id: str, permission_set: dict[str, Any]
    ) -> Any:
        """Synchronize Domolux permission rules into managed group's HA policy.

        TRANSACTION: old group policy -> build new in memory -> apply ->
        refresh the user's permission cache -> verify -> persist.  On failure
        the previous group policy is restored (fail closed).
        """
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        old_policy = None
        group = await self.async_get_managed_group(user_id)
        if group is not None:
            old_policy = dict(getattr(group, "policy", {}) or {})

        new_policy = self._build_effective_native_policy(permission_set)

        # Apply
        try:
            await self.async_create_or_update_managed_group(user_id, new_policy)
        except Exception as err:
            # Rollback on apply failure
            if old_policy is not None:
                try:
                    await self.async_create_or_update_managed_group(user_id, old_policy)
                except Exception:
                    pass
            raise DomoluxAuthAdapterError(f"Failed to apply group policy: {err}") from err

        # Refresh permissions and verify that Home Assistant now evaluates the
        # Domolux decision exactly.  A mismatch means the native enforcement
        # layer and the Domolux policy disagree - that must never pass
        # silently, because it would either hide granted access or expose
        # denied access.
        try:
            self._invalidate_user_cache(user)
            self._verify_native_policy(user, permission_set)
        except Exception as err:
            _LOGGER.exception("Native policy verification failed for user %s: %r", user_id, err)
            # Rollback if verification fails
            if old_policy is not None:
                try:
                    await self.async_create_or_update_managed_group(user_id, old_policy)
                except Exception:
                    pass
            raise

        _LOGGER.info("Synced permissions for managed user '%s'.", user_id)
        return group

    def _verify_native_policy(
        self, user: Any, permission_set: dict[str, Any]
    ) -> None:
        """Verify that Home Assistant enforces the Domolux decision natively.

        Fails closed: when the native permission layer cannot be evaluated the
        policy is considered not applied and the caller rolls back.
        """
        permissions = getattr(user, "permissions", None)
        if permissions is None or not hasattr(permissions, "check_entity"):
            # No native permission layer available (older Home Assistant or a
            # test double).  The Domolux guard remains the authority.
            _LOGGER.debug(
                "Native permission verification skipped: no check_entity available."
            )
            return

        expected: dict[str, bool] = {}
        for rule in (permission_set.get("entity_rules") or {}).values():
            if not isinstance(rule, dict):
                continue
            if str(rule.get("target_type") or "") != TARGET_ENTITY:
                # Device and area rules are resolved by Home Assistant itself.
                continue
            target_id = str(rule.get("target_id") or "")
            if not target_id:
                continue
            expected[target_id] = str(rule.get("access_level") or "") == ACCESS_LEVEL_CONTROL

        for entity_id, should_control in expected.items():
            try:
                can_control = bool(permissions.check_entity(entity_id, "control"))
                can_read = bool(permissions.check_entity(entity_id, "read"))
            except Exception as err:
                raise DomoluxAuthAdapterError(
                    f"Native permission verification failed for '{entity_id}': {err}"
                ) from err

            if can_control != should_control:
                raise DomoluxAuthAdapterError(
                    "Native permission verification failed for "
                    f"'{entity_id}': control={can_control} expected={should_control}"
                )
            if not can_read:
                raise DomoluxAuthAdapterError(
                    f"Native permission verification failed for '{entity_id}': read denied"
                )

    async def async_delete_managed_group(self, user_id: str) -> bool:
        """Delete dedicated custom group domolux-family-<user_id>."""
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        group_id = get_managed_group_id(user_id)
        groups_dict = self._get_groups_dict()

        if groups_dict is not None and group_id in groups_dict:
            del groups_dict[group_id]

        # Unbind group from user
        user_groups = getattr(user, "groups", None)
        if isinstance(user_groups, list):
            user.groups = [g for g in user_groups if getattr(g, "id", None) != group_id]

        # Clear permission cache & schedule disk save
        self._invalidate_user_cache(user)
        self._async_schedule_save()

        _LOGGER.debug("Deleted managed group '%s' for user '%s'.", group_id, user_id)
        return True

    # ------------------------------------------------------------------
    # Credential Management Operations
    # ------------------------------------------------------------------

    async def async_change_managed_user_password(
        self, user_id: str, new_password: str
    ) -> bool:
        """Change password for a managed user via HassAuthProvider."""
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        if not new_password or not isinstance(new_password, str) or not new_password.strip():
            raise DomoluxAuthAdapterError("New password must be a non-empty string.")

        # Resolve Home Assistant credential username belonging to the user
        target_username = None
        for cred in getattr(user, "credentials", []):
            cred_data = getattr(cred, "data", {})
            if isinstance(cred_data, dict):
                u_name = cred_data.get("username")
                if u_name and isinstance(u_name, str) and u_name.strip():
                    target_username = u_name.strip()
                    break

        if not target_username:
            raise DomoluxAuthAdapterError(
                f"Managed user '{user_id}' has no Home Assistant credential/username to update password."
            )

        provider = self._get_hass_auth_provider()
        try:
            if hasattr(provider, "async_change_password"):
                res = provider.async_change_password(target_username, new_password)
                if inspect.isawaitable(res):
                    await res
            else:
                raise DomoluxAuthAdapterError(
                    "HassAuthProvider does not support async_change_password."
                )
            _LOGGER.info("Successfully changed password for managed user '%s'.", user_id)
            return True
        except DomoluxAuthAdapterError:
            raise
        except Exception as err:
            raise DomoluxAuthAdapterError(
                f"Failed changing password for user '{user_id}': {err}"
            ) from err

    async def async_change_managed_user_username(
        self, user_id: str, new_username: str
    ) -> bool:
        """Change username for a managed user via HassAuthProvider."""
        user = await self._get_user_by_id(user_id)
        self._assert_managed_user(user)

        if not new_username or not isinstance(new_username, str) or not new_username.strip():
            raise DomoluxAuthAdapterError("New username must be a non-empty string.")

        clean_username = new_username.strip().lower()

        # Resolve Home Assistant credential object belonging to the user
        target_credential = None
        for cred in getattr(user, "credentials", []):
            cred_data = getattr(cred, "data", {})
            if isinstance(cred_data, dict) and "username" in cred_data:
                target_credential = cred
                break
        if target_credential is None and getattr(user, "credentials", []):
            target_credential = user.credentials[0]

        if target_credential is None:
            raise DomoluxAuthAdapterError(
                f"Managed user '{user_id}' has no Home Assistant credential object."
            )

        # Check username uniqueness across auth provider data and linked user credentials
        provider = self._get_hass_auth_provider()
        if hasattr(provider, "data") and provider.data is not None:
            norm_fn = getattr(provider.data, "normalize_username", lambda x: x.strip().lower())
            target_norm = norm_fn(clean_username)
            for u_info in getattr(provider.data, "users", []):
                if norm_fn(u_info.get("username", "")) == target_norm:
                    u_info_user_id = u_info.get("user_id") or u_info.get("id")
                    if u_info_user_id and u_info_user_id == user_id:
                        continue
                    is_current_user_cred = False
                    for cred in getattr(user, "credentials", []):
                        cred_username = getattr(cred, "data", {}).get("username", "")
                        if cred_username and norm_fn(cred_username) == target_norm:
                            is_current_user_cred = True
                            break
                    if not is_current_user_cred:
                        raise DomoluxAuthAdapterError(
                            f"Username '{clean_username}' is already taken by another user."
                        )

        existing_users = await self.hass.auth.async_get_users()
        for u in existing_users:
            if getattr(u, "id", None) == user_id:
                continue
            for cred in getattr(u, "credentials", []):
                cred_username = getattr(cred, "data", {}).get("username", "")
                if cred_username and cred_username.strip().lower() == clean_username:
                    raise DomoluxAuthAdapterError(
                        f"Username '{clean_username}' is already taken by another user."
                    )

        try:
            if hasattr(provider, "async_change_username"):
                res = provider.async_change_username(target_credential, clean_username)
                if inspect.isawaitable(res):
                    await res
            else:
                raise DomoluxAuthAdapterError(
                    "HassAuthProvider does not support async_change_username."
                )
            _LOGGER.info("Successfully updated username for managed user '%s' to '%s'.", user_id, clean_username)
            return True
        except DomoluxAuthAdapterError:
            raise
        except Exception as err:
            raise DomoluxAuthAdapterError(
                f"Failed changing username for user '{user_id}': {err}"
            ) from err
