"""Unit tests for Domolux Roles Secure Father-Only Family API Broker."""

import asyncio
from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.const import DOMAIN, ROLE_FATHER, ROLE_USER
from custom_components.domolux_roles.family_api import (
    ERR_CANNOT_TARGET_ADMIN,
    ERR_CANNOT_TARGET_FATHER,
    ERR_CANNOT_TARGET_OWNER,
    ERR_DUPLICATE_USERNAME,
    ERR_FAMILY_USER_NOT_FOUND,
    ERR_FAMILY_USER_ORPHANED,
    ERR_FATHER_REQUIRED,
    ERR_INVALID_INPUT,
    ws_family_change_password,
    ws_family_create,
    ws_family_delete,
    ws_family_disable,
    ws_family_enable,
    ws_family_list,
)
from custom_components.domolux_roles.family_user_service import (
    DomoluxDuplicateUsernameError,
    DomoluxFamilyUserService,
    DomoluxInvalidInputError,
)
from custom_components.domolux_roles.ha_auth_adapter import get_managed_group_id
from custom_components.domolux_roles.models import (
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
)
from custom_components.domolux_roles.role_manager import DomoluxRoleManager
from custom_components.domolux_roles.store import DomoluxRoleStore

FATHER_USER_ID = "11111111-1111-4111-8111-111111111111"
CHILD_USER_ID = "22222222-2222-4222-8222-222222222222"
ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999"
OWNER_USER_ID = "88888888-8888-4888-8888-888888888888"
ARBITRARY_USER_ID = "33333333-3333-4333-8333-333333333333"


def _setup_api_environment():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    mock_store_helper.async_load = AsyncMock(return_value=None)
    mock_store_helper.async_save = AsyncMock(return_value=None)

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper

    manager = DomoluxRoleManager(hass, store)

    adapter = MagicMock()
    adapter.hass = hass
    adapter.async_create_managed_user = AsyncMock()
    adapter.async_delete_managed_user = AsyncMock(return_value=True)
    adapter.async_deactivate_managed_user = AsyncMock(return_value=True)
    adapter.async_activate_managed_user = AsyncMock(return_value=True)
    adapter.async_revoke_user_sessions = AsyncMock(return_value=1)
    adapter.async_change_managed_user_password = AsyncMock(return_value=True)

    family_service = DomoluxFamilyUserService(hass, adapter, store)

    hass.data = {
        DOMAIN: {
            "config_entry_1": {
                "store": store,
                "manager": manager,
                "adapter": adapter,
                "family_service": family_service,
            }
        }
    }

    # Setup Father user in store & mock HA Auth
    father_assign = FatherRoleAssignment(
        user_id=FATHER_USER_ID,
        assigned_at="2026-01-01T00:00:00Z",
        assigned_by="system",
        status=FatherRoleStatus.ACTIVE,
    )
    store.set_father(father_assign)

    father_ha_user = MagicMock(
        id=FATHER_USER_ID,
        is_admin=False,
        is_owner=False,
        is_disabled=False,
    )

    admin_ha_user = MagicMock(
        id=ADMIN_USER_ID,
        is_admin=True,
        is_owner=False,
        is_disabled=False,
    )

    owner_ha_user = MagicMock(
        id=OWNER_USER_ID,
        is_admin=False,
        is_owner=True,
        is_disabled=False,
    )

    child_ha_user = MagicMock(
        id=CHILD_USER_ID,
        is_admin=False,
        is_owner=False,
        is_disabled=False,
    )

    users_map = {
        FATHER_USER_ID: father_ha_user,
        ADMIN_USER_ID: admin_ha_user,
        OWNER_USER_ID: owner_ha_user,
        CHILD_USER_ID: child_ha_user,
    }

    async def _async_get_user(u_id):
        return users_map.get(u_id)

    async def _async_get_users():
        return list(users_map.values())

    hass.auth.async_get_user = AsyncMock(side_effect=_async_get_user)
    hass.auth.async_get_users = AsyncMock(side_effect=_async_get_users)

    return hass, manager, store, family_service, adapter, father_ha_user, admin_ha_user, owner_ha_user


def _make_connection(ha_user):
    conn = MagicMock()
    conn.user = ha_user
    return conn


