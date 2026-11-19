"""Universal Read Permission Verification Across Integrations.

Tests that the Domolux Roles Read permission works consistently across ALL
entity domains and integrations supported by Home Assistant:
- Reading entity state, attributes, history, and registry entries is permitted.
- Control operations, actions, and service calls are strictly denied.
- Read permission never grants control (no implicit control, no fallthrough).
- Explicit Deny overrides device/area Read grants.
- Explicit Read on an entity overrides device/area Control grants.
- Transitions (Read -> Control, Control -> Read, Read -> Deny) take immediate effect.
- Default Deny is strictly preserved for unassigned entities across all integrations.
"""

import sys
import types
from unittest.mock import MagicMock
import pytest

from custom_components.domolux_roles import DOMAIN
from custom_components.domolux_roles import service_guard
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    STATUS_ACTIVE,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from custom_components.domolux_roles.ha_auth_adapter import DomoluxHAAuthAdapter
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
)
from custom_components.domolux_roles.read_channel_guard import _readable_entities
from custom_components.domolux_roles.registry_guard import _can_read
from custom_components.domolux_roles.resolver import resolve_entity_access
from custom_components.domolux_roles.service_guard import (
    REASON_ALLOWED,
    REASON_ENTITY_NOT_GRANTED,
    async_authorize_service_call,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

FATHER_ID = "11111111-1111-4111-8111-111111111111"
CHILD_ID = "22222222-2222-4222-8222-222222222222"

INTEGRATION_TEST_CASES = [
    # (domain, entity_id, control_service, service_data)
    ("light", "light.kitchen_ceiling", "turn_on", {}),
    ("switch", "switch.water_pump", "turn_on", {}),
    ("cover", "cover.garage_door", "open_cover", {}),
    ("climate", "climate.living_room_ac", "set_temperature", {"temperature": 22}),
    ("fan", "fan.bedroom_fan", "turn_on", {}),
    ("lock", "lock.front_door", "lock", {}),
    ("media_player", "media_player.tv_lounge", "media_play", {}),
    ("vacuum", "vacuum.robot_cleaner", "start", {}),
    ("valve", "valve.irrigation_valve", "open_valve", {}),
    ("humidifier", "humidifier.nursery", "turn_on", {}),
    ("water_heater", "water_heater.main_boiler", "set_temperature", {"temperature": 55}),
    ("camera", "camera.driveway", "turn_on", {}),
    ("weather", "weather.home_forecast", "turn_on", {}),
    ("sensor", "sensor.outdoor_temperature", "turn_on", {}),
    ("binary_sensor", "binary_sensor.front_motion", "turn_on", {}),
    ("alarm_control_panel", "alarm_control_panel.home_alarm", "alarm_arm_home", {}),
    ("remote", "remote.harmony_hub", "turn_on", {}),
    ("siren", "siren.security_siren", "turn_on", {}),
    ("device_tracker", "device_tracker.child_phone", "turn_on", {}),
    ("person", "person.john_doe", "turn_on", {}),
    ("sun", "sun.sun", "turn_on", {}),
    ("update", "update.core_update", "install", {}),
    ("todo", "todo.shopping_list", "turn_on", {}),
    ("event", "event.doorbell_press", "turn_on", {}),
    ("number", "number.target_speed", "set_value", {"value": 10}),
    ("select", "select.ac_mode", "select_option", {"option": "cool"}),
    ("button", "button.restart_device", "press", {}),
]


class _FakeSelectedEntities:
    def __init__(self) -> None:
        self.referenced: set[str] = set()
        self.indirectly_referenced: set[str] = set()
        self.missing_devices: set[str] = set()
        self.missing_areas: set[str] = set()
        self.missing_floors: set[str] = set()
        self.missing_labels: set[str] = set()


def _as_set(value):
    if value is None:
        return set()
    if isinstance(value, (list, tuple, set)):
        return {str(item) for item in value}
    return {str(value)}


class _FakeTargetSelection:
    def __init__(self, config) -> None:
        config = config or {}
        self.entity_ids = _as_set(config.get("entity_id"))
        self.device_ids = _as_set(config.get("device_id"))
        self.area_ids = _as_set(config.get("area_id"))
        self.floor_ids = _as_set(config.get("floor_id"))
        self.label_ids = _as_set(config.get("label_id"))

    @property
    def has_any_target(self) -> bool:
        return bool(
            self.entity_ids
            or self.device_ids
            or self.area_ids
            or self.floor_ids
            or self.label_ids
        )


def _fake_extract_referenced_entity_ids(hass, selection, expand_group=True):
    selected = _FakeSelectedEntities()
    selected.referenced = set(selection.entity_ids)
    return selected


@pytest.fixture(autouse=True)
def _fake_target_helper(monkeypatch):
    module = types.ModuleType("homeassistant.helpers.target")
    module.TargetSelection = _FakeTargetSelection
    module.SelectedEntities = _FakeSelectedEntities
    module.async_extract_referenced_entity_ids = _fake_extract_referenced_entity_ids
    monkeypatch.setitem(sys.modules, "homeassistant.helpers.target", module)
    yield module


@pytest.fixture(autouse=True)
def _clean_guard_state():
    yield
    service_guard.uninstall_service_guard()


class _MockEvaluator:
    def __init__(self, hass, store):
        self.hass = hass
        self.store = store

    def _is_father(self, user_id):
        return user_id == FATHER_ID

    async def _is_admin_or_owner(self, user_id):
        return False

    async def evaluate_entity_access(self, user_id, entity_id, required_level=ACCESS_LEVEL_READ):
        grants = self.store.get_user_permissions(user_id)
        domain_data = self.hass.data.get(DOMAIN, {})
        cached_views = domain_data.get("dashboard_view_entities", {})
        return resolve_entity_access(
            grants,
            {},
            user_id,
            entity_id,
            required_level,
            is_father=self._is_father(user_id),
            is_admin=False,
            view_entity_map=cached_views,
        )


@pytest.fixture
def mock_hass():
    hass = MagicMock()
    hass.data = {}
    store = DomoluxRoleStore(hass)
    store._store = None
    store.set_father(
        FatherRoleAssignment(
            user_id=FATHER_ID,
            assigned_at="2026-01-01T00:00:00+00:00",
            assigned_by="system",
            status=FatherRoleStatus.ACTIVE,
        )
    )
    store.add_family_member(
        FamilyMemberRecord(
            user_id=CHILD_ID,
            username="child",
            display_name="Child One",
            managed_group_id=f"domolux-family-{CHILD_ID}",
            status=STATUS_ACTIVE,
        )
    )
    evaluator = _MockEvaluator(hass, store)
    hass.data[DOMAIN] = {
        "entry": {"store": store, "evaluator": evaluator},
        "store": store,
        "evaluator": evaluator,
        "dashboard_view_entities": {},
    }
    return hass


# ---------------------------------------------------------------------------
# Test 1: Universal Read Permission Matrix Across All Supported Integrations
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
@pytest.mark.parametrize("domain,entity_id,service,service_data", INTEGRATION_TEST_CASES)
async def test_read_permission_across_integrations(mock_hass, domain, entity_id, service, service_data):
    """Verify Read permission allows reading, history, and registry, but strictly denies control."""
    store = mock_hass.data[DOMAIN]["store"]
    perm_set = store.get_user_permissions(CHILD_ID)

    # 1. Assign READ permission
    perm_set.entity_rules[f"rule_{entity_id}"] = EntityPermissionRule(
        rule_id=f"rule_{entity_id}",
        target_type=TARGET_ENTITY,
        target_id=entity_id,
        access_level=ACCESS_LEVEL_READ,
    )
    store.set_user_permissions(perm_set)

    # 2. Check resolver decision: Read is GRANTED
    eval_read = resolve_entity_access(
        perm_set,
        {},
        CHILD_ID,
        entity_id,
        required_level=ACCESS_LEVEL_READ,
    )
    assert eval_read.granted is True
    assert eval_read.access_level == ACCESS_LEVEL_READ

    # 3. Check resolver decision: Control is DENIED
    eval_ctrl = resolve_entity_access(
        perm_set,
        {},
        CHILD_ID,
        entity_id,
        required_level=ACCESS_LEVEL_CONTROL,
    )
    assert eval_ctrl.granted is False

    # 4. Check native HA group policy translation:
    # Must contain {"read": True} and MUST NOT contain control or control: False
    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})

    assert entity_id in ent_policy
    assert ent_policy[entity_id].get("read") is True
    assert ent_policy[entity_id].get("control") is None, "Read-only policy must omit control key"

    # 5. Service call execution is strictly BLOCKED by server-side guard
    payload = dict(service_data)
    payload["entity_id"] = [entity_id]
    decision = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        domain,
        service,
        payload,
    )
    assert not decision.allowed
    assert decision.reason in (REASON_ENTITY_NOT_GRANTED, "service_not_allowed", "domain_not_allowed")

    # 6. Read channels (history & logbook) allow reading the entity
    allowed_readable = await _readable_entities(mock_hass, CHILD_ID, [entity_id, "other.unassigned"])
    assert entity_id in allowed_readable
    assert "other.unassigned" not in allowed_readable

    # 7. Mock user check_entity using native policy returns correct boolean
    mock_user = MagicMock()
    mock_user.permissions.check_entity.side_effect = (
        lambda eid, key: (eid == entity_id and key == "read")
    )
    assert _can_read(mock_user, entity_id) is True
    assert _can_read(mock_user, "other.unassigned") is False


