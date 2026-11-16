"""Integration tests for the Domolux service authorization boundary.

These tests exercise the actual authorization path with a mocked Home
Assistant auth layer for unit-level verification.  They assert observable
behaviour (result vs. error, service executed vs. not executed) rather than
merely the presence of constants.

Live-system enforcement — i.e. the native WebSocket ``call_service`` channel,
the REST channel and the script/automation channels — is covered by
``tests/enforcement/test_service_guard.py`` and by the container based
end-to-end suite.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_READ,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.permission_evaluator import (
    DomoluxPermissionEvaluator,
)
from custom_components.domolux_roles.resolver import resolve_entity_access
from custom_components.domolux_roles.service_auth_api import (
    ALLOWED_CONTROL_DOMAINS,
    ALLOWED_CONTROL_SERVICES,
    DANGEROUS_DOMAINS,
    ERR_INTERNAL_ERROR,
    ERR_SERVICE_DENIED,
    ERR_SERVICE_NOT_ALLOWED,
    ws_service_authorize,
    ws_service_enforce,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

CHILD_USER_ID = "22222222-2222-4222-8222-222222222222"
FATHER_USER_ID = "33333333-3333-4333-8333-333333333333"


def _setup_evaluator(hass, access_level=ACCESS_LEVEL_CONTROL):
    store = DomoluxRoleStore(hass)
    store._store = None
    store.set_father(
        FatherRoleAssignment(
            user_id=FATHER_USER_ID,
            assigned_at="2026-01-01T00:00:00+00:00",
            assigned_by=FATHER_USER_ID,
            status=FatherRoleStatus.ACTIVE,
        )
    )
    store.set_user_permissions(
        UserPermissionSet(
            user_id=CHILD_USER_ID,
            default_access_level="none",
            entity_rules={
                "r1": EntityPermissionRule(
                    rule_id="r1",
                    target_type="entity",
                    target_id="light.hall",
                    access_level=access_level,
                )
            },
        )
    )
    evaluator = DomoluxPermissionEvaluator(hass, store)
    return evaluator


def _connection(hass, user_id=CHILD_USER_ID):
    connection = MagicMock()
    connection.hass = hass
    user = MagicMock()
    user.id = user_id
    user.is_admin = False
    user.is_owner = False
    user.is_disabled = False
    connection.user = user
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    return connection


def _hass_with_evaluator(evaluator):
    from custom_components.domolux_roles import DOMAIN

    hass = MagicMock()
    hass.data = {DOMAIN: {"entry": {"store": evaluator.store, "evaluator": evaluator}}}
    hass.services.async_call = AsyncMock(return_value=None)
    hass.services.async_get = MagicMock(return_value=MagicMock(supports_response=None))
    return hass


async def test_authorized_child_controls_permitted_entity():
    """Test 1: Authorized Child can control an explicitly permitted entity."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    res = await evaluator.evaluate_entity_access(
        CHILD_USER_ID, "light.hall", required_level=ACCESS_LEVEL_CONTROL
    )
    assert res.granted is True
    assert res.matching_rule_type == "entity"


async def test_child_denied_control_on_denied_entity():
    """Test 2: Child with read but not control cannot operate that entity."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass, access_level=ACCESS_LEVEL_READ)
    res = await evaluator.evaluate_entity_access(
        CHILD_USER_ID, "light.hall", required_level=ACCESS_LEVEL_CONTROL
    )
    assert res.granted is False


async def test_domain_service_allowlist_blocks_arbitrary():
    """Test 6: Child cannot invoke arbitrary/admin service."""
    assert "light" in ALLOWED_CONTROL_DOMAINS
    assert "turn_on" in ALLOWED_CONTROL_SERVICES
    assert "manage" not in ALLOWED_CONTROL_DOMAINS
    assert "delete" not in ALLOWED_CONTROL_SERVICES
    # Administrative domains are explicitly denied.
    for domain in ("script", "scene", "shell_command", "python_script", "homeassistant"):
        assert domain in DANGEROUS_DOMAINS


async def test_service_execution_error_not_false_success():
    """Test 8: A failing service call reports an error, never a success."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    hass.services.async_call = AsyncMock(side_effect=RuntimeError("boom"))
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/enforce",
            "domain": "light",
            "service": "turn_on",
            "entity_id": ["light.hall"],
            "service_data": {"entity_id": ["light.hall"]},
        },
    )

    connection.send_result.assert_not_called()
    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_INTERNAL_ERROR


