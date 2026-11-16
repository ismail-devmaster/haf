"""Unit and behavioural tests for Preview as Child feature."""

from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from homeassistant.components.websocket_api import ERR_UNAUTHORIZED, ERR_NOT_FOUND, ERR_INVALID_FORMAT
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_READ,
    ACCESS_LEVEL_NONE,
    DOMAIN,
    EFFECT_ALLOW,
    ROLE_FATHER,
    ROLE_USER,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    UserPermissionSet,
    ViewPermissionRule,
)
from custom_components.domolux_roles.preview_manager import (
    DomoluxPreviewManager,
    async_register_preview_commands,
    get_connection_preview,
    get_preview_manager,
    ws_preview_start,
    ws_preview_stop,
    ws_preview_status,
    ws_preview_evaluate,
)
from custom_components.domolux_roles.permission_api import ws_permission_my_views


CHILD_ID = "00000000000040008000000000000001"
FATHER_ID = "00000000000040008000000000000002"
GHOST_ID = "00000000000040008000000000000009"


@pytest.fixture
def mock_hass():
    hass = MagicMock()
    hass.data = {}
    return hass


@pytest.fixture
def mock_store():
    store = MagicMock()
    child_member = FamilyMemberRecord(
        user_id=CHILD_ID,
        username="child_user",
        display_name="Little Timmy",
        managed_group_id=f"domolux-family-{CHILD_ID}",
    )
    store.get_family_member.side_effect = lambda uid: child_member if uid == CHILD_ID else None

    child_perms = UserPermissionSet(
        user_id=CHILD_ID,
        default_access_level=ACCESS_LEVEL_NONE,
        entity_rules={
            "rule_1": EntityPermissionRule(
                rule_id="rule_1",
                target_type="entity",
                target_id="light.bedroom",
                access_level=ACCESS_LEVEL_READ,
            )
        },
        view_rules={
            "dashboard_kids": ViewPermissionRule(
                view_path="dashboard_kids",
                effect=EFFECT_ALLOW,
            )
        },
    )
    store.get_user_permissions.side_effect = lambda uid: child_perms if uid == CHILD_ID else UserPermissionSet(user_id=uid)
    return store


@pytest.fixture
def mock_role_manager():
    mgr = MagicMock()
    father_role = MagicMock()
    father_role.value = ROLE_FATHER
    child_role = MagicMock()
    child_role.value = ROLE_USER

    mgr.get_user_role.side_effect = lambda uid: father_role if uid == FATHER_ID else child_role
    return mgr


@pytest.fixture
def mock_father_conn():
    conn = MagicMock()
    conn.user = MagicMock()
    conn.user.id = FATHER_ID
    conn.user.is_admin = False
    conn.user.is_owner = False
    conn.user.is_disabled = False
    return conn


@pytest.fixture
def mock_child_conn():
    conn = MagicMock()
    conn.user = MagicMock()
    conn.user.id = CHILD_ID
    conn.user.is_admin = False
    conn.user.is_owner = False
    conn.user.is_disabled = False
    return conn


@pytest.mark.asyncio
async def test_preview_command_registration(mock_hass):
    """Verify all preview commands register properly."""
    with patch("custom_components.domolux_roles.preview_manager.websocket_api.async_register_command") as reg:
        async_register_preview_commands(mock_hass)
        registered_types = [call.args[1]._ws_schema["type"] for call in reg.call_args_list]
        assert "domolux/preview/start" in registered_types
        assert "domolux/preview/stop" in registered_types
        assert "domolux/preview/status" in registered_types
        assert "domolux/preview/evaluate" in registered_types


