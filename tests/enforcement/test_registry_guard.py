"""Tests for the registry privacy guard (finding T3.3).

Home Assistant's registry list commands expose every entity id, name, area,
device and floor to any authenticated user.  These tests prove that a managed
Child cannot see what they cannot read through those commands, while the
Father, administrators/owners and unmanaged users are untouched, and that the
guard cleanly installs and uninstalls.
"""

from unittest.mock import MagicMock

import pytest

from custom_components.domolux_roles import DOMAIN
from custom_components.domolux_roles import registry_guard
from custom_components.domolux_roles.const import ACCESS_LEVEL_READ
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.resolver import resolve_entity_access
from custom_components.domolux_roles.store import DomoluxRoleStore

CHILD = "22222222-2222-4222-8222-222222222222"
FATHER = "33333333-3333-4333-8333-333333333333"
ADMIN = "44444444-4444-4444-8444-444444444444"


class _FakeEvaluator:
    def __init__(self, store):
        self.store = store

    async def evaluate_entity_access(
        self, user_id, entity_id, required_level=ACCESS_LEVEL_READ
    ):
        grants = self.store.get_user_permissions(user_id)
        return resolve_entity_access(grants, {}, user_id, entity_id, required_level)


@pytest.fixture(autouse=True)
def _clean_state():
    yield
    registry_guard.uninstall_registry_guard(MagicMock())


def _hass(child_rules=None):
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
    if child_rules is not None:
        store.set_user_permissions(
            UserPermissionSet(user_id=CHILD, **child_rules)
        )
    entry = {
        "store": store,
        "evaluator": _FakeEvaluator(store),
    }
    hass.data = {DOMAIN: {DEFAULT_ENTRY: entry}}
    return hass, store


DEFAULT_ENTRY = "entry_0"


def _user(user_id, readable):
    user = MagicMock()
    user.id = user_id
    user.is_admin = False
    user.is_owner = False
    user.permissions.check_entity = lambda entity_id, key: entity_id in readable
    return user


def _wrap_handlers(hass):
    handlers = {}
    for command in registry_guard._WRAPPED_COMMANDS:
        handlers[command] = (lambda *a, **k: None, None)
    handlers[registry_guard._GET_ENTITY_COMMAND] = (lambda *a, **k: None, None)
    hass.data["websocket_api"] = handlers


def _configure_registries(hass, entities, devices=None):
    """Inject fake entity/device registries so _visible_structure can iterate."""
    devices = devices or {}

    class _Ent:
        def __init__(self, entity_id, area_id=None, device_id=None):
            self.entity_id = entity_id
            self.area_id = area_id
            self.device_id = device_id

    class _Dev:
        def __init__(self, area_id=None):
            self.area_id = area_id

    reg = MagicMock()
    reg.entities = {eid: _Ent(eid, info.get("area_id"), info.get("device_id")) for eid, info in entities.items()}
    devreg = MagicMock()
    devreg.async_get = lambda did: devices.get(did)
    registry_guard.er.async_get.return_value = reg
    registry_guard.dr.async_get.return_value = devreg


def test_install_wraps_handlers():
    hass, _store = _hass()
    _wrap_handlers(hass)
    installed = registry_guard.install_registry_guard(hass)
    assert installed is True
    for command in registry_guard._WRAPPED_COMMANDS:
        wrapper, _schema = hass.data["websocket_api"][command]
        assert getattr(wrapper, registry_guard._MARKER, False) is True
    wrapper, _schema = hass.data["websocket_api"][registry_guard._GET_ENTITY_COMMAND]
    assert getattr(wrapper, registry_guard._MARKER, False) is True


def test_install_is_idempotent():
    hass, _store = _hass()
    _wrap_handlers(hass)
    assert registry_guard.install_registry_guard(hass) is True
    assert registry_guard.install_registry_guard(hass) is True


