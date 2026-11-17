"""Domolux Roles Acceptance Tests (Tests A, B, C, D, E).

Verifies device-centric and dashboard-centric family permission management:
- Test A: Hallway Roller Shade (cover.zm108m) with position slider and user-facing controls.
- Test B: PN16 selective channel access (switch.pn16_l3).
- Test C: Read-only device state access with state-changing operations blocked.
- Test D: Dashboard and View permissions (READ view vs CONTROL view, custom cards, explicit overrides).
- Test E: Immediate revocation without logout or page refresh.
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
    EFFECT_ALLOW,
    EFFECT_DENY,
    STATUS_ACTIVE,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from custom_components.domolux_roles.dependency_discovery import (
    extract_entities_from_card,
    extract_entities_from_view,
)
from custom_components.domolux_roles.ha_auth_adapter import DomoluxHAAuthAdapter
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
    ViewPermissionRule,
)
from custom_components.domolux_roles.resolver import (
    resolve_entity_access,
    resolve_view_access,
)
from custom_components.domolux_roles.service_guard import (
    REASON_ALLOWED,
    REASON_ENTITY_NOT_GRANTED,
    REASON_SERVICE_NOT_ALLOWED,
    async_authorize_service_call,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

FATHER_ID = "11111111-1111-4111-8111-111111111111"
CHILD_ID = "22222222-2222-4222-8222-222222222222"


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


class _AcceptanceEvaluator:
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
    evaluator = _AcceptanceEvaluator(hass, store)
    hass.data[DOMAIN] = {
        "entry": {"store": store, "evaluator": evaluator},
        "store": store,
        "evaluator": evaluator,
        "dashboard_view_entities": {},
    }
    return hass


# --------------------------------------------------------------------------
# Test A: Hallway Roller Shade (cover.zm108m)
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_acceptance_test_a_hallway_roller_shade(mock_hass):
    """Test A: Hallway Roller Shade granting CONTROL allows all user-facing cover actions."""
    store = mock_hass.data[DOMAIN]["store"]
    cover_entity = "cover.zm108m"
    unrelated_cover = "cover.unrelated_blind"

    # Father grants CONTROL to Hallway Roller Shade (cover.zm108m)
    perm_set = store.get_user_permissions(CHILD_ID)
    perm_set.entity_rules["rule_shade"] = EntityPermissionRule(
        rule_id="rule_shade",
        target_type=TARGET_ENTITY,
        target_id=cover_entity,
        access_level=ACCESS_LEVEL_CONTROL,
    )
    store.set_user_permissions(perm_set)

    # 1. Verify Domolux card dependency discovery extracts cover.zm108m from custom card variables
    domolux_roller_card = {
        "type": "custom:domolux-roller-shade-card",
        "variables": {
            "devices": [
                {"name": "Hallway Roller Shade", "entity": cover_entity}
            ]
        },
    }
    extracted = extract_entities_from_card(domolux_roller_card)
    assert cover_entity in extracted

    # 2. Verify all user-facing cover operations are authorized for Child
    operations = [
        ("cover", "open_cover"),
        ("cover", "close_cover"),
        ("cover", "stop_cover"),
        ("cover", "set_cover_position"),
        ("cover", "open_cover_tilt"),
        ("cover", "close_cover_tilt"),
        ("cover", "stop_cover_tilt"),
        ("cover", "set_cover_tilt_position"),
    ]
    for domain, service in operations:
        decision = await async_authorize_service_call(
            mock_hass,
            CHILD_ID,
            domain,
            service,
            {"entity_id": [cover_entity]},
        )
        assert decision.allowed, f"Operation {domain}/{service} must be allowed, got: {decision.reason}"
        assert decision.reason == REASON_ALLOWED

    # 3. Verify unrelated cover remains denied
    decision_unrelated = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "cover",
        "open_cover",
        {"entity_id": [unrelated_cover]},
    )
    assert not decision_unrelated.allowed
    assert decision_unrelated.reason == REASON_ENTITY_NOT_GRANTED

    # 4. Verify Native HA Group policy resolves cover.zm108m to {"read": True, "control": True}
    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})
    assert cover_entity in ent_policy
    assert ent_policy[cover_entity] == {"read": True, "control": True}
    assert unrelated_cover not in ent_policy


# --------------------------------------------------------------------------
# Test B: SONOFF PN16 Selective Channel Access
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_acceptance_test_b_pn16_selective_channel_access(mock_hass):
    """Test B: Granting CONTROL only to switch.pn16_l3 keeps all other 15 channels denied."""
    store = mock_hass.data[DOMAIN]["store"]
    permitted_channel = "switch.pn16_l3"
    denied_channels = [f"switch.pn16_l{i}" for i in range(1, 17) if i != 3]

    # Father grants CONTROL ONLY to switch.pn16_l3
    perm_set = store.get_user_permissions(CHILD_ID)
    perm_set.entity_rules["rule_l3"] = EntityPermissionRule(
        rule_id="rule_l3",
        target_type=TARGET_ENTITY,
        target_id=permitted_channel,
        access_level=ACCESS_LEVEL_CONTROL,
    )
    store.set_user_permissions(perm_set)

    # 1. Permitted channel can be switched on and off
    for service in ("turn_on", "turn_off", "toggle"):
        decision = await async_authorize_service_call(
            mock_hass,
            CHILD_ID,
            "switch",
            service,
            {"entity_id": [permitted_channel]},
        )
        assert decision.allowed, f"{service} on {permitted_channel} must be allowed"

    # 2. All other PN16 channels remain denied
    for ch in denied_channels:
        decision = await async_authorize_service_call(
            mock_hass,
            CHILD_ID,
            "switch",
            "turn_on",
            {"entity_id": [ch]},
        )
        assert not decision.allowed, f"Channel {ch} must be denied"
        assert decision.reason == REASON_ENTITY_NOT_GRANTED

    # 3. Verify Native policy only exposes switch.pn16_l3
    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})
    assert permitted_channel in ent_policy
    for ch in denied_channels:
        assert ch not in ent_policy


# --------------------------------------------------------------------------
# Test C: Read-Only Device
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_acceptance_test_c_read_only_device(mock_hass):
    """Test C: READ device state is visible but all state-changing operations are rejected."""
    store = mock_hass.data[DOMAIN]["store"]
    ro_device = "light.living_room_lamp"

    perm_set = store.get_user_permissions(CHILD_ID)
    perm_set.entity_rules["rule_ro"] = EntityPermissionRule(
        rule_id="rule_ro",
        target_type=TARGET_ENTITY,
        target_id=ro_device,
        access_level=ACCESS_LEVEL_READ,
    )
    store.set_user_permissions(perm_set)

    # 1. Resolver verifies READ access is granted
    eval_read = resolve_entity_access(
        perm_set,
        {ro_device: (None, None)},
        CHILD_ID,
        ro_device,
        required_level=ACCESS_LEVEL_READ,
    )
    assert eval_read.granted is True
    assert eval_read.access_level == ACCESS_LEVEL_READ

    # 2. Resolver verifies CONTROL access is NOT granted
    eval_ctrl = resolve_entity_access(
        perm_set,
        {ro_device: (None, None)},
        CHILD_ID,
        ro_device,
        required_level=ACCESS_LEVEL_CONTROL,
    )
    assert eval_ctrl.granted is False

    # 3. Service calls are rejected
    for service in ("turn_on", "turn_off", "toggle"):
        decision = await async_authorize_service_call(
            mock_hass,
            CHILD_ID,
            "light",
            service,
            {"entity_id": [ro_device]},
        )
        assert not decision.allowed
        assert decision.reason in (REASON_ENTITY_NOT_GRANTED, REASON_SERVICE_NOT_ALLOWED)

    # 4. Native policy sets read: True, control: False
    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})
    assert ro_device in ent_policy
    assert ent_policy[ro_device].get("read") is True
    assert not ent_policy[ro_device].get("control", False)


# --------------------------------------------------------------------------
# Test D: Dashboard and View Permissions with Overrides & Custom Cards
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_acceptance_test_d_dashboard_view_permissions(mock_hass):
    """Test D: Assigned views grant inherited permissions, with explicit overrides taking precedence."""
    store = mock_hass.data[DOMAIN]["store"]
    view_read_path = "family-room"
    view_control_path = "working-space"
    view_denied_path = "master-bedroom"

    view_read_config = {
        "title": "Family Room",
        "path": view_read_path,
        "cards": [
            {"type": "entities", "entities": ["light.family_light", "sensor.room_temp"]}
        ],
    }

    view_control_config = {
        "title": "Working Space",
        "path": view_control_path,
        "cards": [
            {
                "type": "custom:domolux-light-card",
                "variables": {
                    "ents": [{"entity": "light.desk_light"}]
                },
            },
            {"type": "thermostat", "entity": "climate.ac_unit"},
            {"type": "button", "entity": "switch.restricted_tool"},
        ],
    }

    read_entities = extract_entities_from_view(view_read_config)
    control_entities = extract_entities_from_view(view_control_config)

    assert "light.family_light" in read_entities
    assert "light.desk_light" in control_entities
    assert "climate.ac_unit" in control_entities
    assert "switch.restricted_tool" in control_entities

    mock_hass.data[DOMAIN]["dashboard_view_entities"] = {
        view_read_path: read_entities,
        view_control_path: control_entities,
    }

    # Father assigns:
    # - view_read: READ
    # - view_control: CONTROL
    # - view_control exceptions:
    #     climate.ac_unit: READ
    #     switch.restricted_tool: DENY (none)
    perm_set = store.get_user_permissions(CHILD_ID)
    perm_set.view_rules[view_read_path] = ViewPermissionRule(
        view_path=view_read_path,
        effect=EFFECT_ALLOW,
        access_level=ACCESS_LEVEL_READ,
    )
    perm_set.view_rules[view_control_path] = ViewPermissionRule(
        view_path=view_control_path,
        effect=EFFECT_ALLOW,
        access_level=ACCESS_LEVEL_CONTROL,
    )
    # Explicit device/entity overrides
    perm_set.entity_rules["override_ac"] = EntityPermissionRule(
        rule_id="override_ac",
        target_type=TARGET_ENTITY,
        target_id="climate.ac_unit",
        access_level=ACCESS_LEVEL_READ,
    )
    perm_set.entity_rules["override_restricted"] = EntityPermissionRule(
        rule_id="override_restricted",
        target_type=TARGET_ENTITY,
        target_id="switch.restricted_tool",
        access_level=ACCESS_LEVEL_NONE,
    )
    store.set_user_permissions(perm_set)

    # 1. View access check
    assert resolve_view_access(perm_set, CHILD_ID, view_read_path).allowed is True
    assert resolve_view_access(perm_set, CHILD_ID, view_control_path).allowed is True
    assert resolve_view_access(perm_set, CHILD_ID, view_denied_path).allowed is False

    # 2. Inherited READ view devices cannot be controlled
    dec_family_light = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "light",
        "turn_on",
        {"entity_id": ["light.family_light"]},
    )
    assert not dec_family_light.allowed

    # 3. Inherited CONTROL view devices can be controlled
    dec_desk_light = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "light",
        "turn_on",
        {"entity_id": ["light.desk_light"]},
    )
    assert dec_desk_light.allowed is True

    # 4. Explicit READ override on climate.ac_unit blocks temperature change
    dec_ac = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "climate",
        "set_temperature",
        {"entity_id": ["climate.ac_unit"]},
    )
    assert not dec_ac.allowed

    # 5. Explicit DENY override on switch.restricted_tool completely blocks access
    dec_restricted = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "switch",
        "turn_on",
        {"entity_id": ["switch.restricted_tool"]},
    )
    assert not dec_restricted.allowed

    # 6. Check native policy consistency
    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})

    assert ent_policy["light.desk_light"] == {"read": True, "control": True}
    assert ent_policy["climate.ac_unit"].get("read") is True
    assert not ent_policy["climate.ac_unit"].get("control", False)
    assert ent_policy["light.family_light"].get("read") is True
    assert not ent_policy["light.family_light"].get("control", False)
    assert "switch.restricted_tool" not in ent_policy


# --------------------------------------------------------------------------
# Test E: Immediate Revocation
# --------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_acceptance_test_e_immediate_revocation(mock_hass):
    """Test E: Revocation takes effect immediately without requiring logout or page refresh."""
    store = mock_hass.data[DOMAIN]["store"]
    device_id = "switch.hallway_light"

    # 1. Grant CONTROL initially
    perm_set = store.get_user_permissions(CHILD_ID)
    perm_set.entity_rules["rule_initial"] = EntityPermissionRule(
        rule_id="rule_initial",
        target_type=TARGET_ENTITY,
        target_id=device_id,
        access_level=ACCESS_LEVEL_CONTROL,
    )
    store.set_user_permissions(perm_set)

    initial_check = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "switch",
        "turn_on",
        {"entity_id": [device_id]},
    )
    assert initial_check.allowed is True

    # 2. Father revokes permission
    del perm_set.entity_rules["rule_initial"]
    store.set_user_permissions(perm_set)

    # 3. Revoked device immediately rejected without session renewal
    revoked_check = await async_authorize_service_call(
        mock_hass,
        CHILD_ID,
        "switch",
        "turn_on",
        {"entity_id": [device_id]},
    )
    assert not revoked_check.allowed
    assert revoked_check.reason == REASON_ENTITY_NOT_GRANTED

    # 4. Native policy immediately drops entity
    adapter = DomoluxHAAuthAdapter(mock_hass)
    native_policy = adapter._build_effective_native_policy(perm_set.to_dict())
    ent_policy = native_policy.get("entities", {}).get("entity_ids", {})
    assert device_id not in ent_policy
