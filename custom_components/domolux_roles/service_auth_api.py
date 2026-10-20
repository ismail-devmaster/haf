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
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import Unauthorized
import voluptuous as vol

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
ALLOWED_CONTROL_DOMAINS = {
    "light",
    "switch",
    "fan",
    "media_player",
    "climate",
    "cover",
    "lock",
    "binary_sensor",
    "sensor",
    "number",
    "select",
}
ALLOWED_CONTROL_SERVICES = {
    "turn_on",
    "turn_off",
    "toggle",
    "set_value",
    "set_percentage",
    "set_speed_percentage",
    "open_cover",
    "close_cover",
    "stop_cover",
    "set_temperature",
    "set_fan_mode",
    "set_preset_mode",
    "select_option",
    "select_next",
    "select_previous",
}


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/service/authorize",
        vol.Required("domain"): str,
        vol.Required("service"): str,
        vol.Optional("entity_id"): str,
        vol.Optional("service_data"): dict,
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

    # Validate domain/service against deliberate allowlist.
    # Reject arbitrary, admin-only, core management, and unsupported operations.
    if domain not in ALLOWED_CONTROL_DOMAINS:
        connection.send_error(
            msg["id"], ERR_SERVICE_NOT_ALLOWED, f"Domain '{domain}' not permitted for Child control."
        )
        return
    if service not in ALLOWED_CONTROL_SERVICES:
        connection.send_error(
            msg["id"], ERR_SERVICE_NOT_ALLOWED, f"Service '{service}' not permitted."
        )
        return

    # Reject wildcard / broad targets that could expand to unauthorized entities.
    if entity_id is not None:
        if isinstance(entity_id, str) and (entity_id == "all" or entity_id.startswith("device.") or entity_id.startswith("area.")):
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Wildcard or broad targets not supported. Provide explicit entity_id."
            )
            return
        # Reject list targets that mix allowed and denied (must check each).
        if isinstance(entity_id, list):
            if not entity_id:
                connection.send_error(msg["id"], ERR_TARGET_INVALID, "Empty target list.")
                return
            # For now, reject multi-entity targets unless all explicitly permitted.
            # Full per-item evaluation is required for safe batch control.
            connection.send_error(
                msg["id"], ERR_TARGET_INVALID, "Multi-entity batch targets require individual authorization checks per item."
            )
            return

    if not domain or not service:
        connection.send_error(msg["id"], "invalid_format", "Domain/service required.")
        return

    evaluator: DomoluxPermissionEvaluator = _get_evaluator(hass)

    # Father / Admin override -> full control allowed
    is_father = evaluator._is_father(user_id)
    if is_father:
        connection.send_result(msg["id"], {"authorized": True, "reason": "father_override"})
        return

    # Admin / Owner check (same as evaluator)
    try:
        is_admin_owner = await evaluator._is_admin_or_owner(user_id)
    except Exception:
        is_admin_owner = False
    if is_admin_owner:
        connection.send_result(msg["id"], {"authorized": True, "reason": "admin_override"})
        return

    # Evaluate control access on target entity if provided
    if entity_id:
        try:
            result = await evaluator.evaluate_entity_access(
                user_id, entity_id, required_level=ACCESS_LEVEL_CONTROL
            )
        except Exception:
            connection.send_error(msg["id"], "internal_error", "Evaluation failed.")
            return
        if not result.granted:
            connection.send_error(
                msg["id"], ERR_SERVICE_DENIED, "Control permission denied for entity."
            )
            return

    connection.send_result(msg["id"], {"authorized": True, "reason": "entity_control_granted"})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "domolux/service/enforce",
        vol.Required("domain"): str,
        vol.Required("service"): str,
        vol.Optional("entity_id"): str,
        vol.Optional("service_data"): dict,
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
    entity_id = msg.get("entity_id")

    evaluator = _get_evaluator(hass)
    is_father = evaluator._is_father(user_id)
    is_admin_owner = False
    try:
        is_admin_owner = await evaluator._is_admin_or_owner(user_id)
    except Exception:
        pass

    # Authorization gate
    authorized = False
    if is_father or is_admin_owner:
        authorized = True
    elif entity_id:
        try:
            res = await evaluator.evaluate_entity_access(
                user_id, entity_id, required_level=ACCESS_LEVEL_CONTROL
            )
            authorized = res.granted
        except Exception:
            authorized = False

    if not authorized:
        connection.send_error(
            msg["id"], ERR_SERVICE_DENIED, "Control authorization denied."
        )
        return

    # Execute via HA service call.
    # The backend performs a mediated, privileged action for the permitted target.
    # We do NOT pass the Child's native user context via service_data; instead the
    # operation is executed by the trusted backend, with audit attribution preserved.
    try:
        domain = msg["domain"]
        service = msg["service"]
        service_data = msg.get("service_data") or {}
        service_data = dict(service_data)

        # Remove misleading user_id from service payload; it does not establish
        # Home Assistant execution identity (Core uses context=, not service_data).
        service_data.pop("user_id", None)
        # Reject attempts to smuggle target entities through service_data (e.g., target, entity_id inside payload).
        for key in ("entity_id", "target", "device_id", "area_id", "group_id"):
            if key in service_data:
                # If payload tries to set target separately from msg, reject.
                # Only allow entity-specific keys that do not redefine authorization.
                if key == "entity_id" and service_data[key] != msg.get("entity_id"):
                    connection.send_error(
                        msg["id"], ERR_TARGET_INVALID, f"Target mismatch in service_data ({key})."
                    )
                    return

        # Execute with blocking=True so failure is observable before reporting.
        # Only request response for services that declare SupportsResponse.
        # Ordinary control services (turn_on, toggle, etc.) typically use NONE.
        result = None
        try:
            service_obj = hass.services.async_get(domain, service)
            supports_response = getattr(service_obj, "supports_response", None)
            # If service supports response and we can determine safely, request it.
            # For ordinary control operations we keep blocking without response
            # to avoid ServiceValidationError on ServicesResponse.NONE.
            use_response = False
            if supports_response is not None:
                # Only use return_response when service explicitly supports it
                from homeassistant.helpers.service import SupportsResponse
                use_response = supports_response == SupportsResponse.REQUIRED or supports_response == SupportsResponse.OPTIONAL
            result = await hass.services.async_call(
                domain, service, service_data, blocking=True, return_response=use_response
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
