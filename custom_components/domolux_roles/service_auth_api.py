"""Authoritative Entity Control Enforcement — Service Authorization Broker.

SECURITY BOUNDARY:
- Only evaluates; never monkey-patches HA service handlers.
- Uses official @websocket_api.websocket_command.
- Identity from connection.user.id via hass.auth.async_get_user.
- Rejects control if evaluate_entity_access grants=False for required_level=control.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.core import Context, HomeAssistant
from homeassistant.exceptions import Unauthorized
import voluptuous as vol

from .api_schemas import (
    DOMAIN_SCHEMA,
    ENTITY_ID_LIST_SCHEMA,
    SERVICE_DATA_SCHEMA,
    SERVICE_SCHEMA,
)
from .const import ACCESS_LEVEL_CONTROL, DOMAIN
from .permission_evaluator import DomoluxPermissionEvaluator
from .view_api import _get_evaluator

_LOGGER = logging.getLogger(__name__)

ERR_SERVICE_UNAUTHORIZED = "service_unauthorized"
ERR_SERVICE_DENIED = "service_denied"
ERR_INTERNAL_ERROR = "internal_error"
ERR_SERVICE_NOT_ALLOWED = "service_not_allowed"
ERR_TARGET_INVALID = "target_invalid"

# Supported control services derived from existing Child dashboard capabilities.
# Admin/core/management services are explicitly excluded.
DANGEROUS_DOMAINS = {
    "shell_command",
    "python_script",
    "rest_command",
    "automation",
    "script",
    "scene",
    "persistent_notification",
    "notify",
    "tts",
    "recorder",
    "logbook",
    "system_log",
    "hassio",
    "homeassistant",
    "config_entries",
}

ALLOWED_CONTROL_DOMAINS = {
    "light",
    "switch",
    "fan",
    "media_player",
    "climate",
    "cover",
    "lock",
    "vacuum",
    "humidifier",
    "water_heater",
    "valve",
    "binary_sensor",
    "sensor",
    "number",
    "select",
    "button",
    "input_boolean",
    "input_number",
    "input_select",
    "input_button",
}
ALLOWED_CONTROL_SERVICES = {
    # Generic state toggles
    "turn_on",
    "turn_off",
    "toggle",
    "press",
    # Values and percentages
    "set_value",
    "set_percentage",
    "set_speed_percentage",
    # Cover controls (including position slider & tilt)
    "open_cover",
    "close_cover",
    "stop_cover",
    "set_cover_position",
    "open_cover_tilt",
    "close_cover_tilt",
    "stop_cover_tilt",
    "set_cover_tilt_position",
    "toggle_cover_tilt",
    # Lock controls
    "lock",
    "unlock",
    "open",
    # Climate controls
    "set_temperature",
    "set_hvac_mode",
    "set_fan_mode",
    "set_humidity",
    "set_swing_mode",
    "set_preset_mode",
    # Fan controls
    "set_direction",
    "oscillate",
    "increase_speed",
    "decrease_speed",
    # Media player controls
    "volume_up",
    "volume_down",
    "volume_set",
    "volume_mute",
    "media_play_pause",
    "media_play",
    "media_pause",
    "media_stop",
    "media_next_track",
    "media_previous_track",
    "select_source",
    "select_sound_mode",
    # Vacuum controls
    "start",
    "pause",
    "stop",
    "return_to_base",
    "clean_spot",
    "locate",
    "set_fan_speed",
    # Valve controls
    "open_valve",
    "close_valve",
    "stop_valve",
    "set_valve_position",
    # Select controls
    "select_option",
    "select_next",
    "select_previous",
    "select_first",
    "select_last",
    # Water heater / Humidifier controls
    "set_operation_mode",
    "set_away_mode",
    "set_mode",
}

# Home Assistant wildcard sentinels: "all" applies the service to every
# entity of the domain, "none" matches nothing.
WILDCARD_ENTITY_IDS = frozenset({"all", "none"})


def _contains_wildcard_entity(entity_id: Any) -> bool:
    """Return True when the target contains a Home Assistant wildcard."""
    if entity_id is None:
        return False
    items = entity_id if isinstance(entity_id, (list, tuple, set)) else [entity_id]
    return any(
        isinstance(item, str) and item.strip().lower() in WILDCARD_ENTITY_IDS
        for item in items
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/service/authorize",
        vol.Required("domain"): DOMAIN_SCHEMA,
        vol.Required("service"): SERVICE_SCHEMA,
        vol.Optional("entity_id"): ENTITY_ID_LIST_SCHEMA,
        vol.Optional("service_data"): SERVICE_DATA_SCHEMA,
    }
)
@websocket_api.async_response
async def ws_service_authorize(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Authoritatively evaluate and enforce control permission for a service call."""
    user = connection.user
    if user is None or getattr(user, "is_disabled", False):
        connection.send_error(msg["id"], "unauthorized", "Unauthorized.")
        return

    user_id = user.id
    domain = msg.get("domain")
    service = msg.get("service")
    entity_id = msg.get("entity_id")

    if domain in DANGEROUS_DOMAINS or domain not in ALLOWED_CONTROL_DOMAINS:
        connection.send_error(
            msg["id"], ERR_SERVICE_NOT_ALLOWED, f"Domain '{domain}' not permitted for Child control."
        )
        return
    if service not in ALLOWED_CONTROL_SERVICES:
        connection.send_error(
            msg["id"], ERR_SERVICE_NOT_ALLOWED, f"Service '{service}' not permitted."
        )
        return

    if entity_id is not None:
        if _contains_wildcard_entity(entity_id):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return
        if isinstance(entity_id, str) and (entity_id.startswith("device.") or entity_id.startswith("area.")):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return
        if isinstance(entity_id, list) and not entity_id:
            connection.send_error(msg["id"], ERR_TARGET_INVALID, "Empty target list.")
            return
        if isinstance(entity_id, list) and any(
            isinstance(item, str)
            and (item.startswith("device.") or item.startswith("area."))
            for item in entity_id
        ):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return

    if not domain or not service:
        connection.send_error(msg["id"], "invalid_format", "Domain/service required.")
        return

    evaluator: DomoluxPermissionEvaluator = _get_evaluator(hass)

    is_father = evaluator._is_father(user_id)
    if is_father:
        connection.send_result(msg["id"], {"authorized": True, "reason": "father_override"})
        return

    try:
        is_admin_owner = await evaluator._is_admin_or_owner(user_id)
    except Exception:
        is_admin_owner = False
    if is_admin_owner:
        connection.send_result(msg["id"], {"authorized": True, "reason": "admin_override"})
        return

    if entity_id:
        targets = [entity_id] if isinstance(entity_id, str) else entity_id
        try:
            for tid in targets:
                result = await evaluator.evaluate_entity_access(
                    user_id, tid, required_level=ACCESS_LEVEL_CONTROL
                )
                if not result.granted:
                    connection.send_error(
                        msg["id"], ERR_SERVICE_DENIED, f"Control permission denied for entity '{tid}'."
                    )
                    return
        except Exception:
            connection.send_error(msg["id"], "internal_error", "Evaluation failed.")
            return

    connection.send_result(msg["id"], {"authorized": True, "reason": "entity_control_granted"})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/service/enforce",
        vol.Required("domain"): DOMAIN_SCHEMA,
        vol.Required("service"): SERVICE_SCHEMA,
        vol.Optional("entity_id"): ENTITY_ID_LIST_SCHEMA,
        vol.Optional("service_data"): SERVICE_DATA_SCHEMA,
    }
)
@websocket_api.async_response
async def ws_service_enforce(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Enforce control authorization and execute service if granted."""
    user = connection.user
    if user is None or getattr(user, "is_disabled", False):
        connection.send_error(msg["id"], "unauthorized", "Unauthorized.")
        return

    user_id = user.id
    domain = msg.get("domain")
    service = msg.get("service")
    entity_id = msg.get("entity_id")

    if domain in DANGEROUS_DOMAINS or domain not in ALLOWED_CONTROL_DOMAINS:
        connection.send_error(
            msg["id"], ERR_SERVICE_NOT_ALLOWED, f"Domain '{domain}' not permitted for Child control."
        )
        return
    if service not in ALLOWED_CONTROL_SERVICES:
        connection.send_error(
            msg["id"], ERR_SERVICE_NOT_ALLOWED, f"Service '{service}' not permitted."
        )
        return

    # The executed call must target exactly the entities that were authorised,
    # so wildcards, broad selectors and empty targets are rejected here.
    if entity_id is not None:
        if _contains_wildcard_entity(entity_id):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return
        if isinstance(entity_id, str) and (entity_id.startswith("device.") or entity_id.startswith("area.")):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return
        if isinstance(entity_id, list) and not entity_id:
            connection.send_error(msg["id"], ERR_TARGET_INVALID, "Empty target list.")
            return
        if isinstance(entity_id, list) and any(
            isinstance(item, str)
            and (item.startswith("device.") or item.startswith("area."))
            for item in entity_id
        ):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return

    evaluator = _get_evaluator(hass)
    is_father = evaluator._is_father(user_id)
    is_admin_owner = False
    try:
        is_admin_owner = await evaluator._is_admin_or_owner(user_id)
    except Exception:
        pass

    # Authorization gate (atomic batch evaluation)
    authorized = True
    if not (is_father or is_admin_owner):
        if entity_id:
            targets = [entity_id] if isinstance(entity_id, str) else entity_id
            try:
                for tid in targets:
                    res = await evaluator.evaluate_entity_access(
                        user_id, tid, required_level=ACCESS_LEVEL_CONTROL
                    )
                    if not res.granted:
                        authorized = False
                        break
            except Exception:
                authorized = False
        else:
            authorized = False

    if not authorized:
        connection.send_error(
            msg["id"], ERR_SERVICE_DENIED, "Control authorization denied."
        )
        return

    # Execute via HA service call.
    # The backend performs a mediated action for the permitted target. The
    # Home Assistant user context is intentionally left empty: managed Children
    # are members of the native read-only group, so Home Assistant refuses
    # entity service calls that carry a Child's user id.  The mediated path is
    # the only control channel a Child has and it is gated by the canonical
    # Domolux authorization check performed above.
    try:
        domain = msg["domain"]
        service = msg["service"]
        service_data = msg.get("service_data") or {}
        service_data = dict(service_data)

        # Remove misleading user_id from service payload; it does not establish
        # Home Assistant execution identity (Core uses context=, not service_data).
        service_data.pop("user_id", None)

        # SECURITY: reject any attempt to smuggle a *different* target through
        # the service payload. Home Assistant merges `target` into the service
        # data and the entity platform then expands entity_id / device_id /
        # area_id / floor_id / label_id from that payload.  A payload carrying
        # `device_id` or `area_id` would therefore reach entities that were
        # never authorised, so only the already-authorised `entity_id` may be
        # present and it must match the authorised target exactly.
        for key in ("target", "device_id", "area_id", "floor_id", "label_id", "group_id"):
            if key in service_data:
                connection.send_error(
                    msg["id"],
                    ERR_TARGET_INVALID,
                    f"Target smuggling via service_data ({key}) is not permitted.",
                )
                return

        authorised_entities = msg.get("entity_id")
        authorised_set = (
            {authorised_entities}
            if isinstance(authorised_entities, str)
            else set(authorised_entities or [])
        )
        payload_entities = service_data.get("entity_id")
        if payload_entities is not None:
            payload_set = (
                {payload_entities}
                if isinstance(payload_entities, str)
                else set(payload_entities)
            )
            if payload_set != authorised_set:
                connection.send_error(
                    msg["id"],
                    ERR_TARGET_INVALID,
                    "Target mismatch in service_data (entity_id).",
                )
                return
        # Execute against exactly the authorised target, never against a
        # target supplied by the payload.
        if authorised_set:
            service_data["entity_id"] = (
                authorised_entities
                if isinstance(authorised_entities, str)
                else sorted(authorised_set)
            )

        # Execute with blocking=True so failure is observable before reporting.
        # Only request response for services that declare SupportsResponse.
        # Ordinary control services (turn_on, toggle, etc.) typically use NONE.
        result = None
        try:
            # Home Assistant exposes the response capability of a service via
            # ``ServiceRegistry.supports_response``.  (There is no
            # ``async_get`` method on the registry - using one makes every
            # mediated control call fail with an internal error.)
            supports_response = hass.services.supports_response(domain, service)
            # Ordinary control services (turn_on, toggle, ...) use NONE.
            # ONLY services *require* a response to be requested.
            use_response = getattr(supports_response, "name", "") in (
                "OPTIONAL",
                "REQUIRED",
                "ONLY",
            )
            result = await hass.services.async_call(
                domain,
                service,
                service_data,
                blocking=True,
                return_response=use_response,
                # The execution is performed by the trusted backend, without a
                # Home Assistant user context.  Managed Children live in the
                # native ``system-read-only`` group, so Home Assistant itself
                # refuses *every* entity service call they make directly.
                # The mediated path is therefore the only way a Child can
                # control anything, and it is gated by the canonical Domolux
                # authorization check performed above.
                context=Context(),
            )
        except Exception as err:
            _LOGGER.error("Service execution failed: %s", err)
            connection.send_error(
                msg["id"], ERR_INTERNAL_ERROR, f"Execution failed: {err}"
            )
            return
        connection.send_result(
            msg["id"],
            {
                "success": True,
                "executed_by": user_id,
                "reason": "entity_control_granted",
                "mediated_by": "domolux_service_auth",
                "service_result": result,
            },
        )
    except Exception as err:
        _LOGGER.error("Service execution failed: %s", err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Execution failed: {err}"
        )


def async_register_service_auth_commands(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_service_authorize)
    websocket_api.async_register_command(hass, ws_service_enforce)