# 1. Authorization Enforcement across All Commands
@pytest.mark.asyncio
async def test_authorization_non_father_rejected():
    hass, manager, store, service, adapter, father_user, admin_user, owner_user = _setup_api_environment()

    # Create a non-father regular user
    regular_user = MagicMock(id=ARBITRARY_USER_ID, is_admin=False, is_owner=False, is_disabled=False)

    for caller in [admin_user, owner_user, regular_user, None]:
        conn = _make_connection(caller)
        if caller is None:
            conn.user = None

        # 1. List
        msg = {"id": 1, "type": "domolux/family/list"}
        await ws_family_list(hass, conn, msg)
        conn.send_error.assert_called_with(1, ERR_FATHER_REQUIRED, "Privilege error: Father role required.")
        conn.reset_mock()

        # 2. Create
        msg = {"id": 2, "type": "domolux/family/create", "display_name": "Child", "username": "child", "password": "Password123!"}
        await ws_family_create(hass, conn, msg)
        conn.send_error.assert_called_with(2, ERR_FATHER_REQUIRED, "Privilege error: Father role required.")
        conn.reset_mock()

        # 3. Delete
        msg = {"id": 3, "type": "domolux/family/delete", "user_id": CHILD_USER_ID}
        await ws_family_delete(hass, conn, msg)
        conn.send_error.assert_called_with(3, ERR_FATHER_REQUIRED, "Privilege error: Father role required.")
        conn.reset_mock()

        # 4. Disable
        msg = {"id": 4, "type": "domolux/family/disable", "user_id": CHILD_USER_ID}
        await ws_family_disable(hass, conn, msg)
        conn.send_error.assert_called_with(4, ERR_FATHER_REQUIRED, "Privilege error: Father role required.")
        conn.reset_mock()

        # 5. Enable
        msg = {"id": 5, "type": "domolux/family/enable", "user_id": CHILD_USER_ID}
        await ws_family_enable(hass, conn, msg)
        conn.send_error.assert_called_with(5, ERR_FATHER_REQUIRED, "Privilege error: Father role required.")
        conn.reset_mock()

        # 6. Change Password
        msg = {"id": 6, "type": "domolux/family/change_password", "user_id": CHILD_USER_ID, "new_password": "Password123!"}
        await ws_family_change_password(hass, conn, msg)
        conn.send_error.assert_called_with(6, ERR_FATHER_REQUIRED, "Privilege error: Father role required.")
        conn.reset_mock()


# 2. Family List - Success (Father Only)
@pytest.mark.asyncio
async def test_family_list_success():
    hass, manager, store, service, adapter, father_user, _, _ = _setup_api_environment()
    conn = _make_connection(father_user)

    # Seed store with a family member
    member = FamilyMemberRecord(
        user_id=CHILD_USER_ID,
        display_name="Child One",
        username="child1",
        managed_group_id=get_managed_group_id(CHILD_USER_ID),
    )
    store.add_family_member(member)

    msg = {"id": 10, "type": "domolux/family/list"}
    await ws_family_list(hass, conn, msg)

    conn.send_result.assert_called_once()
    call_id, result = conn.send_result.call_args[0]
    assert call_id == 10
    assert len(result) == 1
    assert result[0]["user_id"] == CHILD_USER_ID
    assert result[0]["display_name"] == "Child One"
    assert result[0]["username"] == "child1"
    assert "password" not in result[0]
    assert "secret" not in result[0]