async def test_client_cannot_substitute_user_id():
    """Test 7: Client-supplied user_id in msg is ignored; identity comes from
    the authenticated connection only."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    connection = _connection(hass)

    # The payload claims to be the Father; the connection is the Child.
    await ws_service_authorize(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/authorize",
            "domain": "light",
            "service": "turn_on",
            "entity_id": ["light.forbidden"],
            "user_id": FATHER_USER_ID,
        },
    )

    # The Father override must NOT be applied to a Child that merely claims
    # the Father id in the payload.
    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_SERVICE_DENIED
    connection.send_result.assert_not_called()


async def test_light_turn_on_succeeds():
    """Test 1: Allowed light.turn_on succeeds with permitted entity."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/enforce",
            "domain": "light",
            "service": "turn_on",
            "entity_id": ["light.hall"],
            "service_data": {"entity_id": ["light.hall"]},
        },
    )

    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert result["success"] is True
    assert result["executed_by"] == CHILD_USER_ID
    hass.services.async_call.assert_called_once()
    assert hass.services.async_call.call_args.args[0] == "light"
    assert hass.services.async_call.call_args.args[1] == "turn_on"


async def test_denied_entity_is_not_executed():
    """A Child without a grant cannot execute the service at all."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/enforce",
            "domain": "light",
            "service": "turn_on",
            "entity_id": ["light.forbidden"],
            "service_data": {"entity_id": ["light.forbidden"]},
        },
    )

    connection.send_result.assert_not_called()
    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_SERVICE_DENIED
    hass.services.async_call.assert_not_called()


async def test_dangerous_domain_is_rejected_before_evaluation():
    """A Child cannot reach the script domain at all."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/enforce",
            "domain": "script",
            "service": "turn_on",
            "entity_id": ["light.hall"],
        },
    )

    connection.send_result.assert_not_called()
    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_SERVICE_NOT_ALLOWED
    hass.services.async_call.assert_not_called()


async def test_father_may_authorize_any_entity():
    """The Father is not restricted by the Child policy."""
    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    connection = _connection(hass, user_id=FATHER_USER_ID)

    await ws_service_authorize(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/authorize",
            "domain": "light",
            "service": "turn_on",
            "entity_id": ["light.anything"],
        },
    )

    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()
    assert connection.send_result.call_args[0][1]["reason"] == "father_override"


async def test_control_implies_read_in_the_resolver():
    """The documented hierarchy: CONTROL implies READ."""
    from custom_components.domolux_roles.models import UserPermissionSet

    grants = UserPermissionSet(
        user_id=CHILD_USER_ID,
        default_access_level="none",
        entity_rules={
            "r1": EntityPermissionRule(
                rule_id="r1",
                target_type="entity",
                target_id="light.hall",
                access_level=ACCESS_LEVEL_CONTROL,
            )
        },
    )
    control = resolve_entity_access(
        grants, {}, CHILD_USER_ID, "light.hall", ACCESS_LEVEL_CONTROL
    )
    read = resolve_entity_access(
        grants, {}, CHILD_USER_ID, "light.hall", ACCESS_LEVEL_READ
    )
    assert control.granted is True
    assert read.granted is True


@pytest.mark.asyncio
async def test_service_authorization_reports_reason_codes():
    """Every denial carries a stable, non-leaking reason code."""
    from custom_components.domolux_roles.service_guard import (
        REASON_ENTITY_NOT_GRANTED,
    )

    hass = MagicMock()
    evaluator = _setup_evaluator(hass)
    hass = _hass_with_evaluator(evaluator)
    connection = _connection(hass)

    await ws_service_authorize(
        hass,
        connection,
        {
            "id": 1,
            "type": "domolux/service/authorize",
            "domain": "light",
            "service": "turn_on",
            "entity_id": ["light.forbidden"],
        },
    )

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_SERVICE_DENIED
    assert REASON_ENTITY_NOT_GRANTED
