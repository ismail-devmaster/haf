"""Registry privacy guard for Domolux Roles (finding T3.3).

Home Assistant natively filters ``get_states`` and service control by the
caller's entity permission, but the **registry list commands** are not
permission filtered.  A non-admin account can therefore list every entity id,
name, area, device and floor in the household.  For a managed Child that
breaks the "hidden entity is not visible" contract, because the metadata alone
reveals what exists in inaccessible rooms.

This module wraps the registered WebSocket handlers of the registry list/get
commands and, **only for managed Children**, removes the entries the account
cannot read.  The decision uses Home Assistant's own native permission lookup
(``user.permissions.check_entity(entity_id, "read")``), which the Domolux auth
adapter keeps in sync with the Domolux policy.  There is no second
authorization mechanism and no duplicated policy evaluation.

Design rules
------------
1. Only managed Children are filtered.  The Father, administrators/owners and
   unmanaged users keep stock Home Assistant behaviour.
2. Areas, devices and floors are kept only when they contain at least one
   entity the Child may read, so the response never hints at an inaccessible
   room.  This mirrors what the Child can actually use.
3. Single entity lookups for a hidden entity answer with the same
   ``not_found`` error Home Assistant uses for a missing entity, so the
   existence of the entity is not disclosed.
4. Handler wrapping is in place and reversible: unload restores the original
   callables and a sentinel attribute makes restoration safe across reloads.

The wrapper captures the response the original handler emits, filters it and
re-sends it unchanged when the caller is not a Child.  That keeps this module
independent of the internal response schema, which is the part of the registry
API most likely to change between Home Assistant releases.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Callable

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from .read_channel_guard import is_managed_child

_LOGGER = logging.getLogger(__name__)

WEBSOCKET_DOMAIN = "websocket_api"

_MARKER = "_domolux_registry_guard"

# command -> response kind
_WRAPPED_COMMANDS: dict[str, str] = {
    "config/entity_registry/list": "entity_list",
    "config/entity_registry/list_for_display": "entity_list",
    "config/area_registry/list": "area_list",
    "config/device_registry/list": "device_list",
    "config/floor_registry/list": "floor_list",
    "config/entity_registry/get_entries": "entity_list",
}

_GET_ENTITY_COMMAND = "config/entity_registry/get"

# route identity -> (command, original handler)
_PATCHED: dict[str, Any] = {}
_INSTALLED = False


# ---------------------------------------------------------------------------
# identity / permission helpers
# ---------------------------------------------------------------------------
def _should_filter(hass: Any, connection: Any) -> bool:
    """Return True when the caller is a managed Child."""
    user = getattr(connection, "user", None)
    if user is None:
        return False
    if getattr(user, "is_admin", False) or getattr(user, "is_owner", False):
        return False
    return is_managed_child(hass, getattr(user, "id", None))


def _can_read(user: Any, entity_id: str) -> bool:
    """Ask Home Assistant itself whether ``user`` may read ``entity_id``."""
    try:
        return bool(user.permissions.check_entity(entity_id, "read"))
    except Exception:  # pragma: no cover - defensive, fail closed
        return False


def _area_for_entry(hass: Any, entry: Any, devices: Any) -> str | None:
    """Resolve the area of an entity, directly or through its device."""
    if entry.area_id:
        return entry.area_id
    if entry.device_id:
        device = devices.async_get(entry.device_id)
        if device is not None:
            return device.area_id
    return None


def _visible_structure(hass: Any, user: Any) -> tuple[set[str], set[str], set[str]]:
    """Return ``(entity_ids, area_ids, device_ids)`` visible to the account."""
    registry = er.async_get(hass)
    devices = dr.async_get(hass)

    entity_ids: set[str] = set()
    area_ids: set[str] = set()
    device_ids: set[str] = set()

    for entry in registry.entities.values():
        if not _can_read(user, entry.entity_id):
            continue
        entity_ids.add(entry.entity_id)
        area_id = _area_for_entry(hass, entry, devices)
        if area_id:
            area_ids.add(area_id)
        if entry.device_id:
            device_ids.add(entry.device_id)

    return entity_ids, area_ids, device_ids


# ---------------------------------------------------------------------------
# response filtering
# ---------------------------------------------------------------------------
def _entity_id_of(item: Any) -> str | None:
    if not isinstance(item, dict):
        return None
    return item.get("entity_id") or item.get("ei")


def _filter_entity_list(result: Any, visible: set[str]) -> Any:
    """Filter entity responses in both list and display-dict shape."""
    if isinstance(result, dict) and isinstance(result.get("entities"), list):
        result["entities"] = [
            item for item in result["entities"] if _entity_id_of(item) in visible
        ]
        return result
    if not isinstance(result, list):
        return result
    return [item for item in result if _entity_id_of(item) in visible]


def _filter_area_list(result: Any, areas: set[str]) -> Any:
    if not isinstance(result, list):
        return result
    return [
        item
        for item in result
        if isinstance(item, dict) and item.get("area_id") in areas
    ]


def _filter_device_list(result: Any, devices: set[str]) -> Any:
    if not isinstance(result, list):
        return result
    return [
        item
        for item in result
        if isinstance(item, dict) and item.get("id") in devices
    ]


def _filter_floor_list(result: Any, floors: set[str]) -> Any:
    if not isinstance(result, list):
        return result
    return [
        item
        for item in result
        if isinstance(item, dict) and item.get("floor_id") in floors
    ]


def _filter_result(kind: str, result: Any, hass: Any, user: Any) -> Any:
    """Filter one registry response for a managed Child."""
    entity_ids, area_ids, device_ids = _visible_structure(hass, user)

    if kind == "entity_list":
        return _filter_entity_list(result, entity_ids)
    if kind == "area_list":
        return _filter_area_list(result, area_ids)
    if kind == "device_list":
        return _filter_device_list(result, device_ids)

    # Floors are derived from the visible areas.
    registry = _floor_registry(hass)
    visible_floors = {
        floor.floor_id
        for floor in registry.async_list_floors()
        if any(area in area_ids for area in floor.area_ids)
    }
    return _filter_floor_list(result, visible_floors)


def _floor_registry(hass: Any) -> Any:
    from homeassistant.helpers import floor_registry as fr

    return fr.async_get(hass)


def _decode(message: Any) -> Any:
    if isinstance(message, (bytes, bytearray)):
        return json.loads(message.decode())
    if isinstance(message, str):
        return json.loads(message)
    return message


def _encode(payload: Any, original: Any) -> Any:
    """Re-encode in the same shape the original handler used."""
    if isinstance(original, dict):
        # Handlers that build the response as a dict (and send it through
        # ``connection.send_message`` as an object) keep the dict shape.
        return payload
    if isinstance(original, (bytes, bytearray)):
        return json.dumps(payload).encode()
    if isinstance(original, str):
        return json.dumps(payload)
    return payload


def _captured_send(hass: Any, connection: Any, kind: str, call: Callable[[], Any]) -> Any:
    """Run ``call`` while capturing the messages the handler emits."""
    sent: list[Any] = []
    original_send = connection.send_message

    def _capture(message: Any) -> None:
        sent.append(message)

    connection.send_message = _capture
    try:
        outcome = call()
    finally:
        connection.send_message = original_send

    user = connection.user
    for message in sent:
        payload = _decode(message)
        if (
            isinstance(payload, dict)
            and payload.get("success") is True
            and "result" in payload
        ):
            payload["result"] = _filter_result(
                kind, payload["result"], hass, user
            )
            original_send(_encode(payload, message))
        else:
            original_send(message)

    return outcome


# ---------------------------------------------------------------------------
# handler wrappers
# ---------------------------------------------------------------------------
def _wrap_sync(original: Any, kind: str) -> Any:
    def wrapper(hass: Any, connection: Any, msg: dict[str, Any]) -> Any:
        if not _should_filter(hass, connection):
            return original(hass, connection, msg)
        return _captured_send(
            hass, connection, kind, lambda: original(hass, connection, msg)
        )

    setattr(wrapper, _MARKER, True)
    wrapper._domolux_original = original  # type: ignore[attr-defined]
    return wrapper


def _wrap_async(original: Any, kind: str) -> Any:
    async def wrapper(hass: Any, connection: Any, msg: dict[str, Any]) -> Any:
        if not _should_filter(hass, connection):
            return await original(hass, connection, msg)

        sent: list[Any] = []
        original_send = connection.send_message

        def _capture(message: Any) -> None:
            sent.append(message)

        connection.send_message = _capture
        try:
            outcome = await original(hass, connection, msg)
        finally:
            connection.send_message = original_send

        user = connection.user
        for message in sent:
            payload = _decode(message)
            if (
                isinstance(payload, dict)
                and payload.get("success") is True
                and "result" in payload
            ):
                payload["result"] = _filter_result(kind, payload["result"], hass, user)
                original_send(_encode(payload, message))
            else:
                original_send(message)
        return outcome

    setattr(wrapper, _MARKER, True)
    wrapper._domolux_original = original  # type: ignore[attr-defined]
    return wrapper


def _wrap_get_entity(original: Any) -> Any:
    """Deny single lookups of an entity the Child may not read."""

    def _allowed(hass: Any, connection: Any) -> bool:
        return _should_filter(hass, connection)

    if _is_coroutine(original):

        async def async_wrapper(hass: Any, connection: Any, msg: dict[str, Any]) -> Any:
            if _allowed(hass, connection):
                entity_id = msg.get("entity_id")
                if not entity_id or not _can_read(connection.user, entity_id):
                    _send_not_found(connection, msg)
                    return None
            return await original(hass, connection, msg)

        setattr(async_wrapper, _MARKER, True)
        async_wrapper._domolux_original = original  # type: ignore[attr-defined]
        return async_wrapper

    def wrapper(hass: Any, connection: Any, msg: dict[str, Any]) -> Any:
        if _allowed(hass, connection):
            entity_id = msg.get("entity_id")
            if not entity_id or not _can_read(connection.user, entity_id):
                _send_not_found(connection, msg)
                return None
        return original(hass, connection, msg)

    setattr(wrapper, _MARKER, True)
    wrapper._domolux_original = original  # type: ignore[attr-defined]
    return wrapper


def _send_not_found(connection: Any, msg: dict[str, Any]) -> None:
    try:
        from homeassistant.components import websocket_api

        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "Entity not found")
    except Exception:  # pragma: no cover - defensive
        pass


def _is_coroutine(func: Any) -> bool:
    import asyncio

    return asyncio.iscoroutinefunction(func)


# ---------------------------------------------------------------------------
# install / uninstall
# ---------------------------------------------------------------------------
def install_registry_guard(hass: Any) -> bool:
    """Wrap the registry WebSocket handlers.  Idempotent."""
    global _INSTALLED
    if _INSTALLED:
        return True

    handlers = getattr(hass, "data", {}).get(WEBSOCKET_DOMAIN)
    if not isinstance(handlers, dict):
        _LOGGER.debug(
            "Domolux registry guard: websocket_api is not ready; will retry at startup"
        )
        return False

    installed = False
    for command, kind in _WRAPPED_COMMANDS.items():
        entry = handlers.get(command)
        if not isinstance(entry, tuple) or len(entry) != 2:
            continue
        original, schema = entry
        if getattr(original, _MARKER, False):
            continue
        wrapper = (
            _wrap_async(original, kind)
            if _is_coroutine(original)
            else _wrap_sync(original, kind)
        )
        handlers[command] = (wrapper, schema)
        _PATCHED[command] = original
        installed = True

    entry = handlers.get(_GET_ENTITY_COMMAND)
    if isinstance(entry, tuple) and len(entry) == 2:
        original, schema = entry
        if not getattr(original, _MARKER, False):
            handlers[_GET_ENTITY_COMMAND] = (_wrap_get_entity(original), schema)
            _PATCHED[_GET_ENTITY_COMMAND] = original
            installed = True

    if installed:
        _INSTALLED = True
        _LOGGER.info(
            "Domolux registry privacy guard installed for managed Children (%s commands)",
            len(_PATCHED),
        )
    return _INSTALLED


def uninstall_registry_guard(hass: Any) -> None:
    """Restore the original registry handlers.  Safe to call repeatedly."""
    global _INSTALLED
    handlers = getattr(hass, "data", {}).get(WEBSOCKET_DOMAIN)
    if isinstance(handlers, dict):
        for command, original in list(_PATCHED.items()):
            entry = handlers.get(command)
            if not isinstance(entry, tuple) or len(entry) != 2:
                continue
            wrapper, schema = entry
            if getattr(wrapper, _MARKER, False):
                handlers[command] = (original, schema)
    _PATCHED.clear()
    _INSTALLED = False


def is_registry_guard_installed() -> bool:
    """Return whether the guard currently wraps the registry commands."""
    return _INSTALLED


def wrapped_commands() -> set[str]:
    """Return the commands currently wrapped (test/diagnostic hook)."""
    return set(_PATCHED)
