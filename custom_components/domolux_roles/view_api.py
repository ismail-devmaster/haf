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

import asyncio
import logging
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import Unauthorized
import voluptuous as vol

from .api_schemas import (
    BOUNDED_STR,
    SANITIZED_DISPLAY_NAME,
    VIEW_PATH_SCHEMA,
    VIEW_UUID_SCHEMA,
)
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
        vol.Optional("view_id"): VIEW_UUID_SCHEMA,
        vol.Optional("view_path"): VIEW_PATH_SCHEMA,
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
        vol.Required("title"): SANITIZED_DISPLAY_NAME,
        vol.Required("view_path"): VIEW_PATH_SCHEMA,
        vol.Optional("icon"): BOUNDED_STR,
        vol.Optional("layout"): vol.In(["grid", "masonry", "sections", "single-column"]),
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
        vol.Required("view_id"): VIEW_UUID_SCHEMA,
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
        vol.Required("view_id"): VIEW_UUID_SCHEMA,
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
        vol.Optional("view_id"): VIEW_UUID_SCHEMA,
        vol.Optional("view_path"): VIEW_PATH_SCHEMA,
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


# ----------------------------------------------------------------------
# Catalog API — Phase 2: Read-only parent-authorized device / entity discovery
# ----------------------------------------------------------------------

from homeassistant.helpers import device_registry as dr, entity_registry as er, area_registry as ar
from .dependency_discovery import extract_entities_from_card, extract_entities_from_view

NON_HOUSEHOLD_NAME_KEYWORDS = (
    "samba",
    "tailscale",
    "openwakeword",
    "piper",
    "whisper",
    "kiosk mode",
    "smartir",
    "check button card",
    "mini-graph-card",
    "silent remotes card",
    "hacs",
    "supervisor",
    "home assistant frontend",
    "home assistant operating system",
)

HOUSEHOLD_DOMAINS = {
    "light",
    "switch",
    "cover",
    "climate",
    "fan",
    "lock",
    "media_player",
    "vacuum",
    "valve",
    "humidifier",
    "water_heater",
    "camera",
    "sensor",
    "binary_sensor",
    "alarm_control_panel",
    "remote",
    "siren",
}

CONTROLLABLE_DOMAINS = {
    "light",
    "switch",
    "cover",
    "climate",
    "fan",
    "lock",
    "media_player",
    "vacuum",
    "valve",
    "humidifier",
    "water_heater",
    "button",
    "input_boolean",
    "input_button",
    "input_number",
    "input_select",
    "input_text",
    "number",
    "select",
}

DOMAIN_ICONS = {
    "cover": "mdi:window-shutter",
    "light": "mdi:lightbulb",
    "switch": "mdi:toggle-switch",
    "climate": "mdi:thermostat",
    "fan": "mdi:fan",
    "lock": "mdi:lock",
    "media_player": "mdi:cast",
    "vacuum": "mdi:robot-vacuum",
    "valve": "mdi:pipe-valve",
    "humidifier": "mdi:air-humidifier",
    "water_heater": "mdi:water-boiler",
    "camera": "mdi:camera",
    "sensor": "mdi:eye",
    "binary_sensor": "mdi:radiobox-marked",
    "alarm_control_panel": "mdi:shield-home",
    "remote": "mdi:remote",
    "siren": "mdi:bullhorn",
}


def _get_device_icon(domain: str | None) -> str:
    """Return appropriate MDI icon for a domain."""
    if not domain:
        return "mdi:devices"
    return DOMAIN_ICONS.get(domain, "mdi:devices")


def _is_non_household_name(name: Any) -> bool:
    """Check if name matches non-household keywords."""
    if not isinstance(name, str):
        return False
    lower = name.lower()
    return any(kw in lower for kw in NON_HOUSEHOLD_NAME_KEYWORDS)


def _extract_entity_name(entry: Any) -> str | None:
    """Safely extract user-defined or original name from an entity registry entry or mock."""
    for attr in ("name", "name_by_user"):
        val = getattr(entry, attr, None)
        if isinstance(val, str) and val.strip():
            return val.strip()
    orig = getattr(entry, "original_name", None)
    if isinstance(orig, str) and orig.strip():
        return orig.strip()
    return None


