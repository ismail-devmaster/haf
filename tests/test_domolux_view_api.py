"""Unit tests for Domolux View WebSocket API Broker."""

from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from homeassistant.exceptions import Unauthorized

from custom_components.domolux_roles.const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_READ, DOMAIN
from custom_components.domolux_roles.family_api import ERR_FATHER_REQUIRED, ERR_INVALID_INPUT
from custom_components.domolux_roles.permission_evaluator import EvaluationResult, ViewEvaluationResult
from custom_components.domolux_roles.view_api import (
    ERR_ACCESS_DENIED,
    ERR_DUPLICATE_VIEW_PATH,
    ERR_UNAUTHORIZED,
    ERR_VIEW_NOT_FOUND,
    async_register_view_api_commands,
    ws_view_create,
    ws_view_delete,
    ws_view_get,
    ws_view_list,
    ws_view_subscribe,
    ws_view_update,
)
from custom_components.domolux_roles.view_models import DomoluxCardConfig, DomoluxCardType, DomoluxEntityBinding, DomoluxView
from custom_components.domolux_roles.view_store import DuplicateViewPathError

FATHER_ID = "11111111-1111-4111-8111-111111111111"
ADMIN_ID = "22222222-2222-4222-8222-222222222222"
USER_ID = "33333333-3333-4333-8333-333333333333"
DISABLED_USER_ID = "44444444-4444-4444-8444-444444444444"

VIEW_1_ID = "11111111-1111-1111-1111-111111111111"
VIEW_2_ID = "22222222-2222-2222-2222-222222222222"


CARD_1_ID = "33333333-3333-3333-3333-333333333333"


def _create_mock_view_1() -> DomoluxView:
    return DomoluxView(
        view_id=VIEW_1_ID,
        view_path="living-room",
        title="Living Room Dashboard",
        created_by=FATHER_ID,
        cards=[
            DomoluxCardConfig(
                card_id=CARD_1_ID,
                card_type=DomoluxCardType.ENTITY.value,
                title="Living Lights",
                entities=[
                    DomoluxEntityBinding(entity_id="light.living_room_main", required_access=ACCESS_LEVEL_READ),
                    DomoluxEntityBinding(entity_id="switch.patio_heater", required_access=ACCESS_LEVEL_CONTROL),
                ],
            )
        ],
    )


def _create_mock_view_2() -> DomoluxView:
    return DomoluxView(
        view_id=VIEW_2_ID,
        view_path="bedroom",
        title="Master Bedroom",
        created_by=FATHER_ID,
    )


@pytest.fixture
def mock_hass():
    hass = MagicMock()
    view_manager = MagicMock()
    view_store = MagicMock()
    role_store = MagicMock()
    evaluator = MagicMock()

    view1 = _create_mock_view_1()
    view2 = _create_mock_view_2()

    view_manager.list_views.return_value = [view1, view2]
    view_manager.get_view.side_effect = lambda vid: view1 if vid == VIEW_1_ID else (view2 if vid == VIEW_2_ID else None)
    view_manager.get_view_by_path.side_effect = lambda vpath: view1 if vpath == "living-room" else (view2 if vpath == "bedroom" else None)

    role_store.get_family_member.side_effect = lambda uid: MagicMock(status="disabled") if uid == DISABLED_USER_ID else MagicMock(status="active")

    evaluator._is_father.side_effect = lambda uid: uid == FATHER_ID
    evaluator._is_admin_or_owner = AsyncMock(side_effect=lambda uid: uid == ADMIN_ID)

    async def mock_eval_view(uid, vpath):
        if uid == USER_ID and vpath == "living-room":
            return ViewEvaluationResult(user_id=uid, view_path=vpath, effect="allow", allowed=True, matching_rule_type="view_rule")
        return ViewEvaluationResult(user_id=uid, view_path=vpath, effect="deny", allowed=False, matching_rule_type="default")

    async def mock_eval_entity(uid, eid, required_level=ACCESS_LEVEL_READ):
        if eid == "light.living_room_main":
            return EvaluationResult(user_id=uid, target_id=eid, access_level=ACCESS_LEVEL_READ, granted=True, matching_rule_type="entity")
        return EvaluationResult(user_id=uid, target_id=eid, access_level="none", granted=False, matching_rule_type="default")

    evaluator.evaluate_view_access = AsyncMock(side_effect=mock_eval_view)
    evaluator.evaluate_entity_access = AsyncMock(side_effect=mock_eval_entity)

    hass.data = {
        DOMAIN: {
            "entry_id_1": {
                "view_manager": view_manager,
                "view_store": view_store,
                "store": role_store,
                "evaluator": evaluator,
            }
        }
    }
    return hass


@pytest.mark.asyncio
async def test_view_api_registration(mock_hass):
    """Verify WebSocket commands registration."""
    with patch("homeassistant.components.websocket_api.async_register_command") as mock_reg:
        await async_register_view_api_commands(mock_hass)
        assert mock_reg.call_count == 6


