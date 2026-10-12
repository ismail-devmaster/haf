"""Domolux View Management & Protection WebSocket API Broker.

SECURITY INVARIANTS & POLICIES:
1. Server-Side Father Authorization for Mutations:
   - `domolux/view/create`, `domolux/view/update`, `domolux/view/delete` strictly require Father role.
   - Non-Father users (including HA Admins and HA Owners without the Father role) are denied mutation rights.
2. Derivation of User Identity:
   - Read operations derive identity strictly from the authenticated WebSocket connection (`connection.user.id`).
   - Target `user_id` parameter is NEVER accepted for read commands.
3. Access Control & Entity Data Redaction:
   - `domolux/view/list` filters returned views using `DomoluxPermissionEvaluator.evaluate_view_access()`.
   - `domolux/view/get` verifies view access and redacts entity bindings for entities the caller lacks READ access to.
4. Security & Data Integrity:
   - Zero credential field leaks (passwords, tokens, secrets, hashes).
   - Executable HTML/script injection string rejection.
   - Standardized machine-readable error codes.
5. Real-Time Subscriptions:
   - `domolux/view/subscribe` registers WebSocket live updates.
   - Fires `domolux_view_updated` bus events on create, update, delete.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import Unauthorized
import voluptuous as vol

from .const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_READ, DOMAIN
from .family_api import ERR_FATHER_REQUIRED, ERR_INVALID_INPUT, _require_father
from .permission_evaluator import DomoluxPermissionEvaluator
from .store import DomoluxRoleStore
from .view_manager import (
    DomoluxFatherRequiredError,
    DomoluxViewManager,
    DomoluxViewNotFoundError,
)
from .view_models import DomoluxViewValidationError
from .view_store import DuplicateViewPathError, DomoluxViewStore

_LOGGER = logging.getLogger(__name__)

# Machine-readable error code constants
ERR_UNAUTHORIZED = "unauthorized"
ERR_ACCESS_DENIED = "access_denied"
ERR_VIEW_NOT_FOUND = "view_not_found"
ERR_DUPLICATE_VIEW_PATH = "duplicate_view_path"
ERR_PERMISSION_DENIED = "permission_denied"
ERR_INTERNAL_ERROR = "internal_error"


def _get_view_manager(hass: HomeAssistant) -> DomoluxViewManager:
    """Retrieve active DomoluxViewManager instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    if "view_manager" in domain_data:
        return domain_data["view_manager"]
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "view_manager" in entry_data:
            return entry_data["view_manager"]
    raise RuntimeError("DomoluxViewManager instance not found in hass.data.")


def _get_view_store(hass: HomeAssistant) -> DomoluxViewStore:
    """Retrieve active DomoluxViewStore instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    if "view_store" in domain_data:
        return domain_data["view_store"]
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "view_store" in entry_data:
            return entry_data["view_store"]
    raise RuntimeError("DomoluxViewStore instance not found in hass.data.")


def _get_role_store(hass: HomeAssistant) -> DomoluxRoleStore:
    """Retrieve active DomoluxRoleStore instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    if "store" in domain_data:
        return domain_data["store"]
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "store" in entry_data:
            return entry_data["store"]
    raise RuntimeError("DomoluxRoleStore instance not found in hass.data.")


def _get_evaluator(hass: HomeAssistant) -> DomoluxPermissionEvaluator:
    """Retrieve active DomoluxPermissionEvaluator instance from hass.data."""
    domain_data = hass.data.get(DOMAIN, {})
    if "evaluator" in domain_data:
        return domain_data["evaluator"]
    for entry_data in domain_data.values():
        if isinstance(entry_data, dict) and "evaluator" in entry_data:
            return entry_data["evaluator"]
    raise RuntimeError("DomoluxPermissionEvaluator instance not found in hass.data.")