def _get_entry_domain(entry: Any) -> str:
    """Safely resolve domain from an entity entry, state, or entity_id string."""
    domain = getattr(entry, "domain", None)
    if isinstance(domain, str) and domain:
        return domain
    eid = getattr(entry, "entity_id", None)
    if isinstance(eid, str) and "." in eid:
        return eid.split(".")[0]
    return "unknown"


def _extract_device_name(dev: Any) -> str:
    """Safely extract device name from a device registry entry or mock."""
    for attr in ("name_by_user", "name", "model", "default_name"):
        val = getattr(dev, attr, None)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return "Unnamed device"


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/catalog",
    }
)
@websocket_api.async_response
async def ws_catalog(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Read-only catalog of registered devices and entities (parent-authorized)."""
    if connection.user is None:
        connection.send_error(msg["id"], ERR_UNAUTHORIZED, "Unauthorized.")
        return
    user_id = connection.user.id
    evaluator = _get_evaluator(hass)
    is_father = evaluator._is_father(user_id)
    # Authorize only father (existing policy for parent-level reads)
    if not is_father:
        connection.send_error(msg["id"], ERR_ACCESS_DENIED, "Catalog access requires father role.")
        return

    # Registry discovery (read-only; no state mutation)
    device_reg = dr.async_get(hass)
    entity_reg = er.async_get(hass)
    area_reg = ar.async_get(hass)

    devices_result: list[dict] = []
    entities_result: list[dict] = []
    seen_entity_ids: set[str] = set()
    seen_device_ids: set[str] = set()

    # Pre-collect entity registry entries (handles real HA EntityRegistryItems Mapping, dict, or list)
    if hasattr(entity_reg, "entities"):
        entity_entries = (
            list(entity_reg.entities.values())
            if hasattr(entity_reg.entities, "values") and callable(entity_reg.entities.values)
            else (list(entity_reg.entities) if isinstance(entity_reg.entities, (list, tuple, set)) else [])
        )
    else:
        entity_entries = []

    device_entities_map: dict[str, list[Any]] = {}
    for e in entity_entries:
        dev_id = getattr(e, "device_id", None)
        if dev_id:
            device_entities_map.setdefault(dev_id, []).append(e)

    # Devices from registry
    dev_items = (
        list(device_reg.devices.values())
        if hasattr(device_reg.devices, "values") and callable(device_reg.devices.values)
        else (list(device_reg.devices) if isinstance(device_reg.devices, (list, tuple, set)) else [])
    )
    for dev in dev_items:
        device_id = getattr(dev, "id", None)
        if not device_id or not isinstance(device_id, str):
            continue
        name = _extract_device_name(dev)
        area_id = getattr(dev, "area_id", None)
        area_obj = area_reg.async_get_area(area_id) if (area_id and hasattr(area_reg, "async_get_area")) else None
        area_name = getattr(area_obj, "name", None) if area_obj else None
        
        # Check service entry type and non-household names
        dev_entry_type = getattr(dev, "entry_type", None)
        is_service = (
            dev_entry_type == "service"
            or str(dev_entry_type).lower().endswith("service")
            or (hasattr(dr, "DeviceEntryType") and dev_entry_type == getattr(dr.DeviceEntryType, "SERVICE", None))
        )
        if is_service or _is_non_household_name(name):
            continue

        raw_entries = list(device_entities_map.get(device_id, []))
        if not raw_entries and callable(getattr(er, "async_entries_for_device", None)):
            try:
                found_entries = er.async_entries_for_device(
                    entity_reg, device_id, include_disabled_entities=True
                )
                if isinstance(found_entries, (list, tuple, set)):
                    raw_entries = [e for e in found_entries if getattr(e, "entity_id", None)]
            except Exception as err:
                _LOGGER.debug("Error fetching entries for device %s: %s", device_id, err)

        if not raw_entries and hasattr(entity_reg, "entities") and callable(getattr(entity_reg.entities, "get_entries_for_device_id", None)):
            try:
                found_entries = entity_reg.entities.get_entries_for_device_id(
                    device_id, include_disabled_entities=True
                )
                if isinstance(found_entries, (list, tuple, set)):
                    raw_entries = [e for e in found_entries if getattr(e, "entity_id", None)]
            except Exception as err:
                _LOGGER.debug("Error getting entries for device id %s: %s", device_id, err)
        
        # Filter to household / controllable entities
        hh_entries = [
            e for e in raw_entries 
            if _get_entry_domain(e) in HOUSEHOLD_DOMAINS or _get_entry_domain(e) in CONTROLLABLE_DOMAINS
        ]
        # If device has entities but none are household, skip it (e.g. update-only devices)
        if raw_entries and not hh_entries:
            continue

        ctrl_entries = [e for e in hh_entries if _get_entry_domain(e) in CONTROLLABLE_DOMAINS]
        is_multi_entity = len(ctrl_entries) > 1
        primary_domain = _get_entry_domain(ctrl_entries[0]) if ctrl_entries else (_get_entry_domain(hh_entries[0]) if hh_entries else None)

        channels = []
        target_entries = ctrl_entries if ctrl_entries else hh_entries
        for e in target_entries:
            state_obj = hass.states.get(e.entity_id)
            friendly_name = (
                state_obj.attributes.get("friendly_name")
                if state_obj and hasattr(state_obj, "attributes") and isinstance(state_obj.attributes, dict)
                else None
            )
            if not isinstance(friendly_name, str):
                friendly_name = None
            entry_name = _extract_entity_name(e)
            channel_name = entry_name or friendly_name or getattr(e, "entity_id", None) or "Unknown entity"
            e_domain = _get_entry_domain(e)
            channels.append({
                "entity_id": e.entity_id,
                "name": channel_name,
                "domain": e_domain,
                "icon": _get_device_icon(e_domain),
                "capabilities": ["read", "control"] if e_domain in CONTROLLABLE_DOMAINS else ["read"],
            })

        if name == "Unnamed device" and channels:
            name = channels[0]["name"]

        seen_device_ids.add(device_id)
        devices_result.append({
            "device_id": device_id,
            "target_id": device_id,
            "target_type": "device",
            "name": name,
            "area_id": area_id,
            "area_name": area_name,
            "domain": primary_domain or "device",
            "icon": _get_device_icon(primary_domain),
            "entity_count": len(raw_entries),
            "is_multi_entity": is_multi_entity,
            "capabilities": ["read", "control"] if ctrl_entries else ["read"],
            "channels": channels,
            "primary_entity_id": ctrl_entries[0].entity_id if ctrl_entries else (hh_entries[0].entity_id if hh_entries else None),
            "entities": [e.entity_id for e in raw_entries],
        })

    # Entities from registry + state-machine merge
    entity_entries = (
        list(entity_reg.entities.values())
        if hasattr(entity_reg.entities, "values")
        else list(entity_reg.entities)
    )

    for entry in entity_entries:
        entity_id = getattr(entry, "entity_id", None)
        if not entity_id or not isinstance(entity_id, str):
            continue
        if entity_id in seen_entity_ids:
            continue
        seen_entity_ids.add(entity_id)

        state_obj = hass.states.get(entity_id)
        friendly_name = (
            state_obj.attributes.get("friendly_name")
            if state_obj and hasattr(state_obj, "attributes") and isinstance(state_obj.attributes, dict)
            else None
        )
        if not isinstance(friendly_name, str):
            friendly_name = None
        entry_name = _extract_entity_name(entry)
        name = entry_name or friendly_name or entity_id
        domain = _get_entry_domain(entry)
        device_id = getattr(entry, "device_id", None)
        device_name = None
        if device_id:
            d = device_reg.async_get(device_id) if hasattr(device_reg, "async_get") else device_reg.devices.get(device_id)
            if d:
                d_name = _extract_device_name(d)
                if d_name != "Unnamed device":
                    device_name = d_name
        area_id = getattr(entry, "area_id", None)
        area_obj = area_reg.async_get_area(area_id) if (area_id and hasattr(area_reg, "async_get_area")) else None
        area_name = getattr(area_obj, "name", None) if area_obj else None
        disabled = getattr(entry, "disabled_by", None) is not None
        # State presence indicator (safe: only available/unavailable, never value)
        state_available = state_obj.state if state_obj else None
        is_unavailable = state_obj is not None and state_obj.state == "unavailable"
        entities_result.append({
            "entity_id": entity_id,
            "name": name,
            "domain": domain,
            "device_id": device_id,
            "device_name": device_name,
            "area_id": area_id,
            "area_name": area_name,
            "registry_managed": True,
            "disabled": disabled,
            "state_available": state_available is not None,
            "unavailable": is_unavailable,
        })

        # Standalone household entity (not belonging to an existing registered device)
        if (
            (not device_id or device_id not in seen_device_ids)
            and (domain in HOUSEHOLD_DOMAINS or domain in CONTROLLABLE_DOMAINS)
            and not _is_non_household_name(name)
        ):
            seen_device_ids.add(f"entity:{entity_id}")
            devices_result.append({
                "device_id": f"entity:{entity_id}",
                "target_id": entity_id,
                "target_type": "entity",
                "name": name,
                "area_id": area_id,
                "area_name": area_name,
                "domain": domain,
                "icon": _get_device_icon(domain),
                "entity_count": 1,
                "is_multi_entity": False,
                "capabilities": ["read", "control"] if domain in CONTROLLABLE_DOMAINS else ["read"],
                "channels": [{
                    "entity_id": entity_id,
                    "name": name,
                    "domain": domain,
                    "icon": _get_device_icon(domain),
                    "capabilities": ["read", "control"] if domain in CONTROLLABLE_DOMAINS else ["read"],
                }],
                "primary_entity_id": entity_id,
                "entities": [entity_id],
            })

    # Include state-machine-only entities (not in registry) — minimal safe metadata
    raw_state_ids: list[str] = []
    try:
        if hasattr(hass.states, "async_entity_ids"):
            res = hass.states.async_entity_ids()
            if isinstance(res, (list, tuple, set)):
                raw_state_ids = list(res)
        if not raw_state_ids and hasattr(hass.states, "entity_ids"):
            e_func = getattr(hass.states, "entity_ids")
            if callable(e_func):
                res = e_func()
                if isinstance(res, (list, tuple, set)):
                    raw_state_ids = list(res)
            elif isinstance(e_func, (list, tuple, set)):
                raw_state_ids = list(e_func)
        if not raw_state_ids and hasattr(hass.states, "async_all"):
            res = hass.states.async_all()
            if isinstance(res, (list, tuple, set)):
                raw_state_ids = [getattr(s, "entity_id", None) for s in res if getattr(s, "entity_id", None)]
    except Exception:
        raw_state_ids = []

    for entity_id in raw_state_ids:
        if not entity_id or not isinstance(entity_id, str):
            continue
        if entity_id in seen_entity_ids:
            continue
        state_obj = hass.states.get(entity_id)
        if not state_obj:
            continue
        seen_entity_ids.add(entity_id)
        domain = _get_entry_domain(state_obj)
        friendly_name = (
            state_obj.attributes.get("friendly_name")
            if hasattr(state_obj, "attributes") and isinstance(state_obj.attributes, dict)
            else None
        )
        name = friendly_name or entity_id
        entities_result.append({
            "entity_id": entity_id,
            "name": name,
            "domain": domain,
            "device_id": None,
            "device_name": None,
            "area_id": None,
            "area_name": None,
            "registry_managed": False,
            "disabled": False,
            "state_available": True,
            "unavailable": state_obj.state == "unavailable",
        })

        # Standalone state entity for household domain
        if (domain in HOUSEHOLD_DOMAINS or domain in CONTROLLABLE_DOMAINS) and not _is_non_household_name(name):
            seen_device_ids.add(f"entity:{entity_id}")
            devices_result.append({
                "device_id": f"entity:{entity_id}",
                "target_id": entity_id,
                "target_type": "entity",
                "name": name,
                "area_id": None,
                "area_name": None,
                "domain": domain,
                "icon": _get_device_icon(domain),
                "entity_count": 1,
                "is_multi_entity": False,
                "capabilities": ["read", "control"] if domain in CONTROLLABLE_DOMAINS else ["read"],
                "channels": [{
                    "entity_id": entity_id,
                    "name": name,
                    "domain": domain,
                    "icon": _get_device_icon(domain),
                    "capabilities": ["read", "control"] if domain in CONTROLLABLE_DOMAINS else ["read"],
                }],
                "primary_entity_id": entity_id,
                "entities": [entity_id],
            })

    # Discover Dashboards and Views
    dashboards_result: list[dict] = []
    dashboard_view_entities: dict[str, set[str]] = {}
    seen_dashboard_ids: set[str] = set()

    # 1. Domolux Views
    try:
        view_store = _get_view_store(hass)
        domolux_views = []
        for view in view_store.views.values():
            card_list = [
                c.to_dict() if hasattr(c, "to_dict") else (c if isinstance(c, dict) else {})
                for c in getattr(view, "cards", [])
            ]
            discovered = set(extract_entities_from_view({"cards": card_list}))
            v_path = view.view_path.strip().lower()
            dashboard_view_entities[v_path] = discovered
            dashboard_view_entities[f"domolux/{v_path}"] = discovered
            domolux_views.append({
                "view_id": view.view_id,
                "view_path": view.view_path,
                "title": view.title,
                "icon": getattr(view, "icon", "mdi:view-dashboard"),
                "entities": sorted(list(discovered)),
            })
        if domolux_views:
            domolux_views.sort(key=lambda v: (v["title"] or "", v["view_path"]))
            seen_dashboard_ids.add("domolux_views")
            dashboards_result.append({
                "dashboard_id": "domolux_views",
                "title": "Domolux Dashboards",
                "url_path": "domolux",
                "views": domolux_views,
            })
    except Exception as err:
        _LOGGER.debug("Domolux views discovery skipped: %s", err)

    # 2. Lovelace Dashboards from Home Assistant
    try:
        domain_data = getattr(hass, "data", {})
        lovelace_data = None
        if isinstance(domain_data, dict):
            lovelace_data = domain_data.get("lovelace")
        else:
            try:
                lovelace_data = domain_data.get("lovelace")
            except Exception:
                pass
            if lovelace_data is None:
                try:
                    lovelace_data = domain_data["lovelace"]
                except Exception:
                    pass

        dashboards_map: dict[Any, Any] = {}

        if lovelace_data is not None:
            if hasattr(lovelace_data, "dashboards") and isinstance(lovelace_data.dashboards, dict):
                dashboards_map.update(lovelace_data.dashboards)
            elif isinstance(lovelace_data, dict) and "dashboards" in lovelace_data and isinstance(lovelace_data["dashboards"], dict):
                dashboards_map.update(lovelace_data["dashboards"])

            # Legacy or mock direct config on lovelace_data
            direct_config = getattr(lovelace_data, "config", None)
            if isinstance(direct_config, dict) and "views" in direct_config:
                if None not in dashboards_map and "lovelace" not in dashboards_map:
                    dashboards_map[None] = direct_config

        # Check frontend panels for any additional lovelace dashboards (e.g. dashboard-user)
        panels = domain_data.get("frontend_panels", {}) if hasattr(domain_data, "get") else {}
        if isinstance(panels, dict):
            for p_key, p_obj in panels.items():
                comp = getattr(p_obj, "component_name", None) or (p_obj.get("component_name") if isinstance(p_obj, dict) else None)
                if comp == "lovelace":
                    url_p = getattr(p_obj, "frontend_url_path", None) or (p_obj.get("frontend_url_path") if isinstance(p_obj, dict) else p_key)
                    if url_p and url_p not in dashboards_map and url_p != "lovelace":
                        dashboards_map[url_p] = getattr(p_obj, "config", None) or p_obj

        for url_path, dash_obj in dashboards_map.items():
            clean_url = str(url_path).strip("/") if url_path is not None else ""
            is_default = url_path is None or clean_url == "lovelace" or clean_url == ""
            dash_id = "lovelace" if is_default else clean_url
            dash_url = "lovelace" if is_default else clean_url

            if dash_id in seen_dashboard_ids:
                continue

            # Load dashboard metadata and config
            dash_config: dict[str, Any] | None = None
            dash_meta: dict[str, Any] = {}

            if hasattr(dash_obj, "config") and isinstance(dash_obj.config, dict):
                dash_meta = dash_obj.config
            elif isinstance(dash_obj, dict):
                dash_meta = dash_obj

            if isinstance(dash_obj, dict):
                if "views" in dash_obj:
                    dash_config = dash_obj
                elif "config" in dash_obj and isinstance(dash_obj["config"], dict):
                    dash_config = dash_obj["config"]

            if dash_config is None and hasattr(dash_obj, "async_load"):
                try:
                    loaded = dash_obj.async_load(force=False)
                    if asyncio.iscoroutine(loaded) or hasattr(loaded, "__await__"):
                        loaded = await loaded
                    if isinstance(loaded, dict):
                        dash_config = loaded
                except Exception as err:
                    _LOGGER.debug("Could not async_load dashboard %s: %s", url_path, err)

            if dash_config is None:
                data = getattr(dash_obj, "_data", None)
                if isinstance(data, dict) and isinstance(data.get("config"), dict):
                    dash_config = data["config"]
                elif hasattr(dash_obj, "config") and isinstance(dash_obj.config, dict):
                    if "views" in dash_obj.config:
                        dash_config = dash_obj.config

            # Extract title
            dash_title = None
            if dash_meta and isinstance(dash_meta, dict):
                dash_title = dash_meta.get("title")
            if not dash_title and isinstance(dash_config, dict):
                dash_title = dash_config.get("title")
            if not dash_title:
                dash_title = "Home Assistant Overview" if is_default else dash_url.replace("-", " ").replace("_", " ").title()

            views_list: list[dict] = []
            views_raw = dash_config.get("views", []) if isinstance(dash_config, dict) else []

            for idx, v in enumerate(views_raw):
                if not isinstance(v, dict):
                    continue
                v_raw_path = v.get("path")
                if v_raw_path is None or str(v_raw_path).strip() == "":
                    v_path = str(idx)
                else:
                    v_path = str(v_raw_path).strip().lower()

                v_title = v.get("title") or (
                    v_path.replace("-", " ").replace("_", " ").title() if v_path != str(idx) else f"View {idx + 1}"
                )
                v_icon = v.get("icon") or "mdi:view-dashboard"
                discovered = set(extract_entities_from_view(v))

                dashboard_view_entities[v_path] = discovered
                if dash_url != "lovelace":
                    dashboard_view_entities[f"{dash_url}/{v_path}"] = discovered

                views_list.append({
                    "view_id": v_path,
                    "view_path": v_path,
                    "title": v_title,
                    "icon": v_icon,
                    "entities": sorted(list(discovered)),
                })

            # If dashboard has no views config (e.g. auto-gen storage mode default dashboard)
            if not views_list and is_default:
                auto_entities = sorted(list(seen_entity_ids))
                views_list.append({
                    "view_id": "default_view",
                    "view_path": "default_view",
                    "title": "Overview",
                    "icon": "mdi:view-dashboard",
                    "entities": auto_entities,
                })
                dashboard_view_entities["default_view"] = set(auto_entities)
                dashboard_view_entities["overview"] = set(auto_entities)

            if views_list or is_default or dash_config is not None:
                seen_dashboard_ids.add(dash_id)
                dashboards_result.append({
                    "dashboard_id": dash_id,
                    "title": dash_title,
                    "url_path": dash_url,
                    "views": views_list,
                })
    except Exception as err:
        _LOGGER.debug("Lovelace dashboards discovery skipped: %s", err)

    # Cache discovered entities for evaluator and auth adapter
    if dashboard_view_entities:
        d_data = hass.data.setdefault(DOMAIN, {})
        if isinstance(d_data, dict):
            cached = d_data.setdefault("dashboard_view_entities", {})
            if isinstance(cached, dict):
                cached.update(dashboard_view_entities)

    # Deterministic sorting
    devices_result.sort(key=lambda d: (str(d.get("name") or ""), str(d.get("device_id") or "")))
    entities_result.sort(key=lambda e: (str(e.get("name") or ""), str(e.get("entity_id") or "")))
    dashboards_result.sort(key=lambda d: (0 if d.get("dashboard_id") == "lovelace" else 1, str(d.get("title") or "").lower()))

    connection.send_result(msg["id"], {
        "catalog": {
            "devices": devices_result,
            "household_devices": devices_result,
            "entities": entities_result,
            "dashboards": dashboards_result,
        }
    })


def async_register_catalog_commands(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_catalog)