@pytest.mark.asyncio
async def test_ws_view_list_father(mock_hass):
    """Father user listing views receives all views without view access filtering."""
    connection = MagicMock()
    connection.user.id = FATHER_ID
    msg = {"id": 1, "type": "domolux/view/list"}

    await ws_view_list(mock_hass, connection, msg)

    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert len(result["views"]) == 2
    assert result["views"][0]["view_path"] == "living-room"
    assert result["views"][1]["view_path"] == "bedroom"


@pytest.mark.asyncio
async def test_ws_view_list_admin(mock_hass):
    """HA Admin user listing views receives all views."""
    connection = MagicMock()
    connection.user.id = ADMIN_ID
    msg = {"id": 2, "type": "domolux/view/list"}

    await ws_view_list(mock_hass, connection, msg)

    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert len(result["views"]) == 2


@pytest.mark.asyncio
async def test_ws_view_list_regular_user_filtered(mock_hass):
    """Regular user listing views receives only accessible views."""
    connection = MagicMock()
    connection.user.id = USER_ID
    msg = {"id": 3, "type": "domolux/view/list"}

    await ws_view_list(mock_hass, connection, msg)

    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    assert len(result["views"]) == 1
    assert result["views"][0]["view_path"] == "living-room"


@pytest.mark.asyncio
async def test_ws_view_list_disabled_user(mock_hass):
    """Disabled family member is denied view listing."""
    connection = MagicMock()
    connection.user.id = DISABLED_USER_ID
    msg = {"id": 4, "type": "domolux/view/list"}

    await ws_view_list(mock_hass, connection, msg)

    connection.send_error.assert_called_once_with(
        4, ERR_ACCESS_DENIED, "User account is disabled."
    )


@pytest.mark.asyncio
async def test_ws_view_list_unauthorized(mock_hass):
    """Connection without authenticated user returns ERR_UNAUTHORIZED."""
    connection = MagicMock()
    connection.user = None
    msg = {"id": 5, "type": "domolux/view/list"}

    await ws_view_list(mock_hass, connection, msg)

    connection.send_error.assert_called_once_with(
        5, ERR_UNAUTHORIZED, "Unauthorized user connection."
    )


@pytest.mark.asyncio
async def test_ws_view_get_father_full(mock_hass):
    """Father user fetching view receives unredacted view cards and entities."""
    connection = MagicMock()
    connection.user.id = FATHER_ID
    msg = {"id": 6, "type": "domolux/view/get", "view_id": VIEW_1_ID}

    await ws_view_get(mock_hass, connection, msg)

    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    cards = result["view"]["cards"]
    assert len(cards[0]["entities"]) == 2


@pytest.mark.asyncio
async def test_ws_view_get_regular_user_redacted(mock_hass):
    """Regular user fetching view receives view with redacted unauthorized entity bindings."""
    connection = MagicMock()
    connection.user.id = USER_ID
    msg = {"id": 7, "type": "domolux/view/get", "view_path": "living-room"}

    await ws_view_get(mock_hass, connection, msg)

    connection.send_result.assert_called_once()
    result = connection.send_result.call_args[0][1]
    cards = result["view"]["cards"]
    # switch.patio_heater should be redacted since entity access is granted only for light.living_room_main
    assert len(cards[0]["entities"]) == 1
    assert cards[0]["entities"][0]["entity_id"] == "light.living_room_main"


@pytest.mark.asyncio
async def test_ws_view_get_access_denied(mock_hass):
    """Regular user attempting to fetch unauthorized view gets ERR_ACCESS_DENIED."""
    connection = MagicMock()
    connection.user.id = USER_ID
    msg = {"id": 8, "type": "domolux/view/get", "view_path": "bedroom"}

    await ws_view_get(mock_hass, connection, msg)

    connection.send_error.assert_called_once_with(
        8, ERR_ACCESS_DENIED, "Access denied to requested View."
    )


@pytest.mark.asyncio
async def test_ws_view_get_not_found(mock_hass):
    """Requesting non-existent view returns ERR_VIEW_NOT_FOUND."""
    connection = MagicMock()
    connection.user.id = FATHER_ID
    msg = {"id": 9, "type": "domolux/view/get", "view_id": "non-existent"}

    await ws_view_get(mock_hass, connection, msg)

    connection.send_error.assert_called_once_with(
        9, ERR_VIEW_NOT_FOUND, "Requested View not found."
    )


@pytest.mark.asyncio
async def test_ws_view_get_invalid_input(mock_hass):
    """Specifying both or neither view_id/view_path returns ERR_INVALID_INPUT."""
    connection = MagicMock()
    connection.user.id = FATHER_ID
    msg_neither = {"id": 10, "type": "domolux/view/get"}
    msg_both = {"id": 11, "type": "domolux/view/get", "view_id": VIEW_1_ID, "view_path": "living-room"}

    await ws_view_get(mock_hass, connection, msg_neither)
    connection.send_error.assert_called_with(
        10, ERR_INVALID_INPUT, "Must specify exactly one of 'view_id' or 'view_path'."
    )

    connection.reset_mock()
    await ws_view_get(mock_hass, connection, msg_both)
    connection.send_error.assert_called_with(
        11, ERR_INVALID_INPUT, "Must specify exactly one of 'view_id' or 'view_path'."
    )