# 3. Family Create - Success & Validation
@pytest.mark.asyncio
async def test_family_create_success_and_validation():
    hass, manager, store, service, adapter, father_user, _, _ = _setup_api_environment()
    conn = _make_connection(father_user)

    mock_group = MagicMock(id=get_managed_group_id(CHILD_USER_ID))
    mock_created_user = MagicMock(
        id=CHILD_USER_ID,
        is_admin=False,
        is_owner=False,
        is_active=True,
        groups=[mock_group],
    )
    adapter.async_create_managed_user.return_value = mock_created_user

    # 1. Success Creation
    msg = {
        "id": 20,
        "type": "domolux/family/create",
        "display_name": "Child One",
        "username": "child1",
        "password": "Password123!",
        "metadata": {"room": "Bedroom 1"},
    }
    await ws_family_create(hass, conn, msg)

    conn.send_result.assert_called_once()
    call_id, result = conn.send_result.call_args[0]
    assert call_id == 20
    assert result["success"] is True
    assert result["family_member"]["user_id"] == CHILD_USER_ID
    assert result["family_member"]["username"] == "child1"
    assert "password" not in result["family_member"]
    conn.reset_mock()

    # 2. Invalid Input (Short Password)
    msg = {
        "id": 21,
        "type": "domolux/family/create",
        "display_name": "Child Two",
        "username": "child2",
        "password": "short",
    }
    await ws_family_create(hass, conn, msg)
    conn.send_error.assert_called_once_with(21, ERR_INVALID_INPUT, "Password must be at least 8 characters long.")
    conn.reset_mock()

    # 3. Duplicate Username
    existing_ha_user = MagicMock(username="child1")
    hass.auth.async_get_users = AsyncMock(return_value=[existing_ha_user])

    msg = {
        "id": 22,
        "type": "domolux/family/create",
        "display_name": "Child Duplicate",
        "username": "child1",
        "password": "Password123!",
    }
    await ws_family_create(hass, conn, msg)
    conn.send_error.assert_called_once_with(
        22,
        ERR_DUPLICATE_USERNAME,
        "Username 'child1' already exists in Home Assistant.",
    )


# 4. Target Isolation Security Tests (Delete, Disable, Enable, Change Password)
@pytest.mark.asyncio
async def test_target_isolation_rejections():
    hass, manager, store, service, adapter, father_user, admin_user, owner_user = _setup_api_environment()
    conn = _make_connection(father_user)

    # 1. Target Arbitrary Non-Family User ID -> Rejected (family_user_not_found)
    msg = {"id": 30, "type": "domolux/family/delete", "user_id": ARBITRARY_USER_ID}
    await ws_family_delete(hass, conn, msg)
    conn.send_error.assert_called_once_with(
        30,
        ERR_FAMILY_USER_NOT_FOUND,
        f"Target user '{ARBITRARY_USER_ID}' is not a Domolux managed family member.",
    )
    conn.reset_mock()

    # 2. Target Father Account -> Rejected (cannot_target_father)
    # Add Father to family storage (simulate injection attempt)
    store.add_family_member(
        FamilyMemberRecord(
            user_id=FATHER_USER_ID,
            display_name="Father Self",
            username="father",
            managed_group_id=get_managed_group_id(FATHER_USER_ID),
        )
    )

    msg = {"id": 31, "type": "domolux/family/delete", "user_id": FATHER_USER_ID}
    await ws_family_delete(hass, conn, msg)
    conn.send_error.assert_called_once_with(
        31,
        ERR_CANNOT_TARGET_FATHER,
        "Cannot target Father account.",
    )
    conn.reset_mock()

    # 3. Target Admin Account -> Rejected (cannot_target_admin)
    store.add_family_member(
        FamilyMemberRecord(
            user_id=ADMIN_USER_ID,
            display_name="Admin Injected",
            username="admin",
            managed_group_id=get_managed_group_id(ADMIN_USER_ID),
        )
    )

    msg = {"id": 32, "type": "domolux/family/delete", "user_id": ADMIN_USER_ID}
    await ws_family_delete(hass, conn, msg)
    conn.send_error.assert_called_once_with(
        32,
        ERR_CANNOT_TARGET_ADMIN,
        "Cannot target Administrator account.",
    )
    conn.reset_mock()

    # 4. Target Owner Account -> Rejected (cannot_target_owner)
    store.add_family_member(
        FamilyMemberRecord(
            user_id=OWNER_USER_ID,
            display_name="Owner Injected",
            username="owner",
            managed_group_id=get_managed_group_id(OWNER_USER_ID),
        )
    )

    msg = {"id": 33, "type": "domolux/family/delete", "user_id": OWNER_USER_ID}
    await ws_family_delete(hass, conn, msg)
    conn.send_error.assert_called_once_with(
        33,
        ERR_CANNOT_TARGET_OWNER,
        "Cannot target Owner account.",
    )
    conn.reset_mock()

    # 5. Target Orphaned Account -> Rejected (family_user_orphaned)
    ORPHAN_USER_ID = "44444444-4444-4444-8444-444444444444"
    store.add_family_member(
        FamilyMemberRecord(
            user_id=ORPHAN_USER_ID,
            display_name="Orphan",
            username="orphan",
            managed_group_id=get_managed_group_id(ORPHAN_USER_ID),
        )
    )
    # Ensure missing from HA auth
    hass.auth.async_get_user = AsyncMock(return_value=None)
    hass.auth.async_get_users = AsyncMock(return_value=[father_user, admin_user, owner_user])

    msg = {"id": 34, "type": "domolux/family/delete", "user_id": ORPHAN_USER_ID}
    await ws_family_delete(hass, conn, msg)
    conn.send_error.assert_called_once_with(
        34,
        ERR_FAMILY_USER_ORPHANED,
        f"Target family member '{ORPHAN_USER_ID}' is missing from Home Assistant Auth.",
    )


