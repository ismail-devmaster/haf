"""Unit tests for Domolux Roles Permission Evaluator."""

from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
    ViewPermissionRule,
)
from custom_components.domolux_roles.permission_evaluator import (
    DomoluxPermissionEvaluator,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

FATHER_USER_ID = "11111111-1111-4111-8111-111111111111"
ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999"
CHILD_USER_ID = "22222222-2222-4222-8222-222222222222"


def _setup_evaluator_environment():
    hass = MagicMock()
    store = DomoluxRoleStore(hass)

    # Setup Father
    father_assign = FatherRoleAssignment(
        user_id=FATHER_USER_ID,
        assigned_at="2026-01-01T00:00:00Z",
        assigned_by="system",
        status=FatherRoleStatus.ACTIVE,
    )
    store.set_father(father_assign)

    father_ha_user = MagicMock(id=FATHER_USER_ID, is_admin=False, is_owner=False)
    admin_ha_user = MagicMock(id=ADMIN_USER_ID, is_admin=True, is_owner=False)
    child_ha_user = MagicMock(id=CHILD_USER_ID, is_admin=False, is_owner=False)

    users_map = {
        FATHER_USER_ID: father_ha_user,
        ADMIN_USER_ID: admin_ha_user,
        CHILD_USER_ID: child_ha_user,
    }

    async def _async_get_user(u_id):
        return users_map.get(u_id)

    hass.auth.async_get_user = AsyncMock(side_effect=_async_get_user)

    evaluator = DomoluxPermissionEvaluator(hass, store)
    return hass, store, evaluator


@pytest.mark.asyncio
async def test_father_override():
    _, _, evaluator = _setup_evaluator_environment()

    # Entity access
    res = await evaluator.evaluate_entity_access(FATHER_USER_ID, "light.living_room")
    assert res.granted is True
    assert res.access_level == ACCESS_LEVEL_CONTROL
    assert res.matching_rule_type == "father_override"

    # View access
    v_res = await evaluator.evaluate_view_access(FATHER_USER_ID, "/lovelace/dashboard")
    assert v_res.allowed is True
    assert v_res.effect == EFFECT_ALLOW
    assert v_res.matching_rule_type == "father_override"


@pytest.mark.asyncio
async def test_admin_override():
    _, _, evaluator = _setup_evaluator_environment()

    # Entity access
    res = await evaluator.evaluate_entity_access(ADMIN_USER_ID, "light.living_room")
    assert res.granted is True
    assert res.access_level == ACCESS_LEVEL_CONTROL
    assert res.matching_rule_type == "admin_override"

    # View access
    v_res = await evaluator.evaluate_view_access(ADMIN_USER_ID, "/lovelace/dashboard")
    assert v_res.allowed is True
    assert v_res.effect == EFFECT_ALLOW
    assert v_res.matching_rule_type == "admin_override"


@pytest.mark.asyncio
async def test_entity_rule_evaluation_hierarchy():
    hass, store, evaluator = _setup_evaluator_environment()

    # Create permission set with default=none, area=read, device=control, entity=none
    perm = UserPermissionSet(
        user_id=CHILD_USER_ID,
        default_access_level=ACCESS_LEVEL_NONE,
        entity_rules={
            "r_area": EntityPermissionRule(
                rule_id="r_area",
                target_type=TARGET_AREA,
                target_id="living_room",
                access_level=ACCESS_LEVEL_READ,
            ),
            "r_dev": EntityPermissionRule(
                rule_id="r_dev",
                target_type=TARGET_DEVICE,
                target_id="dev_light_1",
                access_level=ACCESS_LEVEL_CONTROL,
            ),
            "r_ent": EntityPermissionRule(
                rule_id="r_ent",
                target_type=TARGET_ENTITY,
                target_id="light.special_lamp",
                access_level=ACCESS_LEVEL_NONE,
            ),
        },
    )
    store.set_user_permissions(perm)

    # Mock HA registries
    mock_ent = MagicMock(device_id="dev_light_1", area_id="living_room")
    mock_ent_reg = MagicMock()
    mock_ent_reg.async_get.return_value = mock_ent

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("homeassistant.helpers.entity_registry.async_get", lambda h: mock_ent_reg)

        # 1. Target with entity rule -> Explicit Entity Rule wins (returns ACCESS_LEVEL_NONE)
        res_ent = await evaluator.evaluate_entity_access(
            CHILD_USER_ID, "light.special_lamp", required_level=ACCESS_LEVEL_READ
        )
        assert res_ent.matching_rule_type == TARGET_ENTITY
        assert res_ent.access_level == ACCESS_LEVEL_NONE
        assert res_ent.granted is False

        # 2. Target without entity rule, matching device -> Explicit Device Rule wins (returns ACCESS_LEVEL_CONTROL)
        res_dev = await evaluator.evaluate_entity_access(
            CHILD_USER_ID, "light.other_lamp", required_level=ACCESS_LEVEL_CONTROL
        )
        assert res_dev.matching_rule_type == TARGET_DEVICE
        assert res_dev.access_level == ACCESS_LEVEL_CONTROL
        assert res_dev.granted is True

        # 3. Target without device rule, matching area -> Area Rule wins
        mock_ent_no_dev = MagicMock(device_id=None, area_id="living_room")
        mock_ent_reg.async_get.return_value = mock_ent_no_dev

        res_area = await evaluator.evaluate_entity_access(
            CHILD_USER_ID, "light.area_lamp", required_level=ACCESS_LEVEL_READ
        )
        assert res_area.matching_rule_type == TARGET_AREA
        assert res_area.access_level == ACCESS_LEVEL_READ
        assert res_area.granted is True

        # 4. Target matching nothing -> Default Fallback (ACCESS_LEVEL_NONE)
        mock_ent_reg.async_get.return_value = None
        res_def = await evaluator.evaluate_entity_access(
            CHILD_USER_ID, "light.unknown_lamp", required_level=ACCESS_LEVEL_READ
        )
        assert res_def.matching_rule_type == "default"
        assert res_def.access_level == ACCESS_LEVEL_NONE
        assert res_def.granted is False


@pytest.mark.asyncio
async def test_view_rules_evaluation():
    _, store, evaluator = _setup_evaluator_environment()

    # User with view rules
    perm = UserPermissionSet(
        user_id=CHILD_USER_ID,
        default_access_level=ACCESS_LEVEL_READ,
        view_rules={
            "/lovelace/allowed": ViewPermissionRule(
                view_path="/lovelace/allowed", effect=EFFECT_ALLOW
            ),
            "/lovelace/denied": ViewPermissionRule(
                view_path="/lovelace/denied", effect=EFFECT_DENY
            ),
        },
    )
    store.set_user_permissions(perm)

    # Explicit allow
    res_allow = await evaluator.evaluate_view_access(CHILD_USER_ID, "/lovelace/allowed")
    assert res_allow.matching_rule_type == "view_rule"
    assert res_allow.allowed is True

    # Explicit deny
    res_deny = await evaluator.evaluate_view_access(CHILD_USER_ID, "/lovelace/denied")
    assert res_deny.matching_rule_type == "view_rule"
    assert res_deny.allowed is False

    # Default fallback when default_access_level != NONE -> ALLOW
    res_def_allow = await evaluator.evaluate_view_access(CHILD_USER_ID, "/lovelace/other")
    assert res_def_allow.matching_rule_type == "default"
    assert res_def_allow.allowed is True

    # Default fallback when default_access_level == NONE -> DENY
    perm.default_access_level = ACCESS_LEVEL_NONE
    store.set_user_permissions(perm)

    res_def_deny = await evaluator.evaluate_view_access(CHILD_USER_ID, "/lovelace/other")
    assert res_def_deny.matching_rule_type == "default"
    assert res_def_deny.allowed is False