# ---------------------------------------------------------------------------
# Test 2: Lifecycle Transitions: Read -> Control -> Read -> Deny
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_permission_transitions_read_control_deny(mock_hass):
    """Verify dynamic permission transitions between Read, Control, and Deny."""
    store = mock_hass.data[DOMAIN]["store"]
    test_entity = "climate.bedroom_ac"
    adapter = DomoluxHAAuthAdapter(mock_hass)

    perm_set = store.get_user_permissions(CHILD_ID)

    # Transition 1: Grant READ
    perm_set.entity_rules["rule_t"] = EntityPermissionRule(
        rule_id="rule_t",
        target_type=TARGET_ENTITY,
        target_id=test_entity,
        access_level=ACCESS_LEVEL_READ,
    )
    store.set_user_permissions(perm_set)

    p1 = adapter._build_effective_native_policy(perm_set.to_dict())["entities"]["entity_ids"]
    assert p1[test_entity] == {"read": True}

    dec1 = await async_authorize_service_call(
        mock_hass, CHILD_ID, "climate", "set_temperature", {"entity_id": [test_entity], "temperature": 21}
    )
    assert not dec1.allowed

    # Transition 2: Upgrade from READ to CONTROL
    perm_set.entity_rules["rule_t"] = EntityPermissionRule(
        rule_id="rule_t",
        target_type=TARGET_ENTITY,
        target_id=test_entity,
        access_level=ACCESS_LEVEL_CONTROL,
    )
    store.set_user_permissions(perm_set)

    p2 = adapter._build_effective_native_policy(perm_set.to_dict())["entities"]["entity_ids"]
    assert p2[test_entity] == {"read": True, "control": True}

    dec2 = await async_authorize_service_call(
        mock_hass, CHILD_ID, "climate", "set_temperature", {"entity_id": [test_entity], "temperature": 21}
    )
    assert dec2.allowed is True
    assert dec2.reason == REASON_ALLOWED

    # Transition 3: Downgrade from CONTROL back to READ
    perm_set.entity_rules["rule_t"] = EntityPermissionRule(
        rule_id="rule_t",
        target_type=TARGET_ENTITY,
        target_id=test_entity,
        access_level=ACCESS_LEVEL_READ,
    )
    store.set_user_permissions(perm_set)

    p3 = adapter._build_effective_native_policy(perm_set.to_dict())["entities"]["entity_ids"]
    assert p3[test_entity] == {"read": True}

    dec3 = await async_authorize_service_call(
        mock_hass, CHILD_ID, "climate", "set_temperature", {"entity_id": [test_entity], "temperature": 21}
    )
    assert not dec3.allowed

    # Transition 4: Change from READ to DENY (explicit NONE)
    perm_set.entity_rules["rule_t"] = EntityPermissionRule(
        rule_id="rule_t",
        target_type=TARGET_ENTITY,
        target_id=test_entity,
        access_level=ACCESS_LEVEL_NONE,
    )
    store.set_user_permissions(perm_set)

    p4 = adapter._build_effective_native_policy(perm_set.to_dict())["entities"]["entity_ids"]
    assert test_entity not in p4

    eval_deny = resolve_entity_access(perm_set, {}, CHILD_ID, test_entity, required_level=ACCESS_LEVEL_READ)
    assert eval_deny.granted is False