# 5. Family Delete - Success
@pytest.mark.asyncio
async def test_family_delete_success():
    hass, manager, store, service, adapter, father_user, _, _ = _setup_api_environment()
    conn = _make_connection(father_user)

    member = FamilyMemberRecord(
        user_id=CHILD_USER_ID,
        display_name="Child One",
        username="child1",
        managed_group_id=get_managed_group_id(CHILD_USER_ID),
    )
    store.add_family_member(member)

    msg = {"id": 40, "type": "domolux/family/delete", "user_id": CHILD_USER_ID}
    await ws_family_delete(hass, conn, msg)

    conn.send_result.assert_called_once_with(
        40,
        {
            "success": True,
            "user_id": CHILD_USER_ID,
        },
    )

    adapter.async_delete_managed_user.assert_called_once_with(CHILD_USER_ID)
    assert store.get_family_member(CHILD_USER_ID) is None


# 6. Family Enable / Disable - Success
@pytest.mark.asyncio
async def test_family_enable_disable_success():
    hass, manager, store, service, adapter, father_user, _, _ = _setup_api_environment()
    conn = _make_connection(father_user)

    member = FamilyMemberRecord(
        user_id=CHILD_USER_ID,
        display_name="Child One",
        username="child1",
        managed_group_id=get_managed_group_id(CHILD_USER_ID),
    )
    store.add_family_member(member)

    # 1. Disable
    msg = {"id": 50, "type": "domolux/family/disable", "user_id": CHILD_USER_ID}
    await ws_family_disable(hass, conn, msg)

    conn.send_result.assert_called_once_with(
        50,
        {
            "success": True,
            "user_id": CHILD_USER_ID,
            "status": "SUSPENDED_DISABLED",
        },
    )
    adapter.async_deactivate_managed_user.assert_called_once_with(CHILD_USER_ID)
    adapter.async_revoke_user_sessions.assert_called_once_with(CHILD_USER_ID)
    assert store.get_family_member(CHILD_USER_ID).status == "SUSPENDED_DISABLED"
    conn.reset_mock()

    # 2. Enable
    msg = {"id": 51, "type": "domolux/family/enable", "user_id": CHILD_USER_ID}
    await ws_family_enable(hass, conn, msg)

    conn.send_result.assert_called_once_with(
        51,
        {
            "success": True,
            "user_id": CHILD_USER_ID,
            "status": "ACTIVE",
        },
    )
    adapter.async_activate_managed_user.assert_called_once_with(CHILD_USER_ID)
    assert store.get_family_member(CHILD_USER_ID).status == "ACTIVE"


# 7. Family Change Password - Success & Secrecy
@pytest.mark.asyncio
async def test_family_change_password_success():
    hass, manager, store, service, adapter, father_user, _, _ = _setup_api_environment()
    conn = _make_connection(father_user)

    member = FamilyMemberRecord(
        user_id=CHILD_USER_ID,
        display_name="Child One",
        username="child1",
        managed_group_id=get_managed_group_id(CHILD_USER_ID),
    )
    store.add_family_member(member)

    new_pass = "NewSecurePassword123!"
    msg = {
        "id": 60,
        "type": "domolux/family/change_password",
        "user_id": CHILD_USER_ID,
        "new_password": new_pass,
    }
    await ws_family_change_password(hass, conn, msg)

    conn.send_result.assert_called_once()
    call_id, result = conn.send_result.call_args[0]
    assert call_id == 60
    assert result["success"] is True
    assert result["user_id"] == CHILD_USER_ID
    assert "new_password" not in result
    assert "password" not in result

    adapter.async_change_managed_user_password.assert_called_once_with(CHILD_USER_ID, new_pass)
    adapter.async_revoke_user_sessions.assert_called_with(CHILD_USER_ID)
