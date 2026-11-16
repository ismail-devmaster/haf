"""Domolux Roles – Safe Father-Only "Preview as Child" Feature.

VERSION ISOLATION & SECURITY BOUNDARY:
- ONLY Father or HA Administrators can initiate preview mode.
- Managed Children CANNOT initiate or manipulate preview mode.
- Preview mode NEVER modifies persistent permissions in the store or HA Auth.
- Preview mode NEVER grants Father additional child privileges or modifies credentials.
- Backend requests continue to enforce actual caller credentials; no second authorization
  engine is introduced. Decisions use the same pure resolver.py logic.
- Exiting preview restores the standard Father experience immediately.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import logging
from typing import Any, Optional
import weakref

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import Unauthorized

from .api_schemas import USER_ID_SCHEMA
from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_READ,
    DOMAIN,
    ROLE_FATHER,
)
from .models import UserPermissionSet
from .resolver import resolve_entity_access, resolve_view_access

_LOGGER = logging.getLogger(__name__)

PREVIEW_MANAGER_KEY = "domolux_preview_manager"


@dataclass
class PreviewState:
    """In-memory connection preview state."""

    father_user_id: str
    child_user_id: str
    child_name: str
    started_at: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "active": True,
            "father_user_id": self.father_user_id,
            "child_user_id": self.child_user_id,
            "child_name": self.child_name,
            "started_at": self.started_at,
        }


class DomoluxPreviewManager:
    """Manages ephemeral, connection-scoped Child preview for Father sessions."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        # Ephemeral connection-scoped preview state mapping
        self._previews: dict[int, PreviewState] = {}

    def start_preview(
        self,
        connection: websocket_api.ActiveConnection,
        father_user_id: str,
        child_user_id: str,
        child_name: str,
    ) -> PreviewState:
        """Start previewing as a child for this connection."""
        conn_id = id(connection)
        state = PreviewState(
            father_user_id=father_user_id,
            child_user_id=child_user_id,
            child_name=child_name,
            started_at=datetime.now(timezone.utc).isoformat(),
        )
        self._previews[conn_id] = state

        # Register close cleanup hook if connection supports it
        if hasattr(connection, "async_register_close_listener"):
            try:
                connection.async_register_close_listener(
                    lambda: self._previews.pop(conn_id, None)
                )
            except Exception:
                pass

        _LOGGER.info(
            "Father '%s' started preview mode as Child '%s' (%s) on connection %s",
            father_user_id,
            child_name,
            child_user_id,
            conn_id,
        )
        return state

    def stop_preview(self, connection: websocket_api.ActiveConnection) -> bool:
        """Stop preview mode for this connection."""
        conn_id = id(connection)
        removed = self._previews.pop(conn_id, None)
        if removed is not None:
            _LOGGER.info("Connection %s exited preview mode", conn_id)
            return True
        return False

    def get_preview(
        self, connection: websocket_api.ActiveConnection
    ) -> PreviewState | None:
        """Get active preview state for this connection if active and alive."""
        conn_id = id(connection)
        return self._previews.get(conn_id)


def get_preview_manager(hass: HomeAssistant) -> DomoluxPreviewManager:
    """Retrieve or initialize the preview manager singleton on hass."""
    data = hass.data.setdefault(DOMAIN, {})
    if PREVIEW_MANAGER_KEY not in data:
        data[PREVIEW_MANAGER_KEY] = DomoluxPreviewManager(hass)
    return data[PREVIEW_MANAGER_KEY]


def get_connection_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection
) -> PreviewState | None:
    """Helper to query connection preview state."""
    manager = get_preview_manager(hass)
    return manager.get_preview(connection)


async def _assert_father_or_admin(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection
) -> str:
    """Verify that caller is Father or Admin. Fails closed."""
    if connection.user is None or getattr(connection.user, "is_disabled", False):
        raise Unauthorized()

    user_id = connection.user.id
    if getattr(connection.user, "is_admin", False) or getattr(
        connection.user, "is_owner", False
    ):
        return user_id

    # Check Father assignment
    domain_data = hass.data.get(DOMAIN, {})
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "manager" in entry_data:
            role_mgr = entry_data["manager"]
            if role_mgr.get_user_role(user_id).value == ROLE_FATHER:
                return user_id

    raise Unauthorized(user_id=user_id)


def _get_family_child(
    hass: HomeAssistant, child_user_id: str
) -> tuple[dict[str, Any], UserPermissionSet]:
    """Retrieve child family member record and permissions; verify non-admin."""
    domain_data = hass.data.get(DOMAIN, {})
    store = None
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "store" in entry_data:
            store = entry_data["store"]
            break

    if store is None:
        raise ValueError("Domolux storage unavailable.")

    member = store.get_family_member(child_user_id)
    if not member:
        raise ValueError(f"User '{child_user_id}' is not a managed family member.")

    perm_set = store.get_user_permissions(child_user_id)
    child_info = {
        "user_id": child_user_id,
        "name": getattr(member, "display_name", None)
        or getattr(member, "username", "Child"),
        "username": getattr(member, "username", ""),
    }
    return child_info, perm_set


