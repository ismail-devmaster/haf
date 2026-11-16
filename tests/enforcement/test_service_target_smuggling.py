"""Regression tests for target smuggling in the mediated service path.

``domolux/service/enforce`` executes a service on behalf of a Child after the
backend authorised the target.  Home Assistant merges the ``target`` object
into the service data and the entity platform then expands
``entity_id`` / ``device_id`` / ``area_id`` / ``floor_id`` / ``label_id`` from
that payload.

A payload that carries ``device_id`` or ``area_id`` therefore reaches entities
that were never authorised.  These tests lock the fix down: the mediated path
must reject any smuggled target and must execute exactly the authorised
entity.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles import DOMAIN
from custom_components.domolux_roles.const import ACCESS_LEVEL_CONTROL
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.resolver import resolve_entity_access
from custom_components.domolux_roles import service_auth_api
from custom_components.domolux_roles.service_auth_api import (
    ERR_SERVICE_DENIED,
    ERR_TARGET_INVALID,
    ws_service_enforce,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

CHILD = "22222222-2222-4222-8222-222222222222"
FATHER = "33333333-3333-4333-8333-333333333333"


class _FakeEvaluator:
    """Evaluator backed by the real pure resolver."""

    def __init__(self, store):
        self.store = store

    def _is_father(self, user_id):
        father = self.store.get_father()
        return father is not None and father.user_id == user_id

    async def _is_admin_or_owner(self, user_id):
        return False

    async def evaluate_entity_access(
        self, user_id, entity_id, required_level=ACCESS_LEVEL_CONTROL
    ):
        grants = self.store.get_user_permissions(user_id)
        return resolve_entity_access(grants, {}, user_id, entity_id, required_level)


@pytest.fixture(autouse=True)
def _context_stub(monkeypatch):
    """Use a real Context stand-in so the acting principal is observable."""

    class _Context:
        def __init__(self, user_id=None):
            self.user_id = user_id

    monkeypatch.setattr(service_auth_api, "Context", _Context)


def _hass():
    hass = MagicMock()
    store = DomoluxRoleStore(hass)
    store._store = None
    store.set_father(
        FatherRoleAssignment(
            user_id=FATHER,
            assigned_at="2026-01-01T00:00:00+00:00",
            assigned_by=FATHER,
            status=FatherRoleStatus.ACTIVE,
        )
    )
    store.add_family_member(
        FamilyMemberRecord(
            user_id=CHILD,
            display_name="Child A",
            username="child_a",
            managed_group_id="group_child_a",
        )
    )
    store.set_user_permissions(
        UserPermissionSet(
            user_id=CHILD,
            default_access_level="none",
            entity_rules={
                "r1": EntityPermissionRule(
                    rule_id="r1",
                    target_type="entity",
                    target_id="light.lamp",
                    access_level="control",
                )
            },
        )
    )
    evaluator = _FakeEvaluator(store)
    hass.data = {DOMAIN: {"entry": {"store": store, "evaluator": evaluator}}}
    hass.services.async_call = AsyncMock(return_value=None)
    hass.services.async_get = MagicMock(
        return_value=MagicMock(supports_response=None)
    )
    return hass


def _connection(hass):
    connection = MagicMock()
    connection.hass = hass
    user = MagicMock()
    user.id = CHILD
    user.is_admin = False
    user.is_owner = False
    user.is_disabled = False
    connection.user = user
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    return connection


def _msg(**overrides):
    msg = {
        "id": 1,
        "type": "domolux/service/enforce",
        "domain": "light",
        "service": "turn_on",
        "entity_id": ["light.lamp"],
        "service_data": {},
    }
    msg.update(overrides)
    return msg


@pytest.mark.asyncio
async def test_smuggled_device_id_is_rejected_and_nothing_executes():
    """A payload carrying device_id must not reach a forbidden device."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        _msg(service_data={"device_id": "dev_curtain"}),
    )

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_TARGET_INVALID
    hass.services.async_call.assert_not_called()
    connection.send_result.assert_not_called()


@pytest.mark.asyncio
async def test_smuggled_area_id_is_rejected_and_nothing_executes():
    """A payload carrying area_id must not reach a forbidden area."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        _msg(service_data={"area_id": "living_room"}),
    )

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_TARGET_INVALID
    hass.services.async_call.assert_not_called()


@pytest.mark.asyncio
async def test_smuggled_target_object_is_rejected():
    """A payload carrying a nested target object must be rejected."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        _msg(service_data={"target": {"entity_id": ["cover.curtain"]}}),
    )

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_TARGET_INVALID
    hass.services.async_call.assert_not_called()


@pytest.mark.asyncio
async def test_entity_id_mismatch_is_rejected():
    """The payload entity_id must match the authorised target exactly."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        _msg(service_data={"entity_id": ["cover.curtain"]}),
    )

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_TARGET_INVALID
    hass.services.async_call.assert_not_called()


@pytest.mark.asyncio
async def test_wildcard_entity_id_is_rejected():
    """``entity_id: all`` must never be executable through the mediated path."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(hass, connection, _msg(entity_id=["all"]))

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_TARGET_INVALID
    hass.services.async_call.assert_not_called()


@pytest.mark.asyncio
async def test_entity_without_grant_is_denied():
    """An entity that is not granted must not be executed."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(hass, connection, _msg(entity_id=["cover.curtain"]))

    connection.send_error.assert_called_once()
    assert connection.send_error.call_args[0][1] == ERR_SERVICE_DENIED
    hass.services.async_call.assert_not_called()


@pytest.mark.asyncio
async def test_permitted_call_executes_the_authorised_entity():
    """A permitted call executes exactly the authorised entity."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(
        hass,
        connection,
        _msg(service_data={"entity_id": ["light.lamp"], "brightness": 120}),
    )

    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()
    hass.services.async_call.assert_called_once()
    call = hass.services.async_call.call_args
    assert call.args[0] == "light"
    assert call.args[1] == "turn_on"
    assert call.args[2]["entity_id"] == ["light.lamp"]
    assert call.args[2]["brightness"] == 120


@pytest.mark.asyncio
async def test_execution_uses_a_privileged_context():
    """The mediated execution carries no Home Assistant user context.

    Managed Children are members of the native ``system-read-only`` group, so
    Home Assistant refuses any entity service call that carries their user
    id.  The mediated path is the only control channel a Child has and it is
    gated by the canonical Domolux authorization check, so it executes with a
    context that has no user id.
    """
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(hass, connection, _msg())

    context = hass.services.async_call.call_args.kwargs["context"]
    assert context.user_id is None


@pytest.mark.asyncio
async def test_dangerous_domain_is_rejected():
    """Script/scene execution must remain unavailable to a Child."""
    hass = _hass()
    connection = _connection(hass)

    await ws_service_enforce(
        hass, connection, _msg(domain="script", service="turn_on")
    )

    connection.send_error.assert_called_once()
    hass.services.async_call.assert_not_called()
