"""Unit tests for Domolux View Manager service and Father authorization rules."""

from unittest.mock import MagicMock
import pytest

from custom_components.domolux_roles.models import DomoluxRole
from custom_components.domolux_roles.view_manager import (
    DomoluxFatherRequiredError,
    DomoluxViewManager,
    DomoluxViewNotFoundError,
)
from custom_components.domolux_roles.view_models import DomoluxCardType
from custom_components.domolux_roles.view_store import DomoluxViewStore

FATHER_USER_ID = "11111111111111111111111111111111"
REGULAR_USER_ID = "22222222222222222222222222222222"
ADMIN_USER_ID = "33333333333333333333333333333333"


@pytest.fixture
def mock_role_manager():
    manager = MagicMock()

    def get_role(user_id):
        if user_id == FATHER_USER_ID:
            return DomoluxRole.FATHER
        return DomoluxRole.USER

    manager.get_user_role = MagicMock(side_effect=get_role)
    return manager


@pytest.fixture
def view_manager(mock_role_manager):
    hass = MagicMock()
    view_store = DomoluxViewStore(hass)
    return DomoluxViewManager(hass, view_store, mock_role_manager)


@pytest.mark.asyncio
async def test_father_only_view_creation(view_manager):
    # Non-Father user denied
    with pytest.raises(DomoluxFatherRequiredError):
        await view_manager.async_create_view(
            caller_user_id=REGULAR_USER_ID,
            title="Unauthorized View",
            view_path="unauthorized-view",
        )

    # Father user allowed
    view = await view_manager.async_create_view(
        caller_user_id=FATHER_USER_ID,
        title="Father Dashboard",
        view_path="father-dashboard",
    )
    assert view.view_path == "father-dashboard"
    assert view.title == "Father Dashboard"
    assert view_manager.get_view(view.view_id) == view


@pytest.mark.asyncio
async def test_father_only_view_updates(view_manager):
    view = await view_manager.async_create_view(
        caller_user_id=FATHER_USER_ID,
        title="Main View",
        view_path="main-view",
    )

    # Non-Father user denied update
    with pytest.raises(DomoluxFatherRequiredError):
        await view_manager.async_update_view(
            caller_user_id=REGULAR_USER_ID,
            view_id=view.view_id,
            updates={"title": "Hacked Title"},
        )

    # Father user allowed update
    updated = await view_manager.async_update_view(
        caller_user_id=FATHER_USER_ID,
        view_id=view.view_id,
        updates={"title": "Updated Main View"},
    )
    assert updated.title == "Updated Main View"


@pytest.mark.asyncio
async def test_father_only_view_deletion(view_manager):
    view = await view_manager.async_create_view(
        caller_user_id=FATHER_USER_ID,
        title="Temp View",
        view_path="temp-view",
    )

    # Non-Father user denied deletion
    with pytest.raises(DomoluxFatherRequiredError):
        await view_manager.async_delete_view(
            caller_user_id=REGULAR_USER_ID,
            view_id=view.view_id,
        )

    # Father user allowed deletion
    deleted = await view_manager.async_delete_view(
        caller_user_id=FATHER_USER_ID,
        view_id=view.view_id,
    )
    assert deleted is True
    assert view_manager.get_view(view.view_id) is None


@pytest.mark.asyncio
async def test_card_operations(view_manager):
    view = await view_manager.async_create_view(
        caller_user_id=FATHER_USER_ID,
        title="Card Test View",
        view_path="card-test-view",
    )

    card_payload = {
        "card_type": DomoluxCardType.MARKDOWN.value,
        "title": "Welcome Card",
        "options": {"content": "Hello Domolux"},
    }

    # Add card non-father denied
    with pytest.raises(DomoluxFatherRequiredError):
        await view_manager.async_add_card_to_view(
            caller_user_id=REGULAR_USER_ID,
            view_id=view.view_id,
            card_data=card_payload,
        )

    # Add card father allowed
    card = await view_manager.async_add_card_to_view(
        caller_user_id=FATHER_USER_ID,
        view_id=view.view_id,
        card_data=card_payload,
    )
    assert card.title == "Welcome Card"
    assert len(view.cards) == 1

    # Remove card non-father denied
    with pytest.raises(DomoluxFatherRequiredError):
        await view_manager.async_remove_card_from_view(
            caller_user_id=REGULAR_USER_ID,
            view_id=view.view_id,
            card_id=card.card_id,
        )

    # Remove card father allowed
    removed = await view_manager.async_remove_card_from_view(
        caller_user_id=FATHER_USER_ID,
        view_id=view.view_id,
        card_id=card.card_id,
    )
    assert removed is True
    assert len(view.cards) == 0


def test_read_operations_unrestricted(view_manager):
    # Read operations (list, get) don't raise error
    assert view_manager.list_views() == []
    assert view_manager.get_view("non-existent") is None
    assert view_manager.get_view_by_path("non-existent") is None