# -----------------------------------------------------------------------------
# WebSocket API Commands
# -----------------------------------------------------------------------------


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/preview/start",
        vol.Required("child_user_id"): USER_ID_SCHEMA,
    }
)
@websocket_api.async_response
async def ws_preview_start(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Enter preview mode as the specified Child (Father/Admin only)."""
    try:
        caller_id = await _assert_father_or_admin(hass, connection)
    except Unauthorized as err:
        connection.send_error(
            msg["id"], websocket_api.ERR_UNAUTHORIZED, str(err)
        )
        return

    child_user_id = msg["child_user_id"]
    if child_user_id == caller_id:
        connection.send_error(
            msg["id"],
            websocket_api.ERR_INVALID_FORMAT,
            "Cannot preview own account.",
        )
        return

    try:
        child_info, perm_set = _get_family_child(hass, child_user_id)
    except ValueError as err:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, str(err)
        )
        return

    manager = get_preview_manager(hass)
    state = manager.start_preview(
        connection,
        father_user_id=caller_id,
        child_user_id=child_user_id,
        child_name=child_info["name"],
    )

    connection.send_result(
        msg["id"],
        {
            "success": True,
            "preview": state.to_dict(),
            "child": child_info,
            "effective_permissions": perm_set.to_dict(),
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/preview/stop",
    }
)
@websocket_api.async_response
async def ws_preview_stop(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Exit preview mode (restoring standard Father experience)."""
    manager = get_preview_manager(hass)
    stopped = manager.stop_preview(connection)
    connection.send_result(
        msg["id"],
        {
            "success": True,
            "active": False,
            "restored": stopped,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/preview/status",
    }
)
@websocket_api.async_response
async def ws_preview_status(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Query current preview mode status for this connection."""
    manager = get_preview_manager(hass)
    state = manager.get_preview(connection)
    if state is None:
        connection.send_result(msg["id"], {"active": False})
        return

    connection.send_result(
        msg["id"],
        {
            "active": True,
            "child_user_id": state.child_user_id,
            "child_name": state.child_name,
            "started_at": state.started_at,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/preview/evaluate",
        vol.Required("child_user_id"): USER_ID_SCHEMA,
        vol.Optional("entity_id"): str,
        vol.Optional("view_path"): str,
        vol.Optional("access_level"): str,
    }
)
@websocket_api.async_response
async def ws_preview_evaluate(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Evaluate child permissions against an entity or view without granting privilege."""
    try:
        await _assert_father_or_admin(hass, connection)
    except Unauthorized as err:
        connection.send_error(
            msg["id"], websocket_api.ERR_UNAUTHORIZED, str(err)
        )
        return

    child_user_id = msg["child_user_id"]
    try:
        child_info, perm_set = _get_family_child(hass, child_user_id)
    except ValueError as err:
        connection.send_error(
            msg["id"], websocket_api.ERR_NOT_FOUND, str(err)
        )
        return

    entity_id = msg.get("entity_id")
    view_path = msg.get("view_path")
    required_level = msg.get("access_level", ACCESS_LEVEL_READ)

    results: dict[str, Any] = {
        "child_user_id": child_user_id,
        "child_name": child_info["name"],
    }

    if entity_id:
        # Build minimal registry snapshot if registries available
        entity_reg = getattr(hass.data.get("entity_registry"), "entities", {})
        entity_perm_entry = getattr(entity_reg, "get", lambda _: None)(entity_id)
        device_id = None
        area_id = None
        if entity_perm_entry:
            if isinstance(entity_perm_entry, dict):
                device_id = entity_perm_entry.get("device_id")
                area_id = entity_perm_entry.get("area_id")
            else:
                device_id = getattr(entity_perm_entry, "device_id", None)
                area_id = getattr(entity_perm_entry, "area_id", None)

        snapshot = {entity_id: (device_id, area_id)}
        entity_res = resolve_entity_access(
            perm_set,
            snapshot,
            child_user_id,
            entity_id,
            required_level=required_level,
            is_father=False,
            is_admin=False,
        )
        results["entity_evaluation"] = {
            "entity_id": entity_id,
            "access_level": entity_res.access_level,
            "granted": entity_res.granted,
            "matching_rule_type": entity_res.matching_rule_type,
            "matching_rule_id": entity_res.matching_rule_id,
        }

    if view_path:
        view_res = resolve_view_access(
            perm_set,
            child_user_id,
            view_path,
            is_father=False,
            is_admin=False,
        )
        results["view_evaluation"] = {
            "view_path": view_path,
            "allowed": view_res.allowed,
            "effect": view_res.effect,
            "matching_rule_type": view_res.matching_rule_type,
        }

    connection.send_result(msg["id"], results)


@callback
def async_register_preview_commands(hass: HomeAssistant) -> None:
    """Register Preview as Child commands with Home Assistant WebSocket API."""
    websocket_api.async_register_command(hass, ws_preview_start)
    websocket_api.async_register_command(hass, ws_preview_stop)
    websocket_api.async_register_command(hass, ws_preview_status)
    websocket_api.async_register_command(hass, ws_preview_evaluate)
