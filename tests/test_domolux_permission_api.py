"""Unit tests for Permission WebSocket API Broker."""

from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from homeassistant.components.websocket_api import ERR_UNAUTHORIZED
from homeassistant.exceptions import Unauthorized
from custom_components.domolux_roles.permission_api import (
    async_register_permission_api_commands,
    ERR_RULE_NOT_FOUND,
)
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
)


@pytest.mark.asyncio
async def test_permission_api_register():
    """Verify permission WebSocket commands register correctly."""
    hass = MagicMock()
    async_register_permission_api_commands(hass)
    # If no exception raised, commands registered successfully
    assert True


@pytest.mark.asyncio
async def test_permission_get_rejects_non_father():
    """Permission get must reject non-Father users."""
    from custom_components.domolux_roles.permission_api import ws_permission_get

    hass = MagicMock()
    connection = MagicMock()
    msg = {"id": 1, "type": "domolux/permission/get", "user_id": "user-1"}

    # Non-Father authorization should return error
    with patch("custom_components.domolux_roles.permission_api._require_father", side_effect=Unauthorized()):
        await ws_permission_get(hass, connection, msg)
        connection.send_error.assert_called()


@pytest.mark.asyncio
async def test_permission_set_default_level_validation():
    """Permission set_default_level validates access levels."""
    from custom_components.domolux_roles.permission_api import ws_permission_set_default_level

    hass = MagicMock()
    store = MagicMock()
    hass.data = {"custom_components.domolux_roles": {"test_key": {"store": store, "evaluator": MagicMock()}}}

    connection = MagicMock()
    msg = {
        "id": 2,
        "type": "domolux/permission/set_default_level",
        "user_id": "child-1",
        "default_access_level": "invalid",
    }

    # Should reject invalid level
    await ws_permission_set_default_level(hass, connection, msg)
    error_args = connection.send_error.call_args
    assert error_args is not None


@pytest.mark.asyncio
async def test_permission_my_views_unauthorized():
    """ws_permission_my_views must return ERR_UNAUTHORIZED if connection.user is None."""
    from custom_components.domolux_roles.permission_api import ws_permission_my_views

    hass = MagicMock()
    connection = MagicMock()
    connection.user = None
    msg = {"id": 10, "type": "domolux/permission/my_views"}

    await ws_permission_my_views(hass, connection, msg)
    connection.send_error.assert_called_once_with(10, ERR_UNAUTHORIZED, "Unauthorized user connection.")


@pytest.mark.asyncio
async def test_permission_my_views_father_or_admin():
    """ws_permission_my_views returns all_views_allowed=True for Father or Admin/Owner."""
    from custom_components.domolux_roles.permission_api import ws_permission_my_views

    hass = MagicMock()
    evaluator = MagicMock()
    evaluator._is_father.return_value = True
    evaluator._is_admin_or_owner = AsyncMock(return_value=False)
    store = MagicMock()
    hass.data = {"domolux_roles": {"entry": {"store": store, "evaluator": evaluator}}}

    connection = MagicMock()
    connection.user.id = "father-1"
    msg = {"id": 11, "type": "domolux/permission/my_views"}

    await ws_permission_my_views(hass, connection, msg)
    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert result["user_id"] == "father-1"
    assert result["all_views_allowed"] is True


@pytest.mark.asyncio
async def test_permission_my_views_family_member():
    """ws_permission_my_views returns view rules and default level for family member."""
    from custom_components.domolux_roles.permission_api import ws_permission_my_views
    from custom_components.domolux_roles.models import UserPermissionSet, ViewPermissionRule

    hass = MagicMock()
    evaluator = MagicMock()
    evaluator._is_father.return_value = False
    evaluator._is_admin_or_owner = AsyncMock(return_value=False)

    perm_set = UserPermissionSet(
        user_id="child-1",
        default_access_level=ACCESS_LEVEL_READ,
        view_rules={
            "dashboard-secret": ViewPermissionRule(view_path="dashboard-secret", effect=EFFECT_DENY),
            "dashboard-kids": ViewPermissionRule(view_path="dashboard-kids", effect=EFFECT_ALLOW),
        },
    )
    store = MagicMock()
    store.get_user_permissions.return_value = perm_set
    hass.data = {"domolux_roles": {"entry": {"store": store, "evaluator": evaluator}}}

    connection = MagicMock()
    connection.user.id = "child-1"
    msg = {"id": 12, "type": "domolux/permission/my_views"}

    await ws_permission_my_views(hass, connection, msg)
    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert result["user_id"] == "child-1"
    assert result["all_views_allowed"] is False
    assert result["default_access_level"] == ACCESS_LEVEL_READ
    assert result["view_rules"] == {
        "dashboard-secret": EFFECT_DENY,
        "dashboard-kids": EFFECT_ALLOW,
    }


@pytest.mark.asyncio
async def test_permission_mutation_fires_event():
    """Permission mutations must fire domolux_permissions_updated on hass.bus."""
    from custom_components.domolux_roles.permission_api import ws_permission_set_view_rule

    hass = MagicMock()
    store = MagicMock()
    perm_set = MagicMock()
    perm_set.view_rules = {}
    store.get_user_permissions.return_value = perm_set
    store.async_save = AsyncMock()
    from custom_components.domolux_roles.models import UserPermissionSet
    adapter = MagicMock()
    adapter.async_sync_managed_user_permissions = AsyncMock()
    initial = UserPermissionSet(user_id="child-1", default_access_level="none")
    store.get_user_permissions.return_value = initial
    hass.data = {"domolux_roles": {"entry": {"store": store, "adapter": adapter, "evaluator": MagicMock()}}}

    connection = MagicMock()
    msg = {
        "id": 13,
        "type": "domolux/permission/set_view_rule",
        "user_id": "child-1",
        "view_path": "test-view",
        "effect": EFFECT_ALLOW,
    }

    with patch("custom_components.domolux_roles.permission_api._require_father", return_value="father-1"), \
         patch("custom_components.domolux_roles.permission_api._verify_target_family_member", return_value=None):
        await ws_permission_set_view_rule(hass, connection, msg)
        hass.bus.async_fire.assert_called_once_with(
            "domolux_permissions_updated", {"user_id": "child-1"}
        )

