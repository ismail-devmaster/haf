"""Read-channel guard for raw Home Assistant history and logbook access.

Home Assistant natively filters the main read channels by the caller's entity
permission:

* ``get_states`` and ``subscribe_events`` (WebSocket),
* ``/api/states/<entity_id>`` (REST),
* entity service control.

The **history** and **logbook** REST endpoints do *not* consult that
permission.  A managed Child could therefore read the state history of an
entity that is hidden from them, which breaks the "not visible" contract.

This module wraps the registered route handlers of those two endpoints so a
managed Child only receives data for entities the Domolux policy grants them
read access to.  Requests that target an entity the Child may not read are
answered with the same 404 Home Assistant uses for a missing entity, so the
existence of a hidden entity is never disclosed.

Only managed Children are filtered.  The Father, Home Assistant
administrators/owners and unmanaged users keep normal Home Assistant
behaviour (compatibility requirement).

Why route wrapping instead of a view subclass: Home Assistant captures the
bound handler in ``HomeAssistantView.register`` *before* this custom
integration is set up, so patching the view class has no effect.  The router
still resolves the handler per request, which makes it the reliable hook.
"""

from __future__ import annotations

import logging
from typing import Any

from .const import ACCESS_LEVEL_READ, DOMAIN

_LOGGER = logging.getLogger(__name__)

# Query parameter carrying the requested entities.
_HISTORY_PARAM = "filter_entity_id"
_LOGBOOK_PARAM = "entity"

# Registered route path -> entity query parameter.
_TARGET_PATHS: dict[str, str] = {
    "/api/history/period": _HISTORY_PARAM,
    "/api/history/period/{datetime}": _HISTORY_PARAM,
    "/api/logbook": _LOGBOOK_PARAM,
    "/api/logbook/{datetime}": _LOGBOOK_PARAM,
}

# route identity -> (route, original handler)
_PATCHED: dict[int, tuple[Any, Any]] = {}
_INSTALLED = False


def _domolux_entry(hass: Any) -> dict[str, Any] | None:
    data = getattr(hass, "data", None)
    if not isinstance(data, dict):
        return None
    container = data.get(DOMAIN)
    if not isinstance(container, dict):
        return None
    for value in container.values():
        if isinstance(value, dict) and "store" in value and "evaluator" in value:
            return value
    return None


def is_managed_child(hass: Any, user_id: str | None) -> bool:
    """Public helper: is ``user_id`` a Domolux-managed Child?"""
    if not user_id:
        return False
    entry = _domolux_entry(hass)
    if entry is None:
        return False
    return _is_managed_child(entry, user_id)


def _is_managed_child(entry: dict[str, Any], user_id: str) -> bool:
    """Return True when ``user_id`` is a Domolux-managed Child."""
    store = entry["store"]
    try:
        father = store.get_father()
        if father is not None and father.user_id == user_id:
            return False
        member = store.get_family_member(user_id)
        if member is not None:
            return True
        return user_id in store.data.permissions
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.warning(
            "Domolux could not classify user %s; not filtering: %s", user_id, err
        )
        return False


async def _readable_entities(hass: Any, user_id: str, entity_ids: list[str]) -> list[str]:
    """Return the subset of ``entity_ids`` the user may read."""
    entry = _domolux_entry(hass)
    evaluator = entry["evaluator"] if entry is not None else None
    if evaluator is None:
        return list(entity_ids)

    allowed: list[str] = []
    for entity_id in entity_ids:
        try:
            result = await evaluator.evaluate_entity_access(
                user_id, entity_id, required_level=ACCESS_LEVEL_READ
            )
        except Exception as err:
            _LOGGER.warning(
                "Domolux read check failed for '%s'; failing closed: %s", entity_id, err
            )
            continue
        if getattr(result, "granted", False):
            allowed.append(entity_id)
    return allowed


