"""WebSocket API endpoints for Domolux Roles management.

SECURITY INVARIANTS:
1. User identity is derived strictly from `connection.user.id`.
2. Admin/Owner privilege (`connection.user.is_admin or connection.user.is_owner`)
   is strictly required for management commands (`users/list`, `set_father`, `remove_father`).
3. Disabled admin users are denied access.
4. Non-admin users (including 'father' users) calling management APIs are rejected with `ERR_UNAUTHORIZED`.
5. Target user eligibility (non-admin, non-owner, active, existing) is validated server-side.
"""

import logging
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
import voluptuous as vol

from .const import DOMAIN, ROLE_FATHER, ROLE_USER
from .models import DomoluxRoleValidationError
from .role_manager import DomoluxRoleManager

_LOGGER = logging.getLogger(__name__)


def _get_manager(hass: HomeAssistant) -> DomoluxRoleManager:
    """Retrieve active DomoluxRoleManager instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "manager" in entry_data:
            return entry_data["manager"]
    raise RuntimeError("DomoluxRoleManager instance not found in hass.data.")


def _require_admin(connection: websocket_api.ActiveConnection) -> None:
    """Check if the connected user is an active Home Assistant Administrator or Owner."""
    user = connection.user
    if user is None or getattr(user, "is_disabled", False):
        raise websocket_api.Unauthorized()
    if not (getattr(user, "is_admin", False) or getattr(user, "is_owner", False)):
        raise websocket_api.Unauthorized(user_id=user.id)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/role/get",
    }
)
@websocket_api.async_response
async def ws_get_role(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Get the authenticated user's Domolux application role."""
    if connection.user is None or getattr(connection.user, "is_disabled", False):
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Unauthenticated or disabled connection.",
        )
        return

    try:
        manager = _get_manager(hass)
        role = manager.get_user_role(connection.user.id)
        father = manager.get_father_assignment()

        connection.send_result(
            msg["id"],
            {
                "user_id": connection.user.id,
                "role": role.value,
                "is_father": role.value == ROLE_FATHER,
                "father_assigned": father is not None,
            },
        )
    except Exception as err:
        _LOGGER.error("Failed to query Domolux role: %s", err)
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNKNOWN_ERROR,
            "An error occurred while retrieving role.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/users/list",
    }
)
@websocket_api.async_response
async def ws_list_eligible_users(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """List Home Assistant users eligible for Father assignment (Admin only)."""
    try:
        _require_admin(connection)
    except websocket_api.Unauthorized:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Privilege error: Administrator access required.",
        )
        return

    try:
        if not hasattr(hass, "auth") or hass.auth is None:
            connection.send_result(msg["id"], [])
            return

        all_users = await hass.auth.async_get_users()
        eligible_users = []

        for user in all_users:
            is_admin = getattr(user, "is_admin", False)
            is_owner = getattr(user, "is_owner", False)
            is_disabled = getattr(user, "is_disabled", False)
            is_system_generated = getattr(user, "system_generated", False)

            # Eligibility filter: non-admin, non-owner, active, non-system
            if (
                not is_admin
                and not is_owner
                and not is_disabled
                and not is_system_generated
            ):
                eligible_users.append(
                    {
                        "id": user.id,
                        "name": getattr(user, "name", "User"),
                        "username": getattr(user, "username", None),
                    }
                )

        connection.send_result(msg["id"], eligible_users)
    except Exception as err:
        _LOGGER.error("Failed to list eligible users: %s", err)
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNKNOWN_ERROR,
            "Failed to retrieve user list.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/role/set_father",
        vol.Required("user_id"): str,
    }
)
@websocket_api.async_response
async def ws_set_father(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Assign the Father role to a specified non-admin user (Admin only)."""
    try:
        _require_admin(connection)
    except websocket_api.Unauthorized:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Privilege error: Administrator access required.",
        )
        return

    target_user_id = msg.get("user_id")

    try:
        manager = _get_manager(hass)
        assigner_id = connection.user.id if connection.user else "system"

        assignment = await manager.async_assign_father(
            target_user_id=target_user_id,
            assigned_by_user_id=assigner_id,
        )

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "user_id": assignment.user_id,
                "status": assignment.status.value,
                "assigned_at": assignment.assigned_at,
            },
        )
    except DomoluxRoleValidationError as err:
        _LOGGER.warning(
            "Father role assignment rejected by policy: %s", err
        )
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            str(err),
        )
    except Exception as err:
        _LOGGER.error("Failed to assign Father role: %s", err)
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNKNOWN_ERROR,
            "An unexpected error occurred during role assignment.",
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/role/remove_father",
    }
)
@websocket_api.async_response
async def ws_remove_father(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Remove current Father assignment (Admin only)."""
    try:
        _require_admin(connection)
    except websocket_api.Unauthorized:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNAUTHORIZED,
            "Privilege error: Administrator access required.",
        )
        return

    try:
        manager = _get_manager(hass)
        revoked = await manager.async_revoke_father()

        connection.send_result(
            msg["id"],
            {
                "success": True,
                "revoked": revoked,
            },
        )
    except Exception as err:
        _LOGGER.error("Failed to revoke Father role: %s", err)
        connection.send_error(
            msg["id"],
            websocket_api.ERR_UNKNOWN_ERROR,
            "An error occurred while revoking Father role.",
        )


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register Domolux Roles WebSocket commands with Home Assistant."""
    websocket_api.async_register_command(hass, ws_get_role)
    websocket_api.async_register_command(hass, ws_list_eligible_users)
    websocket_api.async_register_command(hass, ws_set_father)
    websocket_api.async_register_command(hass, ws_remove_father)
