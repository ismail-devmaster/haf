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

    # Execute via HA service call with authenticated context
    try:
        domain = msg["domain"]
        service = msg["service"]
        service_data = msg.get("service_data") or {}
        service_data = dict(service_data)
        # Preserve user identity in service context
        service_data["user_id"] = user_id
        await hass.services.async_call(domain, service, service_data, blocking=False)
        connection.send_result(msg["id"], {"success": True, "executed_by": user_id})
    except Exception as err:
        _LOGGER.error("Service execution failed: %s", err)
        connection.send_error(
            msg["id"], ERR_INTERNAL_ERROR, f"Execution failed: {err}"
        )


def async_register_service_auth_commands(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_service_authorize)
    websocket_api.async_register_command(hass, ws_service_enforce)