def _requested_entities(request: Any, param: str) -> list[str] | None:
    """Extract the requested entity ids, or None when the request is unfiltered."""
    query = getattr(request, "query", None)
    if query is None:
        return None
    try:
        raw = query.get(param)
    except Exception:  # pragma: no cover - defensive
        return None
    if not raw:
        return None
    return [item.strip() for item in str(raw).split(",") if item.strip()]


def _deny() -> Any:
    """Answer exactly like Home Assistant answers a missing entity."""
    from aiohttp import web

    return web.json_response({"message": "Entity not found."}, status=404)


def _wrap_handler(original: Any, param: str) -> Any:
    """Wrap a registered route handler with the Domolux read filter."""

    async def guarded(request: Any) -> Any:
        user = request.get("hass_user")
        hass = request.app.get("hass") if hasattr(request, "app") else None

        entry = _domolux_entry(hass) if hass is not None else None
        if user is not None and entry is not None and _is_managed_child(entry, user.id):
            try:
                requested = _requested_entities(request, param)
            except Exception as err:  # pragma: no cover - defensive
                _LOGGER.warning("Domolux could not read the request target: %s", err)
                requested = None

            if requested is None:
                # An unfiltered request would return every entity; a managed
                # Child must never receive that.
                return _deny()

            allowed = await _readable_entities(hass, user.id, requested)
            if len(allowed) != len(requested):
                return _deny()

        try:
            return await original(request)
        except Exception:
            # Re-raise so Home Assistant keeps its normal error handling.
            raise

    return guarded


def _route_path(route: Any) -> str | None:
    """Return the canonical path of a registered route."""
    try:
        resource = getattr(route, "resource", None)
        canonical = getattr(resource, "canonical", None)
        if isinstance(canonical, str):
            return canonical
    except Exception:  # pragma: no cover - defensive
        pass
    try:
        info = route.get_info()
        if isinstance(info, dict) and isinstance(info.get("path"), str):
            return info["path"]
    except Exception:  # pragma: no cover - defensive
        pass
    return None


def install_read_channel_guard(hass: Any = None) -> None:
    """Install the history and logbook read-channel guards."""
    global _INSTALLED
    if _INSTALLED:
        return

    http = getattr(hass, "http", None)
    app = getattr(http, "app", None)
    router = getattr(app, "router", None)
    if router is None:
        _LOGGER.warning(
            "Domolux read-channel guard could not be installed: the Home "
            "Assistant HTTP router is unavailable."
        )
        return

    try:
        routes = list(router.routes())
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.warning(
            "Domolux read-channel guard could not enumerate routes: %s", err
        )
        return

    wrapped = 0
    for route in routes:
        param = _TARGET_PATHS.get(_route_path(route))
        if param is None:
            continue
        handler = getattr(route, "handler", None)
        if handler is None or getattr(handler, "_domolux_guarded", False):
            continue
        guarded = _wrap_handler(handler, param)
        guarded._domolux_guarded = True  # type: ignore[attr-defined]
        try:
            route._handler = guarded  # type: ignore[attr-defined]
        except Exception as err:  # pragma: no cover - defensive
            _LOGGER.warning("Domolux could not wrap a route handler: %s", err)
            continue
        _PATCHED[id(route)] = (route, handler)
        wrapped += 1

    if wrapped:
        _LOGGER.info(
            "Domolux read-channel guard installed on %d route(s).", wrapped
        )
    else:
        _LOGGER.warning(
            "Domolux read-channel guard found no history/logbook routes to wrap."
        )
    _INSTALLED = True


def uninstall_read_channel_guard(hass: Any = None) -> None:
    """Restore the original history and logbook route handlers."""
    global _INSTALLED
    for route, original in _PATCHED.values():
        try:
            route._handler = original  # type: ignore[attr-defined]
        except Exception as err:  # pragma: no cover - defensive
            _LOGGER.warning("Domolux could not restore a route handler: %s", err)
    _PATCHED.clear()
    _INSTALLED = False


def is_installed() -> bool:
    """Return True when the read-channel guard is installed."""
    return _INSTALLED