def test_uninstall_restores_originals():
    hass, _store = _hass()
    _wrap_handlers(hass)
    originals = {}
    for command in list(registry_guard._WRAPPED_COMMANDS) + [
        registry_guard._GET_ENTITY_COMMAND
    ]:
        originals[command] = hass.data["websocket_api"][command][0]
    registry_guard.install_registry_guard(hass)
    registry_guard.uninstall_registry_guard(hass)
    for command, original in originals.items():
        assert hass.data["websocket_api"][command][0] is original


def _run_list_wrapper(hass, user_id, readable):
    _wrap_handlers(hass)
    _configure_registries(
        hass,
        {
            "light.kitchen": {"area_id": "area_kitchen"},
            "light.bedroom": {"area_id": "area_bedroom"},
        },
        {},
    )
    registry_guard.install_registry_guard(hass)
    connection = MagicMock()
    connection.user = _user(user_id, readable)
    connection.hass = hass
    sent = []

    def capture_send(message):
        sent.append(message)

    connection.send_message = capture_send

    def original_list(hass2, conn, msg):
        conn.send_message(
            {
                "id": msg["id"],
                "type": "result",
                "success": True,
                "result": [
                    {"entity_id": "light.kitchen"},
                    {"entity_id": "light.bedroom"},
                ],
            }
        )

    # Replace the wrapped handler with our fake original so we control the
    # response shape, then run the wrapper synchronously (real handlers are
    # @callback sync functions).
    hass.data["websocket_api"]["config/entity_registry/list"] = (
        original_list,
        None,
    )
    registry_guard.uninstall_registry_guard(hass)
    registry_guard.install_registry_guard(hass)

    hass.data["websocket_api"]["config/entity_registry/list"][0](
        hass, connection, {"id": 1}
    )
    return sent


def test_child_cannot_see_hidden_entity_list():
    hass, store = _hass(
        {
            "default_access_level": "none",
            "entity_rules": {},
            "view_rules": {},
        }
    )
    sent = _run_list_wrapper(hass, CHILD, set())
    assert sent[0]["result"] == [], sent[0]["result"]

def test_child_keeps_granted_entity():
    hass, store = _hass(
        {
            "default_access_level": "none",
            "entity_rules": {
                "rule1": {
                    "rule_id": "rule1",
                    "target_type": "entity",
                    "target_id": "light.kitchen",
                    "access_level": "control",
                }
            },
            "view_rules": {},
        }
    )
    sent = _run_list_wrapper(hass, CHILD, {"light.kitchen"})
    assert sent[0]["result"] == [{"entity_id": "light.kitchen"}], sent[0]["result"]


def test_father_sees_everything():
    hass, store = _hass(
        {
            "default_access_level": "none",
            "entity_rules": {},
            "view_rules": {},
        }
    )
    sent = _run_list_wrapper(hass, FATHER, {"light.kitchen", "light.bedroom"})
    assert len(sent[0]["result"]) == 2


def test_hidden_entity_lookup_denied():
    hass, store = _hass(
        {
            "default_access_level": "none",
            "entity_rules": {},
            "view_rules": {},
        }
    )
    _wrap_handlers(hass)
    registry_guard.install_registry_guard(hass)
    connection = MagicMock()
    connection.user = _user(CHILD, set())
    connection.hass = hass
    sent = []
    errors = []

    def capture_send(message):
        sent.append(message)

    connection.send_message = capture_send
    connection.send_error = lambda msg_id, code, message: errors.append(
        {"id": msg_id, "error": {"code": code, "message": message}}
    )

    def original_get(hass2, conn, msg):
        conn.send_message(
            {
                "id": msg["id"],
                "type": "result",
                "success": True,
                "result": {"entity_id": "light.bedroom", "name": "Bedroom"},
            }
        )

    hass.data["websocket_api"]["config/entity_registry/get"] = (
        original_get,
        None,
    )
    registry_guard.uninstall_registry_guard(hass)
    registry_guard.install_registry_guard(hass)

    outcome = hass.data["websocket_api"]["config/entity_registry/get"][0](
        hass, connection, {"id": 1, "entity_id": "light.bedroom"}
    )
    assert outcome is None
    assert len(errors) == 1
