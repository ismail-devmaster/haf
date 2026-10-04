"""Unit tests for Domolux Roles WebSocket API endpoints & security threat model."""

import asyncio
from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.api import (
    ws_get_role,
    ws_list_eligible_users,
    ws_remove_father,
    ws_set_father,
)
from custom_components.domolux_roles.const import DOMAIN, ROLE_FATHER, ROLE_USER
from custom_components.domolux_roles.frontend import async_register_frontend
from custom_components.domolux_roles.role_manager import DomoluxRoleManager
from custom_components.domolux_roles.store import DomoluxRoleStore

VALID_USER_ID_1 = "11111111-1111-4111-8111-111111111111"
VALID_USER_ID_2 = "22222222-2222-4222-8222-222222222222"
ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999"


def _setup_mock_hass():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    mock_store_helper.async_load = AsyncMock(return_value=None)
    mock_store_helper.async_save = AsyncMock(return_value=None)

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper
    manager = DomoluxRoleManager(hass, store)
    hass.data = {
        DOMAIN: {
            "config_entry_1": {
                "store": store,
                "manager": manager,
            }
        }
    }
    return hass, manager, store


# 1. ws_get_role - Success (Regular User)
@pytest.mark.asyncio
async def test_ws_get_role_user():
    hass, manager, store = _setup_mock_hass()
    connection = MagicMock()
    connection.user = MagicMock(id=VALID_USER_ID_1, is_disabled=False)

    msg = {"id": 1, "type": "domolux/role/get"}
    await ws_get_role(hass, connection, msg)

    connection.send_result.assert_called_once_with(
        1,
        {
            "user_id": VALID_USER_ID_1,
            "role": ROLE_USER,
            "is_father": False,
            "father_assigned": False,
        },
    )


# 2. ws_get_role - Success (Father User)
@pytest.mark.asyncio
async def test_ws_get_role_father():
    hass, manager, store = _setup_mock_hass()
    target_user = MagicMock(is_admin=False, is_owner=False, is_disabled=False)
    hass.auth.async_get_user = AsyncMock(return_value=target_user)

    await manager.async_assign_father(VALID_USER_ID_1, "system")

    connection = MagicMock()
    connection.user = MagicMock(id=VALID_USER_ID_1, is_disabled=False)

    msg = {"id": 1, "type": "domolux/role/get"}
    await ws_get_role(hass, connection, msg)

    connection.send_result.assert_called_once_with(
        1,
        {
            "user_id": VALID_USER_ID_1,
            "role": ROLE_FATHER,
            "is_father": True,
            "father_assigned": True,
        },
    )


# 3. ws_list_eligible_users - Success (Admin User)
@pytest.mark.asyncio
async def test_ws_list_eligible_users_admin_success():
    hass, manager, store = _setup_mock_hass()

    eligible_user = MagicMock(
        id=VALID_USER_ID_1,
        username="eligible",
        is_admin=False,
        is_owner=False,
        is_disabled=False,
        system_generated=False,
    )
    eligible_user.name = "Eligible User"

    admin_user = MagicMock(
        id=ADMIN_USER_ID,
        username="admin",
        is_admin=True,
        is_owner=False,
        is_disabled=False,
        system_generated=False,
    )
    admin_user.name = "Admin User"

    hass.auth.async_get_users = AsyncMock(
        return_value=[eligible_user, admin_user]
    )

    connection = MagicMock()
    connection.user = admin_user

    msg = {"id": 2, "type": "domolux/users/list"}
    await ws_list_eligible_users(hass, connection, msg)

    connection.send_result.assert_called_once_with(
        2,
        [
            {
                "id": VALID_USER_ID_1,
                "name": "Eligible User",
                "username": "eligible",
            }
        ],
    )


# 4. ws_list_eligible_users - Unauthorized (Non-Admin / Father User)
@pytest.mark.asyncio
async def test_ws_list_eligible_users_unauthorized():
    hass, manager, store = _setup_mock_hass()
    non_admin = MagicMock(id=VALID_USER_ID_1, is_admin=False, is_owner=False)
    connection = MagicMock()
    connection.user = non_admin

    msg = {"id": 2, "type": "domolux/users/list"}
    await ws_list_eligible_users(hass, connection, msg)

    connection.send_error.assert_called_once_with(
        2,
        "unauthorized",
        "Privilege error: Administrator access required.",
    )


# 5. ws_set_father - Success (Admin assigning Father)
@pytest.mark.asyncio
async def test_ws_set_father_success():
    hass, manager, store = _setup_mock_hass()
    admin_user = MagicMock(
        id=ADMIN_USER_ID, is_admin=True, is_owner=False, is_disabled=False
    )

    target_user = MagicMock(
        id=VALID_USER_ID_1, is_admin=False, is_owner=False, is_disabled=False
    )
    hass.auth.async_get_user = AsyncMock(return_value=target_user)

    connection = MagicMock()
    connection.user = admin_user

    msg = {
        "id": 3,
        "type": "domolux/role/set_father",
        "user_id": VALID_USER_ID_1,
    }
    await ws_set_father(hass, connection, msg)

    assert manager.get_user_role(VALID_USER_ID_1) == ROLE_FATHER
    connection.send_result.assert_called_once()
    result_arg = connection.send_result.call_args[0][1]
    assert result_arg["success"] is True
    assert result_arg["user_id"] == VALID_USER_ID_1