@pytest.mark.asyncio
async def test_ws_view_create_father_success(mock_hass):
    """Father user can create a view; fires domolux_view_updated event."""
    connection = MagicMock()
    msg = {
        "id": 12,
        "type": "domolux/view/create",
        "title": "New View",
        "view_path": "new-view",
    }

    NEW_VIEW_ID = "55555555-5555-4555-8555-555555555555"
    new_view = DomoluxView(view_id=NEW_VIEW_ID, view_path="new-view", title="New View", created_by=FATHER_ID)
    view_manager = mock_hass.data[DOMAIN]["entry_id_1"]["view_manager"]
    view_manager.async_create_view = AsyncMock(return_value=new_view)

    with patch("custom_components.domolux_roles.view_api._require_father", return_value=FATHER_ID):
        await ws_view_create(mock_hass, connection, msg)

        connection.send_result.assert_called_once()
        res = connection.send_result.call_args[0][1]
        assert res["success"] is True
        assert res["view"]["view_id"] == NEW_VIEW_ID

        mock_hass.bus.async_fire.assert_called_once_with(
            "domolux_view_updated",
            {"action": "created", "view_id": NEW_VIEW_ID, "view_path": "new-view"},
        )


@pytest.mark.asyncio
async def test_ws_view_create_non_father_denied(mock_hass):
    """Non-Father user creating a view receives ERR_FATHER_REQUIRED."""
    connection = MagicMock()
    msg = {"id": 13, "type": "domolux/view/create", "title": "Fail", "view_path": "fail"}

    with patch("custom_components.domolux_roles.view_api._require_father", side_effect=Unauthorized()):
        await ws_view_create(mock_hass, connection, msg)
        connection.send_error.assert_called_once_with(
            13, ERR_FATHER_REQUIRED, "Privilege error: Father role required."
        )


@pytest.mark.asyncio
async def test_ws_view_update_father_success(mock_hass):
    """Father user can update a view; fires domolux_view_updated event."""
    connection = MagicMock()
    msg = {
        "id": 14,
        "type": "domolux/view/update",
        "view_id": VIEW_1_ID,
        "updates": {"title": "Updated Title"},
    }

    updated_view = _create_mock_view_1()
    updated_view.title = "Updated Title"
    view_manager = mock_hass.data[DOMAIN]["entry_id_1"]["view_manager"]
    view_manager.async_update_view = AsyncMock(return_value=updated_view)

    with patch("custom_components.domolux_roles.view_api._require_father", return_value=FATHER_ID):
        await ws_view_update(mock_hass, connection, msg)

        connection.send_result.assert_called_once()
        mock_hass.bus.async_fire.assert_called_once_with(
            "domolux_view_updated",
            {"action": "updated", "view_id": VIEW_1_ID, "view_path": "living-room"},
        )


@pytest.mark.asyncio
async def test_ws_view_delete_father_success(mock_hass):
    """Father user can delete a view; fires domolux_view_updated event."""
    connection = MagicMock()
    msg = {"id": 15, "type": "domolux/view/delete", "view_id": VIEW_1_ID}

    view_manager = mock_hass.data[DOMAIN]["entry_id_1"]["view_manager"]
    view_manager.async_delete_view = AsyncMock(return_value=True)

    with patch("custom_components.domolux_roles.view_api._require_father", return_value=FATHER_ID):
        await ws_view_delete(mock_hass, connection, msg)

        connection.send_result.assert_called_once()
        mock_hass.bus.async_fire.assert_called_once_with(
            "domolux_view_updated",
            {"action": "deleted", "view_id": VIEW_1_ID, "view_path": "living-room"},
        )


@pytest.mark.asyncio
async def test_ws_view_subscribe_and_events(mock_hass):
    """WebSocket subscription registers listener and handles real-time update events."""
    view_store = mock_hass.data[DOMAIN]["entry_id_1"]["view_store"]
    view_store.add_view(_create_mock_view_1())

    connection = MagicMock()
    connection.user.id = USER_ID
    connection.subscriptions = {}
    msg = {"id": 16, "type": "domolux/view/subscribe", "view_id": VIEW_1_ID}

    bus_listener_cb = None

    def mock_listen(event_name, callback_fn):
        nonlocal bus_listener_cb
        bus_listener_cb = callback_fn
        return lambda: None

    mock_hass.bus.async_listen.side_effect = mock_listen

    await ws_view_subscribe(mock_hass, connection, msg)

    connection.send_result.assert_called_once_with(16)
    assert 16 in connection.subscriptions
    assert bus_listener_cb is not None

    # Simulate domolux_view_updated event
    event = MagicMock()
    event.data = {"action": "updated", "view_id": VIEW_1_ID, "view_path": "living-room"}

    bus_listener_cb(event)

    # Check that task was created for forwarding and await it
    mock_hass.async_create_task.assert_called_once()
    coro = mock_hass.async_create_task.call_args[0][0]
    await coro
    connection.send_event.assert_called_once_with(
        16, {"action": "updated", "view_id": VIEW_1_ID, "view_path": "living-room"}
    )