# ---------------------------------------------------------------------------
# Test 3: Device-Level Read Resolves to All Entities Without Granting Control
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_device_level_read_across_multi_domain_device(mock_hass, monkeypatch):
    """Verify that assigning Read at device level grants Read to all device entities and NO control."""
    dev_id = "device_hvac_system"
    entities = [
        "climate.hvac_main",
        "sensor.hvac_indoor_temp",
        "sensor.hvac_humidity",
        "switch.hvac_fan_mode",
        "binary_sensor.filter_clean_alert",
    ]

    mock_er = MagicMock()
    mock_entries = [MagicMock(entity_id=eid, device_id=dev_id) for eid in entities]
    mock_er.entities.get_entries_for_device_id.return_value = mock_entries

    er_module = types.ModuleType("homeassistant.helpers.entity_registry")
    er_module.async_get = lambda hass: mock_er
    er_module.async_entries_for_device = lambda reg, d_id: mock_entries if d_id == dev_id else []
    monkeypatch.setitem(sys.modules, "homeassistant.helpers.entity_registry", er_module)
    if "homeassistant.helpers" in sys.modules:
        monkeypatch.setattr(sys.modules["homeassistant.helpers"], "entity_registry", er_module, raising=False)

    store = mock_hass.data[DOMAIN]["store"]
    perm_set = store.get_user_permissions(CHILD_ID)

    # Assign READ to the device
    perm_set.entity_rules["rule_dev"] = EntityPermissionRule(
        rule_id="rule_dev",
        target_type=TARGET_DEVICE,
        target_id=dev_id,
        access_level=ACCESS_LEVEL_READ,
    )
    store.set_user_permissions(perm_set)

    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy["entities"]["entity_ids"]

    # Every entity on the device is granted read
    for eid in entities:
        assert eid in ent_policy, f"{eid} must be present in effective policy"
        assert ent_policy[eid] == {"read": True}, f"{eid} must be read-only"

    # Explicit entity override: override switch to DENY
    perm_set.entity_rules["rule_switch_deny"] = EntityPermissionRule(
        rule_id="rule_switch_deny",
        target_type=TARGET_ENTITY,
        target_id="switch.hvac_fan_mode",
        access_level=ACCESS_LEVEL_NONE,
    )
    store.set_user_permissions(perm_set)

    native_policy_overridden = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy_o = native_policy_overridden["entities"]["entity_ids"]

    assert "switch.hvac_fan_mode" not in ent_policy_o
    assert ent_policy_o["climate.hvac_main"] == {"read": True}


