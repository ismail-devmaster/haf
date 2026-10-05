"""Permission Management WebSocket API Broker for Domolux Roles.

SECURITY INVARIANTS:
1. Every permission configuration command strictly requires Father authorization.
2. Non-Father users (including Admins/Owners who are not Father) are rejected.
3. Target isolation: Cannot set permissions on Father self, Admins, Owners, or arbitrary HA users.
   Target MUST be a valid managed Domolux family member.
4. All permission state changes are persisted atomically.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any
import uuid

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ERR_UNAUTHORIZED
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import Unauthorized
import voluptuous as vol

from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    DOMAIN,
    EFFECT_ALLOW,
    EFFECT_DENY,
    ROLE_FATHER,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from .family_api import (
    ERR_CANNOT_TARGET_ADMIN,
    ERR_CANNOT_TARGET_FATHER,
    ERR_CANNOT_TARGET_OWNER,
    ERR_FAMILY_USER_NOT_FOUND,
    ERR_FATHER_REQUIRED,
    ERR_INTERNAL_ERROR,
    ERR_INVALID_INPUT,
    _require_father,
)
from .models import (
    EntityPermissionRule,
    UserPermissionSet,
    ViewPermissionRule,
)
from .permission_evaluator import DomoluxPermissionEvaluator
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)

ERR_RULE_NOT_FOUND = "rule_not_found"

VALID_ACCESS_LEVELS = {ACCESS_LEVEL_NONE, ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL}
VALID_TARGET_TYPES = {TARGET_ENTITY, TARGET_DEVICE, TARGET_AREA}
VALID_EFFECTS = {EFFECT_ALLOW, EFFECT_DENY}

_USER_LOCKS: dict[str, asyncio.Lock] = {}


def _get_user_lock(user_id: str) -> asyncio.Lock:
    """Retrieve or create a per-target-user lock to serialize permission mutations."""
    if user_id not in _USER_LOCKS:
        _USER_LOCKS[user_id] = asyncio.Lock()
    return _USER_LOCKS[user_id]


def _get_store(hass: HomeAssistant) -> DomoluxRoleStore:
    """Retrieve active DomoluxRoleStore instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "store" in entry_data:
            return entry_data["store"]
    raise RuntimeError("DomoluxRoleStore instance not found in hass.data.")


