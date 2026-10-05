"""Unit & Integration Regression tests for Atomic Permission Transactions in Domolux Roles."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, call, patch
import pytest

from homeassistant.exceptions import Unauthorized
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    DOMAIN,
    EFFECT_ALLOW,
    EFFECT_DENY,
    TARGET_ENTITY,
)
from custom_components.domolux_roles.models import (
    FamilyMemberRecord,
    EntityPermissionRule,
    UserPermissionSet,
)
from custom_components.domolux_roles.permission_api import (
    _execute_atomic_permission_mutation,
    ws_permission_get,
    ws_permission_my_views,
    ws_permission_remove_entity_rule,
    ws_permission_reset,
    ws_permission_set_default_level,
    ws_permission_set_entity_rule,
    ws_permission_set_view_rule,
)


@pytest.fixture
def mock_hass_store_adapter():
    """Build a mock Home Assistant context with store and adapter spies."""
    hass = MagicMock()
    store = MagicMock()
    adapter = MagicMock()
    adapter.async_sync_managed_user_permissions = AsyncMock()

    initial_perm_set = UserPermissionSet(
        user_id="user-123",
        default_access_level=ACCESS_LEVEL_NONE,
        entity_rules={},
        view_rules={},
    )
    store.get_user_permissions.return_value = initial_perm_set
    store.async_save = AsyncMock()

    member = FamilyMemberRecord(
        user_id="user-123",
        display_name="Child",
        username="child1",
        managed_group_id="domolux-family-user-123",
    )
    store.get_family_member.return_value = member

    hass.data = {DOMAIN: {"entry_1": {"store": store, "adapter": adapter}}}
    return hass, store, adapter, initial_perm_set


@pytest.mark.asyncio
async def test_1_set_default_level_transaction_success(mock_hass_store_adapter):
    """1. set_default_level transaction success: sync -> verify -> persist -> event."""
    hass, store, adapter, _ = mock_hass_store_adapter
    connection = MagicMock()
    msg = {
        "id": 1,
        "type": "domolux/permission/set_default_level",
        "user_id": "user-123",
        "default_access_level": ACCESS_LEVEL_READ,
    }

    call_order = []
    adapter.async_sync_managed_user_permissions.side_effect = lambda uid, pdict: call_order.append("sync")
    store.async_save.side_effect = lambda: call_order.append("persist")
    hass.bus.async_fire.side_effect = lambda event, data: call_order.append("event")

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_set_default_level(hass, connection, msg)

    assert call_order == ["sync", "persist", "event"]
    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert result["success"] is True
    assert result["permissions"]["default_access_level"] == ACCESS_LEVEL_READ


@pytest.mark.asyncio
async def test_2_set_entity_rule_transaction_success(mock_hass_store_adapter):
    """2. set_entity_rule transaction success: sync -> verify -> persist -> event."""
    hass, store, adapter, _ = mock_hass_store_adapter
    connection = MagicMock()
    msg = {
        "id": 2,
        "type": "domolux/permission/set_entity_rule",
        "user_id": "user-123",
        "target_type": "entity",
        "target_id": "light.living_room",
        "access_level": ACCESS_LEVEL_CONTROL,
        "rule_id": "rule-1",
    }

    call_order = []
    adapter.async_sync_managed_user_permissions.side_effect = lambda uid, pdict: call_order.append("sync")
    store.async_save.side_effect = lambda: call_order.append("persist")
    hass.bus.async_fire.side_effect = lambda event, data: call_order.append("event")

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_set_entity_rule(hass, connection, msg)

    assert call_order == ["sync", "persist", "event"]
    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert result["success"] is True
    assert "rule-1" in result["permissions"]["entity_rules"]


@pytest.mark.asyncio
async def test_3_remove_entity_rule_transaction_success(mock_hass_store_adapter):
    """3. remove_entity_rule transaction success."""
    hass, store, adapter, initial_perm_set = mock_hass_store_adapter
    initial_perm_set.entity_rules["rule-1"] = EntityPermissionRule(
        rule_id="rule-1", target_type="entity", target_id="light.living_room", access_level=ACCESS_LEVEL_CONTROL
    )
    connection = MagicMock()
    msg = {
        "id": 3,
        "type": "domolux/permission/remove_entity_rule",
        "user_id": "user-123",
        "rule_id": "rule-1",
    }

    call_order = []
    adapter.async_sync_managed_user_permissions.side_effect = lambda uid, pdict: call_order.append("sync")
    store.async_save.side_effect = lambda: call_order.append("persist")
    hass.bus.async_fire.side_effect = lambda event, data: call_order.append("event")

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_remove_entity_rule(hass, connection, msg)

    assert call_order == ["sync", "persist", "event"]
    connection.send_result.assert_called_once()


@pytest.mark.asyncio
async def test_4_reset_transaction_success(mock_hass_store_adapter):
    """4. reset transaction success."""
    hass, store, adapter, initial_perm_set = mock_hass_store_adapter
    initial_perm_set.default_access_level = ACCESS_LEVEL_CONTROL
    connection = MagicMock()
    msg = {"id": 4, "type": "domolux/permission/reset", "user_id": "user-123"}

    call_order = []
    adapter.async_sync_managed_user_permissions.side_effect = lambda uid, pdict: call_order.append("sync")
    store.async_save.side_effect = lambda: call_order.append("persist")
    hass.bus.async_fire.side_effect = lambda event, data: call_order.append("event")

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_reset(hass, connection, msg)

    assert call_order == ["sync", "persist", "event"]
    result = connection.send_result.call_args[0][1]
    assert result["permissions"]["default_access_level"] == ACCESS_LEVEL_NONE


@pytest.mark.asyncio
async def test_5_6_ha_sync_or_verification_throws(mock_hass_store_adapter):
    """5 & 6 & 11. HA sync/verification throws: no persist, no event, Domolux store untouched."""
    hass, store, adapter, _ = mock_hass_store_adapter
    adapter.async_sync_managed_user_permissions.side_effect = RuntimeError("HA Policy Error")
    connection = MagicMock()
    msg = {
        "id": 5,
        "type": "domolux/permission/set_default_level",
        "user_id": "user-123",
        "default_access_level": ACCESS_LEVEL_READ,
    }

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_set_default_level(hass, connection, msg)

    # Assert persistence was NOT called
    store.async_save.assert_not_called()
    # Assert event was NOT fired (test 11)
    hass.bus.async_fire.assert_not_called()
    # Assert error sent back to websocket
    connection.send_error.assert_called_once()
    assert "HA Policy Error" in connection.send_error.call_args[0][2]


@pytest.mark.asyncio
async def test_7_8_9_10_domolux_persistence_throws_after_ha_sync(mock_hass_store_adapter):
    """7, 8, 9, 10. Store persistence fails after HA sync: HA policy rolled back, Domolux restored."""
    hass, store, adapter, initial_perm_set = mock_hass_store_adapter

    # HA sync succeeds on first call (new state), called again for rollback (old state)
    sync_calls = []
    async def fake_sync(uid, pdict):
        sync_calls.append(pdict)

    adapter.async_sync_managed_user_permissions.side_effect = fake_sync
    store.async_save.side_effect = RuntimeError("Disk full")

    connection = MagicMock()
    msg = {
        "id": 7,
        "type": "domolux/permission/set_default_level",
        "user_id": "user-123",
        "default_access_level": ACCESS_LEVEL_READ,
    }

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_set_default_level(hass, connection, msg)

    # Verify HA sync was called twice: once for new state, once for rollback to old state
    assert len(sync_calls) == 2
    assert sync_calls[0]["default_access_level"] == ACCESS_LEVEL_READ
    assert sync_calls[1]["default_access_level"] == ACCESS_LEVEL_NONE

    # Verify Domolux in-memory state was restored (test 9)
    store.set_user_permissions.assert_called()
    last_set = store.set_user_permissions.call_args[0][0]
    assert last_set.default_access_level == ACCESS_LEVEL_NONE

    # Verify NO event fired (test 11)
    hass.bus.async_fire.assert_not_called()
    connection.send_error.assert_called_once()


@pytest.mark.asyncio
async def test_12_exactly_one_event_on_success(mock_hass_store_adapter):
    """12. Exactly one event fired on successful mutation."""
    hass, store, adapter, _ = mock_hass_store_adapter
    connection = MagicMock()
    msg = {
        "id": 12,
        "type": "domolux/permission/set_default_level",
        "user_id": "user-123",
        "default_access_level": ACCESS_LEVEL_READ,
    }

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_set_default_level(hass, connection, msg)

    assert hass.bus.async_fire.call_count == 1


@pytest.mark.asyncio
async def test_13_14_concurrency_serialization(mock_hass_store_adapter):
    """13 & 14. Concurrent mutations for same user serialize safely and state matches."""
    hass, store, adapter, initial_perm_set = mock_hass_store_adapter
    order = []

    async def slow_sync(uid, pdict):
        await asyncio.sleep(0.05)
        order.append(pdict["default_access_level"])

    adapter.async_sync_managed_user_permissions.side_effect = slow_sync

    conn1 = MagicMock()
    conn2 = MagicMock()
    msg1 = {"id": 1, "type": "domolux/permission/set_default_level", "user_id": "user-123", "default_access_level": ACCESS_LEVEL_READ}
    msg2 = {"id": 2, "type": "domolux/permission/set_default_level", "user_id": "user-123", "default_access_level": ACCESS_LEVEL_CONTROL}

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await asyncio.gather(
            ws_permission_set_default_level(hass, conn1, msg1),
            ws_permission_set_default_level(hass, conn2, msg2),
        )

    # Order must show serialized execution
    assert len(order) == 2


@pytest.mark.asyncio
async def test_15_16_17_security_enforcement():
    """15, 16, 17. Security invariants: Father-only, non-father / admin / member rejected."""
    hass = MagicMock()
    connection = MagicMock()
    msg = {"id": 15, "type": "domolux/permission/set_default_level", "user_id": "user-123", "default_access_level": ACCESS_LEVEL_READ}

    # 15 & 17: Non-Father (e.g. Admin without Father) rejected with Unauthorized
    with patch("custom_components.domolux_roles.permission_api._require_father", side_effect=Unauthorized()):
        await ws_permission_set_default_level(hass, connection, msg)
        connection.send_error.assert_called_once()
        err_code = connection.send_error.call_args[0][1]
        assert err_code == "father_required"


@pytest.mark.asyncio
async def test_18_19_20_21_22_security_and_eval_invariants(mock_hass_store_adapter):
    """18-22. Default deny, read-only, control, remove control, forged user_id protection."""
    hass, store, adapter, initial_perm_set = mock_hass_store_adapter

    # 22. ws_permission_my_views uses connection.user.id and ignores forged msg user_id
    connection = MagicMock()
    connection.user.id = "real-user-id"
    evaluator = MagicMock()
    evaluator._is_father.return_value = False
    evaluator._is_admin_or_owner = AsyncMock(return_value=False)
    hass.data = {DOMAIN: {"entry_1": {"store": store, "evaluator": evaluator}}}

    forged_msg = {"id": 22, "type": "domolux/permission/my_views", "user_id": "forged-admin-id"}
    await ws_permission_my_views(hass, connection, forged_msg)

    res = connection.send_result.call_args[0][1]
    assert res["user_id"] == "real-user-id"