# ---------------------------------------------------------------------------
# Test 4: Explicit Entity Read Overrides Device-Level Control (No Fallthrough)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_entity_read_overrides_device_control_prevents_fallthrough(mock_hass, monkeypatch):
    """Verify that an explicit Read on an entity prevents control even if the parent device has Control."""
    dev_id = "device_living_room"
    light_eid = "light.living_room_accent"
    switch_eid = "switch.living_room_plug"

    mock_er = MagicMock()
    mock_entries = [
        MagicMock(entity_id=light_eid, device_id=dev_id),
        MagicMock(entity_id=switch_eid, device_id=dev_id),
    ]
    mock_er.entities.get_entries_for_device_id.return_value = mock_entries

    er_module = types.ModuleType("homeassistant.helpers.entity_registry")
    er_module.async_get = lambda hass: mock_er
    er_module.async_entries_for_device = lambda reg, d_id: mock_entries if d_id == dev_id else []
    monkeypatch.setitem(sys.modules, "homeassistant.helpers.entity_registry", er_module)
    if "homeassistant.helpers" in sys.modules:
        monkeypatch.setattr(sys.modules["homeassistant.helpers"], "entity_registry", er_module, raising=False)

    store = mock_hass.data[DOMAIN]["store"]
    perm_set = store.get_user_permissions(CHILD_ID)

    # Device is CONTROL
    perm_set.entity_rules["rule_dev"] = EntityPermissionRule(
        rule_id="rule_dev",
        target_type=TARGET_DEVICE,
        target_id=dev_id,
        access_level=ACCESS_LEVEL_CONTROL,
    )
    # But light entity is restricted to READ
    perm_set.entity_rules["rule_light_ro"] = EntityPermissionRule(
        rule_id="rule_light_ro",
        target_type=TARGET_ENTITY,
        target_id=light_eid,
        access_level=ACCESS_LEVEL_READ,
    )
    store.set_user_permissions(perm_set)

    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy["entities"]["entity_ids"]

    # switch inherited device CONTROL
    assert ent_policy[switch_eid] == {"read": True, "control": True}
    # light explicitly restricted to READ
    assert ent_policy[light_eid] == {"read": True}

    # Verify device_ids is NOT present in native policy to prevent fallthrough
    assert "device_ids" not in native_policy.get("entities", {})


# ---------------------------------------------------------------------------
# Test 5: Default Deny Enforced Across All Integrations
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_default_deny_enforced_across_all_integrations(mock_hass):
    """Verify unassigned entities across all integrations are completely denied."""
    store = mock_hass.data[DOMAIN]["store"]
    perm_set = store.get_user_permissions(CHILD_ID)
    perm_set.default_access_level = ACCESS_LEVEL_NONE
    store.set_user_permissions(perm_set)

    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})

    for domain, entity_id, service, service_data in INTEGRATION_TEST_CASES:
        assert entity_id not in ent_policy
        eval_read = resolve_entity_access(perm_set, {}, CHILD_ID, entity_id, required_level=ACCESS_LEVEL_READ)
        assert eval_read.granted is False
        eval_ctrl = resolve_entity_access(perm_set, {}, CHILD_ID, entity_id, required_level=ACCESS_LEVEL_CONTROL)
        assert eval_ctrl.granted is False