def _get_evaluator(hass: HomeAssistant) -> DomoluxPermissionEvaluator:
    """Retrieve active DomoluxPermissionEvaluator instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "evaluator" in entry_data:
            return entry_data["evaluator"]
    raise RuntimeError("DomoluxPermissionEvaluator instance not found in hass.data.")


def _async_fire_permissions_updated(hass: HomeAssistant, user_id: str) -> None:
    """Fire event on HA bus to notify active clients that permission set changed."""
    hass.bus.async_fire("domolux_permissions_updated", {"user_id": user_id})


async def _execute_atomic_permission_mutation(
    hass: HomeAssistant,
    target_user_id: str,
    mutate_fn: Any,
) -> UserPermissionSet:
    """Execute a permission mutation with atomic transaction semantics and per-user locking.

    Transaction flow:
    1. Lock per-target user lock to serialize concurrent mutations.
    2. Snapshot current Domolux permission set (in-memory & persisted).
    3. Build candidate new permission set in memory via mutate_fn.
    4. Sync new state to HA managed group & verify (handled by adapter).
    5. Persist candidate state to Domolux store.
    6. Return new permission set on success.

    Failure & Rollback semantics:
    - If HA sync or verification fails: adapter rolls back HA group policy; Domolux store remains un-persisted and in-memory state is preserved as old snapshot. Exception is re-raised.
    - If Domolux persistence fails: HA group policy is rolled back to old snapshot via adapter, Domolux memory store is restored to old snapshot, and persistence of old snapshot is attempted. Exception is re-raised.

    CRASH-WINDOW LIMITATION:
    This two-phase atomic transaction provides application-level rollback consistency
    for normal operational failures (validation errors, HA policy sync failures, HA verification failures,
    store persistence errors). In the event of an un-interceptable process crash or power loss between
    HA group update and disk persistence, the state will be reconciled on next service start or sync.
    """
    lock = _get_user_lock(target_user_id)
    async with lock:
        store = _get_store(hass)
        old_perm_set = store.get_user_permissions(target_user_id)
        old_dict = old_perm_set.to_dict()

        # Build candidate state in memory without touching persistent store
        new_perm_set = UserPermissionSet.from_dict(old_dict)
        mutate_fn(new_perm_set)

        # Retrieve adapter instance
        adapter = None
        domain_data = hass.data.get(DOMAIN, {})
        for entry_data in domain_data.values():
            if isinstance(entry_data, dict) and "adapter" in entry_data:
                adapter = entry_data["adapter"]
                break

        # Step 4: Sync & Verify HA Group Policy
        if adapter is not None and hasattr(adapter, "async_sync_managed_user_permissions"):
            await adapter.async_sync_managed_user_permissions(
                target_user_id, new_perm_set.to_dict()
            )

        # Step 5: Persist New Domolux State
        store.set_user_permissions(new_perm_set)
        try:
            await store.async_save()
        except Exception as persist_err:
            _LOGGER.error(
                "Domolux store persistence failed for user %s, rolling back HA policy: %s",
                target_user_id,
                persist_err,
            )
            # Rollback HA policy to old snapshot
            if adapter is not None and hasattr(adapter, "async_sync_managed_user_permissions"):
                try:
                    await adapter.async_sync_managed_user_permissions(
                        target_user_id, old_dict
                    )
                except Exception as rollback_err:
                    _LOGGER.critical(
                        "HA Policy rollback failed during store persistence failure for user %s: %s",
                        target_user_id,
                        rollback_err,
                    )
            # Restore old Domolux in-memory state
            restored_set = UserPermissionSet.from_dict(old_dict)
            store.set_user_permissions(restored_set)
            try:
                await store.async_save()
            except Exception:
                pass
            raise persist_err

        return new_perm_set


async def _verify_target_family_member(
    hass: HomeAssistant,
    store: DomoluxRoleStore,
    target_user_id: str,
    father_user_id: str,
) -> None:
    """Verify target user isolation for permission management.

    Must be a managed family member, not Father, Admin, or Owner.
    Raises ValueError with (error_code, message) tuple if invalid.
    """
    if target_user_id == father_user_id:
        raise ValueError(
            ERR_CANNOT_TARGET_FATHER, "Cannot modify permissions for Father account."
        )

    # Check Domolux store existence
    member = store.get_family_member(target_user_id)
    if not member:
        raise ValueError(
            ERR_FAMILY_USER_NOT_FOUND,
            f"Target user '{target_user_id}' is not a Domolux managed family member.",
        )

    # Check HA Core Auth object if available
    if hasattr(hass, "auth") and hasattr(hass.auth, "async_get_user"):
        try:
            ha_user = await hass.auth.async_get_user(target_user_id)
            if ha_user is not None:
                if getattr(ha_user, "is_admin", False):
                    raise ValueError(
                        ERR_CANNOT_TARGET_ADMIN,
                        "Cannot modify permissions for Administrator account.",
                    )
                if getattr(ha_user, "is_owner", False):
                    raise ValueError(
                        ERR_CANNOT_TARGET_OWNER,
                        "Cannot modify permissions for Owner account.",
                    )
        except ValueError:
            raise
        except Exception:
            pass


# ----------------------------------------------------------------------
# WebSocket Handlers
# ----------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/get",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_permission_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get permission set for a family member (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    perm_set = store.get_user_permissions(target_user_id)
    connection.send_result(msg["id"], perm_set.to_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/set_default_level",
        vol.Required("user_id"): str,
        vol.Required("default_access_level"): str,
    }
)
@websocket_api.async_response
async def ws_permission_set_default_level(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set default access level for a family member (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    default_level = msg["default_access_level"]

    if default_level not in VALID_ACCESS_LEVELS:
        connection.send_error(
            msg["id"],
            ERR_INVALID_INPUT,
            f"Invalid default_access_level '{default_level}'. Must be one of: {sorted(VALID_ACCESS_LEVELS)}",
        )
        return

    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    def mutate(ps: UserPermissionSet) -> None:
        ps.default_access_level = default_level

    try:
        new_perm_set = await _execute_atomic_permission_mutation(
            hass, target_user_id, mutate
        )
    except Exception as err:
        _LOGGER.error("Failed to set default access level for user %s: %s", target_user_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Transaction failed: {err}"
        )
        return

    _async_fire_permissions_updated(hass, target_user_id)
    connection.send_result(
        msg["id"], {"success": True, "permissions": new_perm_set.to_dict()}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/set_entity_rule",
        vol.Required("user_id"): str,
        vol.Required("target_type"): str,
        vol.Required("target_id"): str,
        vol.Required("access_level"): str,
        vol.Optional("rule_id"): str,
    }
)
@websocket_api.async_response
async def ws_permission_set_entity_rule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set or update an entity, device, or area permission rule (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    target_type = msg["target_type"]
    target_id = msg["target_id"].strip()
    access_level = msg["access_level"]

    if target_type not in VALID_TARGET_TYPES:
        connection.send_error(
            msg["id"],
            ERR_INVALID_INPUT,
            f"Invalid target_type '{target_type}'. Must be one of: {sorted(VALID_TARGET_TYPES)}",
        )
        return

    if not target_id:
        connection.send_error(
            msg["id"], ERR_INVALID_INPUT, "target_id cannot be empty."
        )
        return

    if access_level not in VALID_ACCESS_LEVELS:
        connection.send_error(
            msg["id"],
            ERR_INVALID_INPUT,
            f"Invalid access_level '{access_level}'. Must be one of: {sorted(VALID_ACCESS_LEVELS)}",
        )
        return

    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    rule_id = msg.get("rule_id") or f"rule_{target_type}_{uuid.uuid4().hex[:8]}"

    rule = EntityPermissionRule(
        rule_id=rule_id,
        target_type=target_type,
        target_id=target_id,
        access_level=access_level,
    )

    def mutate(ps: UserPermissionSet) -> None:
        ps.entity_rules[rule_id] = rule

    try:
        new_perm_set = await _execute_atomic_permission_mutation(
            hass, target_user_id, mutate
        )
    except Exception as err:
        _LOGGER.error("Failed to set entity rule for user %s: %s", target_user_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Transaction failed: {err}"
        )
        return

    _async_fire_permissions_updated(hass, target_user_id)
    connection.send_result(
        msg["id"],
        {
            "success": True,
            "rule": rule.to_dict(),
            "permissions": new_perm_set.to_dict(),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/remove_entity_rule",
        vol.Required("user_id"): str,
        vol.Required("rule_id"): str,
    }
)
@websocket_api.async_response
async def ws_permission_remove_entity_rule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remove an entity/device/area permission rule (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    rule_id = msg["rule_id"]
    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    perm_set = store.get_user_permissions(target_user_id)
    if rule_id not in perm_set.entity_rules:
        connection.send_error(
            msg["id"],
            ERR_RULE_NOT_FOUND,
            f"Permission rule '{rule_id}' not found for user.",
        )
        return

    def mutate(ps: UserPermissionSet) -> None:
        if rule_id in ps.entity_rules:
            del ps.entity_rules[rule_id]

    try:
        new_perm_set = await _execute_atomic_permission_mutation(
            hass, target_user_id, mutate
        )
    except Exception as err:
        _LOGGER.error("Failed to remove entity rule for user %s: %s", target_user_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Transaction failed: {err}"
        )
        return

    _async_fire_permissions_updated(hass, target_user_id)
    connection.send_result(
        msg["id"], {"success": True, "permissions": new_perm_set.to_dict()}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/set_view_rule",
        vol.Required("user_id"): str,
        vol.Required("view_path"): str,
        vol.Required("effect"): str,
    }
)
@websocket_api.async_response
async def ws_permission_set_view_rule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Set or update a view permission rule (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    view_path = msg["view_path"].strip()
    effect = msg["effect"]

    if not view_path:
        connection.send_error(
            msg["id"], ERR_INVALID_INPUT, "view_path cannot be empty."
        )
        return

    if effect not in VALID_EFFECTS:
        connection.send_error(
            msg["id"],
            ERR_INVALID_INPUT,
            f"Invalid effect '{effect}'. Must be one of: {sorted(VALID_EFFECTS)}",
        )
        return

    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    rule = ViewPermissionRule(view_path=view_path, effect=effect)

    def mutate(ps: UserPermissionSet) -> None:
        ps.view_rules[view_path] = rule

    try:
        new_perm_set = await _execute_atomic_permission_mutation(
            hass, target_user_id, mutate
        )
    except Exception as err:
        _LOGGER.error("Failed to set view rule for user %s: %s", target_user_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Transaction failed: {err}"
        )
        return

    _async_fire_permissions_updated(hass, target_user_id)
    connection.send_result(
        msg["id"],
        {
            "success": True,
            "rule": rule.to_dict(),
            "permissions": new_perm_set.to_dict(),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/remove_view_rule",
        vol.Required("user_id"): str,
        vol.Required("view_path"): str,
    }
)
@websocket_api.async_response
async def ws_permission_remove_view_rule(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remove a view permission rule (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    view_path = msg["view_path"].strip()
    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    perm_set = store.get_user_permissions(target_user_id)
    if view_path not in perm_set.view_rules:
        connection.send_error(
            msg["id"],
            ERR_RULE_NOT_FOUND,
            f"View permission rule for path '{view_path}' not found.",
        )
        return

    def mutate(ps: UserPermissionSet) -> None:
        if view_path in ps.view_rules:
            del ps.view_rules[view_path]

    try:
        new_perm_set = await _execute_atomic_permission_mutation(
            hass, target_user_id, mutate
        )
    except Exception as err:
        _LOGGER.error("Failed to remove view rule for user %s: %s", target_user_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Transaction failed: {err}"
        )
        return

    _async_fire_permissions_updated(hass, target_user_id)
    connection.send_result(
        msg["id"], {"success": True, "permissions": new_perm_set.to_dict()}
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/reset",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_permission_reset(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Reset permissions for a user back to default empty state (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    store = _get_store(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    def mutate(ps: UserPermissionSet) -> None:
        ps.default_access_level = ACCESS_LEVEL_NONE
        ps.entity_rules.clear()
        ps.view_rules.clear()

    try:
        new_perm_set = await _execute_atomic_permission_mutation(
            hass, target_user_id, mutate
        )
    except Exception as err:
        _LOGGER.error("Failed to reset permissions for user %s: %s", target_user_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Transaction failed: {err}"
        )
        return

    _async_fire_permissions_updated(hass, target_user_id)
    connection.send_result(
        msg["id"],
        {
            "success": True,
            "permissions": new_perm_set.to_dict(),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/evaluate",
        vol.Required("user_id"): str,
        vol.Required("target_type"): str,
        vol.Required("target_id"): str,
        vol.Optional("required_level"): str,
    }
)
@websocket_api.async_response
async def ws_permission_evaluate(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Evaluate and preview effective permission for a user (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    target_user_id = msg["user_id"]
    target_type = msg["target_type"]
    target_id = msg["target_id"].strip()
    required_level = msg.get("required_level", ACCESS_LEVEL_READ)

    store = _get_store(hass)
    evaluator = _get_evaluator(hass)

    try:
        await _verify_target_family_member(hass, store, target_user_id, father_id)
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
        return

    if target_type == "view":
        res = await evaluator.evaluate_view_access(target_user_id, target_id)
        connection.send_result(
            msg["id"],
            {
                "user_id": res.user_id,
                "view_path": res.view_path,
                "effect": res.effect,
                "allowed": res.allowed,
                "matching_rule_type": res.matching_rule_type,
            },
        )
    elif target_type in ("entity", "device", "area"):
        res = await evaluator.evaluate_entity_access(
            target_user_id, target_id, required_level=required_level
        )
        connection.send_result(
            msg["id"],
            {
                "user_id": res.user_id,
                "target_id": res.target_id,
                "access_level": res.access_level,
                "granted": res.granted,
                "matching_rule_type": res.matching_rule_type,
                "matching_rule_id": res.matching_rule_id,
            },
        )
    else:
        connection.send_error(
            msg["id"],
            ERR_INVALID_INPUT,
            f"Invalid target_type '{target_type}'. Must be 'view', 'entity', 'device', or 'area'.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/permission/my_views",
    }
)
@websocket_api.async_response
async def ws_permission_my_views(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Retrieve effective view permissions for the calling user.

    SECURITY INVARIANT:
    Identity is strictly derived from connection.user.id.
    NEVER accepts a user_id parameter from msg.
    Father, HA Admins, and HA Owners receive all_views_allowed = True.
    """
    if connection.user is None:
        connection.send_error(
            msg["id"], ERR_UNAUTHORIZED, "Unauthorized user connection."
        )
        return

    user_id = connection.user.id
    evaluator = _get_evaluator(hass)
    store = _get_store(hass)

    is_father = evaluator._is_father(user_id)
    is_admin_or_owner = await evaluator._is_admin_or_owner(user_id)

    if is_father or is_admin_or_owner:
        connection.send_result(
            msg["id"],
            {
                "user_id": user_id,
                "all_views_allowed": True,
                "default_access_level": ACCESS_LEVEL_CONTROL,
                "view_rules": {},
            },
        )
        return

    perm_set = store.get_user_permissions(user_id)
    view_rules = {
        view_path: rule.effect
        for view_path, rule in perm_set.view_rules.items()
    }

    connection.send_result(
        msg["id"],
        {
            "user_id": user_id,
            "all_views_allowed": False,
            "default_access_level": perm_set.default_access_level,
            "view_rules": view_rules,
        },
    )


@callback
def async_register_permission_api_commands(hass: HomeAssistant) -> None:
    """Register permission management WebSocket commands."""
    websocket_api.async_register_command(hass, ws_permission_get)
    websocket_api.async_register_command(hass, ws_permission_set_default_level)
    websocket_api.async_register_command(hass, ws_permission_set_entity_rule)
    websocket_api.async_register_command(hass, ws_permission_remove_entity_rule)
    websocket_api.async_register_command(hass, ws_permission_set_view_rule)
    websocket_api.async_register_command(hass, ws_permission_remove_view_rule)
    websocket_api.async_register_command(hass, ws_permission_reset)
    websocket_api.async_register_command(hass, ws_permission_evaluate)
    websocket_api.async_register_command(hass, ws_permission_my_views)