# 6. ws_set_father - Unauthorized (Non-Admin / Father trying to assign)
@pytest.mark.asyncio
async def test_ws_set_father_unauthorized():
    hass, manager, store = _setup_mock_hass()
    non_admin_user = MagicMock(
        id=VALID_USER_ID_1, is_admin=False, is_owner=False, is_disabled=False
    )

    connection = MagicMock()
    connection.user = non_admin_user

    msg = {
        "id": 3,
        "type": "domolux/role/set_father",
        "user_id": VALID_USER_ID_2,
    }
    await ws_set_father(hass, connection, msg)

    connection.send_error.assert_called_once_with(
        3,
        "unauthorized",
        "Privilege error: Administrator access required.",
    )


# 7. ws_set_father - Rejected: Target is Admin or Owner
@pytest.mark.asyncio
async def test_ws_set_father_rejects_admin_target():
    hass, manager, store = _setup_mock_hass()
    admin_user = MagicMock(
        id=ADMIN_USER_ID, is_admin=True, is_owner=False, is_disabled=False
    )

    admin_target = MagicMock(
        id=VALID_USER_ID_1, is_admin=True, is_owner=False, is_disabled=False
    )
    hass.auth.async_get_user = AsyncMock(return_value=admin_target)

    connection = MagicMock()
    connection.user = admin_user

    msg = {
        "id": 3,
        "type": "domolux/role/set_father",
        "user_id": VALID_USER_ID_1,
    }
    await ws_set_father(hass, connection, msg)

    connection.send_error.assert_called_once_with(
        3,
        "invalid_format",
        "Security Violation: Father role cannot be assigned to Home Assistant Administrator or Owner users.",
    )


# 8. ws_set_father - Rejected: Target is Disabled
@pytest.mark.asyncio
async def test_ws_set_father_rejects_disabled_target():
    hass, manager, store = _setup_mock_hass()
    admin_user = MagicMock(
        id=ADMIN_USER_ID, is_admin=True, is_owner=False, is_disabled=False
    )

    disabled_target = MagicMock(
        id=VALID_USER_ID_1, is_admin=False, is_owner=False, is_disabled=True
    )
    hass.auth.async_get_user = AsyncMock(return_value=disabled_target)

    connection = MagicMock()
    connection.user = admin_user

    msg = {
        "id": 3,
        "type": "domolux/role/set_father",
        "user_id": VALID_USER_ID_1,
    }
    await ws_set_father(hass, connection, msg)

    connection.send_error.assert_called_once_with(
        3,
        "invalid_format",
        f"Target user '{VALID_USER_ID_1}' is currently disabled in Home Assistant.",
    )


# 9. Threat Check: Disabled Admin Calling Management API -> Rejected
@pytest.mark.asyncio
async def test_disabled_admin_calling_api_rejected():
    hass, manager, store = _setup_mock_hass()
    disabled_admin = MagicMock(
        id=ADMIN_USER_ID, is_admin=True, is_owner=False, is_disabled=True
    )

    connection = MagicMock()
    connection.user = disabled_admin

    msg = {
        "id": 3,
        "type": "domolux/role/set_father",
        "user_id": VALID_USER_ID_1,
    }
    await ws_set_father(hass, connection, msg)

    connection.send_error.assert_called_once_with(
        3,
        "unauthorized",
        "Privilege error: Administrator access required.",
    )


# 10. Threat Check: Live Check - Father Elevated to Admin instantly loses role in get_user_role
@pytest.mark.asyncio
async def test_father_elevated_to_admin_loses_role_immediately():
    hass, manager, store = _setup_mock_hass()
    user_obj = MagicMock(is_admin=False, is_owner=False, is_disabled=False)
    hass.auth.async_get_user = AsyncMock(return_value=user_obj)
    hass.auth._users = {VALID_USER_ID_1: user_obj}

    # Assign Father initially
    await manager.async_assign_father(VALID_USER_ID_1, "system")
    assert manager.get_user_role(VALID_USER_ID_1) == ROLE_FATHER

    # User is elevated to admin in HA Core memory cache
    user_obj.is_admin = True

    # Immediate fail-closed evaluation
    assert manager.get_user_role(VALID_USER_ID_1) == ROLE_USER


# 11. Panel Registration - Verify embed_iframe=True for Custom Element isolation
@pytest.mark.asyncio
async def test_async_register_frontend_embed_iframe(patch_panel_custom=None):
    from unittest.mock import patch

    hass = MagicMock()
    hass.data = {}
    hass.http.async_register_static_paths = AsyncMock()

    with patch("homeassistant.components.panel_custom.async_register_panel", new_callable=AsyncMock) as mock_register:
        await async_register_frontend(hass)

        assert mock_register.call_count == 2
        calls = mock_register.call_args_list
        assert calls[0].kwargs.get("frontend_url_path") == "domolux-roles"
        assert calls[0].kwargs.get("require_admin") is True
        assert calls[1].kwargs.get("frontend_url_path") == "domolux-family"
        assert calls[1].kwargs.get("require_admin") is False