@pytest.mark.asyncio
async def test_father_preview_lifecycle(mock_hass, mock_store, mock_role_manager, mock_father_conn):
    """Test full preview lifecycle: start -> check status -> evaluate -> my_views -> stop."""
    mock_hass.data[DOMAIN] = {
        "entry_1": {
            "store": mock_store,
            "manager": mock_role_manager,
        }
    }

    # 1. Start preview as child
    msg = {"id": 1, "type": "domolux/preview/start", "child_user_id": CHILD_ID}
    await ws_preview_start(mock_hass, mock_father_conn, msg)

    assert mock_father_conn.send_result.called
    res = mock_father_conn.send_result.call_args[0][1]
    assert res["success"] is True
    assert res["preview"]["active"] is True
    assert res["preview"]["child_user_id"] == CHILD_ID
    assert res["child"]["name"] == "Little Timmy"

    # 2. Check preview status
    mock_father_conn.send_result.reset_mock()
    await ws_preview_status(mock_hass, mock_father_conn, {"id": 2, "type": "domolux/preview/status"})
    status_res = mock_father_conn.send_result.call_args[0][1]
    assert status_res["active"] is True
    assert status_res["child_user_id"] == CHILD_ID

    # 3. Call my_views while preview is active -> returns child's view rules
    evaluator = MagicMock()
    evaluator._is_father.return_value = True
    evaluator._is_admin_or_owner = AsyncMock(return_value=False)

    with patch("custom_components.domolux_roles.permission_api._get_evaluator", return_value=evaluator), \
         patch("custom_components.domolux_roles.permission_api._get_store", return_value=mock_store):
        mock_father_conn.send_result.reset_mock()
        await ws_permission_my_views(mock_hass, mock_father_conn, {"id": 3, "type": "domolux/permission/my_views"})
        my_views_res = mock_father_conn.send_result.call_args[0][1]
        assert my_views_res["preview_mode"] is True
        assert my_views_res["preview_child_id"] == CHILD_ID
        assert my_views_res["all_views_allowed"] is False
        assert my_views_res["view_rules"] == {"dashboard_kids": "allow"}

    # 4. Stop preview
    mock_father_conn.send_result.reset_mock()
    await ws_preview_stop(mock_hass, mock_father_conn, {"id": 4, "type": "domolux/preview/stop"})
    stop_res = mock_father_conn.send_result.call_args[0][1]
    assert stop_res["success"] is True
    assert stop_res["active"] is False

    # 5. After exit, my_views restores normal Father privileges
    with patch("custom_components.domolux_roles.permission_api._get_evaluator", return_value=evaluator), \
         patch("custom_components.domolux_roles.permission_api._get_store", return_value=mock_store):
        mock_father_conn.send_result.reset_mock()
        await ws_permission_my_views(mock_hass, mock_father_conn, {"id": 5, "type": "domolux/permission/my_views"})
        restored_res = mock_father_conn.send_result.call_args[0][1]
        assert restored_res["preview_mode"] is False
        assert restored_res["all_views_allowed"] is True


@pytest.mark.asyncio
async def test_child_cannot_start_preview(mock_hass, mock_store, mock_role_manager, mock_child_conn):
    """A managed child must be denied from initiating preview mode."""
    mock_hass.data[DOMAIN] = {
        "entry_1": {
            "store": mock_store,
            "manager": mock_role_manager,
        }
    }

    msg = {"id": 1, "type": "domolux/preview/start", "child_user_id": CHILD_ID}
    await ws_preview_start(mock_hass, mock_child_conn, msg)

    assert mock_child_conn.send_error.called
    err_code = mock_child_conn.send_error.call_args[0][1]
    assert err_code == ERR_UNAUTHORIZED


@pytest.mark.asyncio
async def test_preview_cannot_target_self_or_nonexistent(mock_hass, mock_store, mock_role_manager, mock_father_conn):
    """Preview cannot target the father account itself or nonexistent family members."""
    mock_hass.data[DOMAIN] = {
        "entry_1": {
            "store": mock_store,
            "manager": mock_role_manager,
        }
    }

    # Self-target
    await ws_preview_start(mock_hass, mock_father_conn, {"id": 1, "type": "domolux/preview/start", "child_user_id": FATHER_ID})
    assert mock_father_conn.send_error.called
    assert mock_father_conn.send_error.call_args[0][1] == ERR_INVALID_FORMAT

    # Unknown user
    mock_father_conn.send_error.reset_mock()
    await ws_preview_start(mock_hass, mock_father_conn, {"id": 2, "type": "domolux/preview/start", "child_user_id": GHOST_ID})
    assert mock_father_conn.send_error.called
    assert mock_father_conn.send_error.call_args[0][1] == ERR_NOT_FOUND


@pytest.mark.asyncio
async def test_preview_evaluate(mock_hass, mock_store, mock_role_manager, mock_father_conn):
    """Test preview evaluation endpoint for entities and views."""
    mock_hass.data[DOMAIN] = {
        "entry_1": {
            "store": mock_store,
            "manager": mock_role_manager,
        }
    }

    msg = {
        "id": 1,
        "type": "domolux/preview/evaluate",
        "child_user_id": CHILD_ID,
        "entity_id": "light.bedroom",
        "view_path": "dashboard_kids",
        "access_level": ACCESS_LEVEL_READ,
    }
    await ws_preview_evaluate(mock_hass, mock_father_conn, msg)

    assert mock_father_conn.send_result.called
    res = mock_father_conn.send_result.call_args[0][1]
    assert res["child_user_id"] == CHILD_ID
    assert res["entity_evaluation"]["granted"] is True
    assert res["entity_evaluation"]["access_level"] == ACCESS_LEVEL_READ
    assert res["view_evaluation"]["allowed"] is True
