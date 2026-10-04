"""Secure Father-Only Family API WebSocket Broker for Domolux Roles.

SECURITY INVARIANTS:
1. Every command strictly requires Father authorization (connection.user.id is the active Domolux Father).
2. Non-Father users (including HA Admins/Owners who are not bound as Father) are rejected with 'father_required'.
3. Target-user isolation: all operations act strictly on records present in Domolux family storage.
   Rejects arbitrary HA user IDs, Admin accounts, Owner accounts, and Father accounts.
4. Passwords, hashes, tokens, or credential objects are NEVER stored or returned in WS responses.
5. All errors return standardized, machine-readable error codes.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ERR_UNAUTHORIZED
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import Unauthorized
import voluptuous as vol

from .const import DOMAIN, ROLE_FATHER
from .family_user_service import (
    DomoluxDuplicateUsernameError,
    DomoluxFamilyUserError,
    DomoluxFamilyUserService,
    DomoluxInvalidInputError,
    DomoluxSecurityInvariantError,
)
from .models import FamilyMemberRecord
from .role_manager import DomoluxRoleManager

_LOGGER = logging.getLogger(__name__)

# Error Codes
ERR_NOT_AUTHENTICATED = "not_authenticated"
ERR_FATHER_REQUIRED = ERR_UNAUTHORIZED
ERR_FAMILY_USER_NOT_FOUND = "family_user_not_found"
ERR_FAMILY_USER_ORPHANED = "family_user_orphaned"
ERR_INVALID_INPUT = "invalid_input"
ERR_DUPLICATE_USERNAME = "duplicate_username"
ERR_CANNOT_TARGET_ADMIN = "cannot_target_admin"
ERR_CANNOT_TARGET_OWNER = "cannot_target_owner"
ERR_CANNOT_TARGET_FATHER = "cannot_target_father"
ERR_PERMISSION_DENIED = "permission_denied"
ERR_INTERNAL_ERROR = "internal_error"


def _get_manager(hass: HomeAssistant) -> DomoluxRoleManager:
    """Retrieve active DomoluxRoleManager instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "manager" in entry_data:
            return entry_data["manager"]
    raise RuntimeError("DomoluxRoleManager instance not found in hass.data.")