def _async_fire_view_updated(
    hass: HomeAssistant, action: str, view_id: str, view_path: str
) -> None:
    """Fire domolux_view_updated event on Home Assistant event bus."""
    hass.bus.async_fire(
        "domolux_view_updated",
        {
            "action": action,
            "view_id": view_id,
            "view_path": view_path,
        },
    )


async def _is_user_disabled(hass: HomeAssistant, user_id: str) -> bool:
    """Check if managed family member account is disabled."""
    try:
        store = _get_role_store(hass)
        member = store.get_family_member(user_id)
        if member and member.status == "disabled":
            return True
    except RuntimeError:
        pass
    return False


# ----------------------------------------------------------------------
# WebSocket Handlers
# ----------------------------------------------------------------------

@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/view/list",
    }
)
@websocket_api.async_response
async def ws_view_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """List accessible Domolux Views for calling user."""
    if connection.user is None:
        connection.send_error(
            msg["id"], ERR_UNAUTHORIZED, "Unauthorized user connection."
        )
        return

    user_id = connection.user.id
    if await _is_user_disabled(hass, user_id):
        connection.send_error(
            msg["id"], ERR_ACCESS_DENIED, "User account is disabled."
        )
        return

    view_manager = _get_view_manager(hass)
    evaluator = _get_evaluator(hass)

    all_views = view_manager.list_views()
    is_father = evaluator._is_father(user_id)
    is_admin = await evaluator._is_admin_or_owner(user_id)

    accessible_summaries = []
    for view in all_views:
        if is_father or is_admin:
            allowed = True
        else:
            view_eval = await evaluator.evaluate_view_access(user_id, view.view_path)
            allowed = view_eval.allowed

        if allowed:
            accessible_summaries.append(
                {
                    "view_id": view.view_id,
                    "view_path": view.view_path,
                    "title": view.title,
                    "icon": view.icon,
                    "layout": view.layout,
                    "card_count": len(view.cards),
                    "updated_at": view.updated_at,
                }
            )

    connection.send_result(msg["id"], {"views": accessible_summaries})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/view/get",
        vol.Optional("view_id"): str,
        vol.Optional("view_path"): str,
    }
)
@websocket_api.async_response
async def ws_view_get(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Fetch a specific Domolux View with entity binding redaction."""
    if connection.user is None:
        connection.send_error(
            msg["id"], ERR_UNAUTHORIZED, "Unauthorized user connection."
        )
        return

    view_id = msg.get("view_id")
    view_path = msg.get("view_path")

    if (view_id is None and view_path is None) or (
        view_id is not None and view_path is not None
    ):
        connection.send_error(
            msg["id"],
            ERR_INVALID_INPUT,
            "Must specify exactly one of 'view_id' or 'view_path'.",
        )
        return

    user_id = connection.user.id
    if await _is_user_disabled(hass, user_id):
        connection.send_error(
            msg["id"], ERR_ACCESS_DENIED, "User account is disabled."
        )
        return

    view_manager = _get_view_manager(hass)
    evaluator = _get_evaluator(hass)

    if view_id:
        view = view_manager.get_view(view_id)
    else:
        view = view_manager.get_view_by_path(view_path)

    if view is None:
        connection.send_error(
            msg["id"], ERR_VIEW_NOT_FOUND, "Requested View not found."
        )
        return

    is_father = evaluator._is_father(user_id)
    is_admin = await evaluator._is_admin_or_owner(user_id)

    if not (is_father or is_admin):
        view_eval = await evaluator.evaluate_view_access(user_id, view.view_path)
        if not view_eval.allowed:
            connection.send_error(
                msg["id"], ERR_ACCESS_DENIED, "Access denied to requested View."
            )
            return

    view_dict = view.to_dict()

    # Apply Entity Binding Data Redaction for non-Father/non-Admin users
    if not (is_father or is_admin):
        for card_dict in view_dict.get("cards", []):
            entities_raw = card_dict.get("entities", [])
            redacted_entities = []
            for binding_dict in entities_raw:
                entity_id = binding_dict.get("entity_id")
                req_access = binding_dict.get(
                    "required_access", ACCESS_LEVEL_READ
                )
                if entity_id:
                    ent_eval = await evaluator.evaluate_entity_access(
                        user_id, entity_id, required_level=req_access
                    )
                    if ent_eval.granted:
                        redacted_entities.append(binding_dict)
            card_dict["entities"] = redacted_entities

    connection.send_result(msg["id"], {"view": view_dict})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/view/create",
        vol.Required("title"): str,
        vol.Required("view_path"): str,
        vol.Optional("icon"): str,
        vol.Optional("layout"): str,
        vol.Optional("cards"): list,
    }
)
@websocket_api.async_response
async def ws_view_create(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Create a new Domolux Protected View (Father-only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    view_manager = _get_view_manager(hass)

    title = msg["title"]
    view_path = msg["view_path"]
    icon = msg.get("icon", "mdi:view-dashboard")
    layout = msg.get("layout", "grid")
    cards = msg.get("cards")

    try:
        view = await view_manager.async_create_view(
            caller_user_id=father_id,
            title=title,
            view_path=view_path,
            icon=icon,
            layout=layout,
            cards=cards,
        )
    except DomoluxFatherRequiredError as err:
        connection.send_error(msg["id"], ERR_FATHER_REQUIRED, str(err))
        return
    except DuplicateViewPathError as err:
        connection.send_error(msg["id"], ERR_DUPLICATE_VIEW_PATH, str(err))
        return
    except DomoluxViewValidationError as err:
        connection.send_error(msg["id"], ERR_INVALID_INPUT, str(err))
        return
    except Exception as err:
        _LOGGER.error("Failed to create Domolux View: %s", err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Failed to create View: {err}"
        )
        return

    _async_fire_view_updated(hass, "created", view.view_id, view.view_path)
    connection.send_result(msg["id"], {"success": True, "view": view.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/view/update",
        vol.Required("view_id"): str,
        vol.Required("updates"): dict,
    }
)
@websocket_api.async_response
async def ws_view_update(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Update an existing Domolux Protected View (Father-only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    view_manager = _get_view_manager(hass)
    view_id = msg["view_id"]
    updates = msg["updates"]

    try:
        updated_view = await view_manager.async_update_view(
            caller_user_id=father_id,
            view_id=view_id,
            updates=updates,
        )
    except DomoluxFatherRequiredError as err:
        connection.send_error(msg["id"], ERR_FATHER_REQUIRED, str(err))
        return
    except DomoluxViewNotFoundError as err:
        connection.send_error(msg["id"], ERR_VIEW_NOT_FOUND, str(err))
        return
    except DuplicateViewPathError as err:
        connection.send_error(msg["id"], ERR_DUPLICATE_VIEW_PATH, str(err))
        return
    except DomoluxViewValidationError as err:
        connection.send_error(msg["id"], ERR_INVALID_INPUT, str(err))
        return
    except Exception as err:
        _LOGGER.error("Failed to update Domolux View ID %s: %s", view_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Failed to update View: {err}"
        )
        return

    _async_fire_view_updated(
        hass, "updated", updated_view.view_id, updated_view.view_path
    )
    connection.send_result(msg["id"], {"success": True, "view": updated_view.to_dict()})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/view/delete",
        vol.Required("view_id"): str,
    }
)
@websocket_api.async_response
async def ws_view_delete(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Delete an existing Domolux Protected View (Father-only)."""
    try:
        father_id = await _require_father(hass, connection)
    except Unauthorized:
        connection.send_error(
            msg["id"], ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )
        return

    view_manager = _get_view_manager(hass)
    view_id = msg["view_id"]

    existing = view_manager.get_view(view_id)
    if existing is None:
        connection.send_error(
            msg["id"], ERR_VIEW_NOT_FOUND, f"View with ID '{view_id}' not found."
        )
        return

    view_path = existing.view_path

    try:
        await view_manager.async_delete_view(
            caller_user_id=father_id,
            view_id=view_id,
        )
    except DomoluxFatherRequiredError as err:
        connection.send_error(msg["id"], ERR_FATHER_REQUIRED, str(err))
        return
    except DomoluxViewNotFoundError as err:
        connection.send_error(msg["id"], ERR_VIEW_NOT_FOUND, str(err))
        return
    except Exception as err:
        _LOGGER.error("Failed to delete Domolux View ID %s: %s", view_id, err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Failed to delete View: {err}"
        )
        return

    _async_fire_view_updated(hass, "deleted", view_id, view_path)
    connection.send_result(msg["id"], {"success": True, "view_id": view_id})


async def _async_forward_evaluated_event(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg_id: int,
    user_id: str,
    action: str,
    view_id: str,
    view_path: str,
) -> None:
    """Re-evaluate view access and forward real-time event to subscriber."""
    if await _is_user_disabled(hass, user_id):
        connection.send_event(
            msg_id,
            {"action": "access_revoked", "view_id": view_id, "view_path": view_path},
        )
        return

    evaluator = _get_evaluator(hass)
    res = await evaluator.evaluate_view_access(user_id, view_path)
    if not res.allowed:
        connection.send_event(
            msg_id,
            {"action": "access_revoked", "view_id": view_id, "view_path": view_path},
        )
    else:
        connection.send_event(
            msg_id,
            {"action": action, "view_id": view_id, "view_path": view_path},
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/view/subscribe",
        vol.Optional("view_id"): str,
        vol.Optional("view_path"): str,
    }
)
@websocket_api.async_response
async def ws_view_subscribe(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Subscribe to real-time Domolux View update events."""
    if connection.user is None:
        connection.send_error(
            msg["id"], ERR_UNAUTHORIZED, "Unauthorized user connection."
        )
        return

    user_id = connection.user.id
    if await _is_user_disabled(hass, user_id):
        connection.send_error(
            msg["id"], ERR_ACCESS_DENIED, "User account is disabled."
        )
        return

    view_id = msg.get("view_id")
    view_path = msg.get("view_path")

    target_view_id: str | None = None

    if view_id or view_path:
        view_manager = _get_view_manager(hass)
        evaluator = _get_evaluator(hass)

        view = (
            view_manager.get_view(view_id)
            if view_id
            else view_manager.get_view_by_path(view_path)
        )
        if view is None:
            connection.send_error(
                msg["id"], ERR_VIEW_NOT_FOUND, "Requested View not found."
            )
            return

        target_view_id = view.view_id

        is_father = evaluator._is_father(user_id)
        is_admin = await evaluator._is_admin_or_owner(user_id)
        if not (is_father or is_admin):
            view_eval = await evaluator.evaluate_view_access(user_id, view.view_path)
            if not view_eval.allowed:
                connection.send_error(
                    msg["id"], ERR_ACCESS_DENIED, "Access denied to requested View."
                )
                return

    @callback
    def forward_event(event: Any) -> None:
        event_data = event.data
        evt_view_id = event_data.get("view_id")
        evt_view_path = event_data.get("view_path", "")
        action = event_data.get("action", "updated")

        if target_view_id and evt_view_id != target_view_id:
            return

        hass.async_create_task(
            _async_forward_evaluated_event(
                hass, connection, msg["id"], user_id, action, evt_view_id, evt_view_path
            )
        )

    unsub = hass.bus.async_listen("domolux_view_updated", forward_event)
    connection.subscriptions[msg["id"]] = unsub
    connection.send_result(msg["id"])


async def async_register_view_api_commands(hass: HomeAssistant) -> None:
    """Register all Domolux View WebSocket API commands."""
    websocket_api.async_register_command(hass, ws_view_list)
    websocket_api.async_register_command(hass, ws_view_get)
    websocket_api.async_register_command(hass, ws_view_create)
    websocket_api.async_register_command(hass, ws_view_update)
    websocket_api.async_register_command(hass, ws_view_delete)
    websocket_api.async_register_command(hass, ws_view_subscribe)