def _get_family_service(hass: HomeAssistant) -> DomoluxFamilyUserService:
    """Retrieve active DomoluxFamilyUserService instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "family_service" in entry_data:
            return entry_data["family_service"]
    raise RuntimeError("DomoluxFamilyUserService instance not found in hass.data.")


async def _require_father(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection
) -> str:
    """Enforce security requirement: Connected user MUST be the active Domolux Father.

    Raises Home Assistant's native Unauthorized exception (ha.exceptions.Unauthorized),
    which the websocket framework maps to ERR_UNAUTHORIZED ("unauthorized") automatically.
    Returns father_user_id if valid; otherwise raises Unauthorized.
    """
    user = connection.user
    if user is None or getattr(user, "is_disabled", False):
        raise Unauthorized()

    manager = _get_manager(hass)
    user_role = manager.get_user_role(user.id)
    father_assignment = manager.get_father_assignment()

    if (
        user_role.value != ROLE_FATHER
        or father_assignment is None
        or father_assignment.user_id != user.id
    ):
        raise Unauthorized(user_id=user.id)

    return user.id


async def _verify_and_get_target_member(
    hass: HomeAssistant,
    family_service: DomoluxFamilyUserService,
    target_user_id: str,
    father_user_id: str,
) -> tuple[FamilyMemberRecord, Any | None]:
    """Verify target user isolation invariants.

    1. Must exist in Domolux family storage.
    2. Must not be Father account.
    3. Target in HA core auth must not be Admin or Owner.
    4. Must exist in HA core auth (otherwise orphaned).

    Returns (FamilyMemberRecord, ha_user) or raises ValueError with error code tuple.
    """
    if target_user_id == father_user_id:
        raise ValueError(ERR_CANNOT_TARGET_FATHER, "Cannot target Father account.")

    # Check Domolux store existence
    member = family_service.get_family_member(target_user_id)
    if not member:
        raise ValueError(
            ERR_FAMILY_USER_NOT_FOUND,
            f"Target user '{target_user_id}' is not a Domolux managed family member.",
        )

    # Check HA Core Auth object if available
    ha_user = None
    if hasattr(hass, "auth") and hasattr(hass.auth, "async_get_user"):
        try:
            ha_user = await hass.auth.async_get_user(target_user_id)
        except Exception:
            ha_user = None

    if ha_user is not None:
        if getattr(ha_user, "is_admin", False):
            raise ValueError(ERR_CANNOT_TARGET_ADMIN, "Cannot target Administrator account.")
        if getattr(ha_user, "is_owner", False):
            raise ValueError(ERR_CANNOT_TARGET_OWNER, "Cannot target Owner account.")
    elif hasattr(hass, "auth") and hasattr(hass.auth, "async_get_users"):
        # Check fallback user list to detect orphaned members if async_get_user fails/unsupported
        try:
            users = await hass.auth.async_get_users()
            found = False
            for u in users:
                if getattr(u, "id", None) == target_user_id:
                    found = True
                    if getattr(u, "is_admin", False):
                        raise ValueError(ERR_CANNOT_TARGET_ADMIN, "Cannot target Administrator account.")
                    if getattr(u, "is_owner", False):
                        raise ValueError(ERR_CANNOT_TARGET_OWNER, "Cannot target Owner account.")
                    ha_user = u
                    break
            if not found:
                raise ValueError(
                    ERR_FAMILY_USER_ORPHANED,
                    f"Target family member '{target_user_id}' is missing from Home Assistant Auth.",
                )
        except ValueError:
            raise
        except Exception:
            pass

    return member, ha_user


# ----------------------------------------------------------------------
# WebSocket Command Handlers
# ----------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/family/list",
    }
)
@websocket_api.async_response
async def ws_family_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """List all managed family members (Father only)."""
    try:
        await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"],
            ERR_FATHER_REQUIRED,
            "Privilege error: Father role required.",
        )
        return

    try:
        service = _get_family_service(hass)
        members = service.list_family_members()
        result_data = [m.to_dict() for m in members]
        connection.send_result(msg["id"], result_data)
    except Exception as err:
        _LOGGER.error("Failed listing family members: %s", err)
        connection.send_error(
            msg["id"],
            ERR_INTERNAL_ERROR,
            "An error occurred while retrieving family members.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/family/create",
        vol.Required("display_name"): str,
        vol.Required("username"): str,
        vol.Required("password"): str,
        vol.Optional("metadata"): dict,
    }
)
@websocket_api.async_response
async def ws_family_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Create a new managed family member (Father only)."""
    try:
        await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"],
            ERR_FATHER_REQUIRED,
            "Privilege error: Father role required.",
        )
        return

    display_name = msg.get("display_name", "")
    username = msg.get("username", "")
    password = msg.get("password", "")
    metadata = msg.get("metadata")

    try:
        service = _get_family_service(hass)
        record = await service.async_create_family_user(
            display_name=display_name,
            username=username,
            password=password,
            metadata=metadata,
        )

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "family_member": record.to_dict(),
            },
        )
    except DomoluxInvalidInputError as err:
        connection.send_error(msg["id"], ERR_INVALID_INPUT, str(err))
    except DomoluxDuplicateUsernameError as err:
        connection.send_error(msg["id"], ERR_DUPLICATE_USERNAME, str(err))
    except DomoluxSecurityInvariantError as err:
        _LOGGER.error("Security invariant error creating family user: %s", err)
        connection.send_error(msg["id"], ERR_PERMISSION_DENIED, str(err))
    except DomoluxFamilyUserError as err:
        _LOGGER.error("Family user creation service error: %s", err)
        connection.send_error(msg["id"], ERR_INTERNAL_ERROR, str(err))
    except Exception as err:
        _LOGGER.error("Unexpected error creating family user: %s", err)
        connection.send_error(
            msg["id"],
            ERR_INTERNAL_ERROR,
            "An unexpected error occurred during user creation.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/family/delete",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_family_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete a managed family member (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"],
            ERR_FATHER_REQUIRED,
            "Privilege error: Father role required.",
        )
        return

    target_user_id = msg.get("user_id", "")
    service = _get_family_service(hass)

    try:
        await _verify_and_get_target_member(hass, service, target_user_id, father_id)
        await service.async_delete_family_user(target_user_id)
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "user_id": target_user_id,
            },
        )
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
    except DomoluxFamilyUserError as err:
        _LOGGER.error("Error deleting family user '%s': %s", target_user_id, err)
        connection.send_error(msg["id"], ERR_INTERNAL_ERROR, str(err))
    except Exception as err:
        _LOGGER.error("Unexpected error deleting family user '%s': %s", target_user_id, err)
        connection.send_error(
            msg["id"],
            ERR_INTERNAL_ERROR,
            "An error occurred while deleting family member.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/family/disable",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_family_disable(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Disable a managed family member and revoke active sessions (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"],
            ERR_FATHER_REQUIRED,
            "Privilege error: Father role required.",
        )
        return

    target_user_id = msg.get("user_id", "")
    service = _get_family_service(hass)

    try:
        await _verify_and_get_target_member(hass, service, target_user_id, father_id)
        await service.async_disable_family_user(target_user_id)
        member = service.get_family_member(target_user_id)
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "user_id": target_user_id,
                "status": member.status if member else "SUSPENDED_DISABLED",
            },
        )
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
    except DomoluxFamilyUserError as err:
        _LOGGER.error("Error disabling family user '%s': %s", target_user_id, err)
        connection.send_error(msg["id"], ERR_INTERNAL_ERROR, str(err))
    except Exception as err:
        _LOGGER.error("Unexpected error disabling family user '%s': %s", target_user_id, err)
        connection.send_error(
            msg["id"],
            ERR_INTERNAL_ERROR,
            "An error occurred while disabling family member.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/family/enable",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_family_enable(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Enable a managed family member (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"],
            ERR_FATHER_REQUIRED,
            "Privilege error: Father role required.",
        )
        return

    target_user_id = msg.get("user_id", "")
    service = _get_family_service(hass)

    try:
        await _verify_and_get_target_member(hass, service, target_user_id, father_id)
        await service.async_enable_family_user(target_user_id)
        member = service.get_family_member(target_user_id)
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "user_id": target_user_id,
                "status": member.status if member else "ACTIVE",
            },
        )
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
    except DomoluxFamilyUserError as err:
        _LOGGER.error("Error enabling family user '%s': %s", target_user_id, err)
        connection.send_error(msg["id"], ERR_INTERNAL_ERROR, str(err))
    except Exception as err:
        _LOGGER.error("Unexpected error enabling family user '%s': %s", target_user_id, err)
        connection.send_error(
            msg["id"],
            ERR_INTERNAL_ERROR,
            "An error occurred while enabling family member.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/family/change_password",
        vol.Required("user_id"): str,
        vol.Required("new_password"): str,
    }
)
@websocket_api.async_response
async def ws_family_change_password(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Change password for a managed family member and revoke sessions (Father only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"],
            ERR_FATHER_REQUIRED,
            "Privilege error: Father role required.",
        )
        return

    target_user_id = msg.get("user_id", "")
    new_password = msg.get("new_password", "")
    service = _get_family_service(hass)

    try:
        await _verify_and_get_target_member(hass, service, target_user_id, father_id)
        await service.async_change_family_user_password(target_user_id, new_password)
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "user_id": target_user_id,
            },
        )
    except ValueError as err:
        err_code, err_msg = err.args[0], err.args[1]
        connection.send_error(msg["id"], err_code, err_msg)
    except DomoluxInvalidInputError as err:
        connection.send_error(msg["id"], ERR_INVALID_INPUT, str(err))
    except DomoluxFamilyUserError as err:
        _LOGGER.error("Error changing password for family user '%s': %s", target_user_id, err)
        connection.send_error(msg["id"], ERR_INTERNAL_ERROR, str(err))
    except Exception as err:
        _LOGGER.error("Unexpected error changing password for family user '%s': %s", target_user_id, err)
        connection.send_error(
            msg["id"],
            ERR_INTERNAL_ERROR,
            "An error occurred while changing family member password.",
        )


@callback
def async_register_family_api_commands(hass: HomeAssistant) -> None:
    """Register Domolux Family WebSocket API commands with Home Assistant."""
    websocket_api.async_register_command(hass, ws_family_list)
    websocket_api.async_register_command(hass, ws_family_create)
    websocket_api.async_register_command(hass, ws_family_delete)
    websocket_api.async_register_command(hass, ws_family_disable)
    websocket_api.async_register_command(hass, ws_family_enable)
    websocket_api.async_register_command(hass, ws_family_change_password)
