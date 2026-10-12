"""Unit tests for Domolux View models, validation, and storage persistence."""

from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_READ
from custom_components.domolux_roles.view_models import (
    DomoluxCardConfig,
    DomoluxCardType,
    DomoluxEntityBinding,
    DomoluxLayoutType,
    DomoluxView,
    DomoluxViewValidationError,
    validate_entity_id,
    validate_view_path,
)
from custom_components.domolux_roles.view_store import (
    DuplicateViewPathError,
    DomoluxViewStore,
    ViewStorageCorruptionError,
)

VALID_UUID_1 = "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
VALID_UUID_2 = "98765432-10fe-abcd-ef01-234567890abc"
VALID_CARD_ID_1 = "11111111-2222-3333-4444-555555555555"


def test_view_path_validation():
    assert validate_view_path("living-room") == "living-room"
    assert validate_view_path("  Kitchen-View-1  ") == "kitchen-view-1"

    with pytest.raises(DomoluxViewValidationError):
        validate_view_path("living_room")  # underscores not allowed

    with pytest.raises(DomoluxViewValidationError):
        validate_view_path("living room!")  # spaces / special chars not allowed

    with pytest.raises(DomoluxViewValidationError):
        validate_view_path("<script>alert(1)</script>")


def test_entity_id_validation():
    assert validate_entity_id("light.living_room") == "light.living_room"
    assert validate_entity_id("SENSOR.TEMPERATURE_1") == "sensor.temperature_1"

    with pytest.raises(DomoluxViewValidationError):
        validate_entity_id("invalid_entity_id")

    with pytest.raises(DomoluxViewValidationError):
        validate_entity_id("domain.entity.extra")


def test_entity_binding_model():
    binding = DomoluxEntityBinding(
        entity_id="switch.patio_light",
        name_override="Patio Light",
        required_access=ACCESS_LEVEL_CONTROL,
    )
    assert binding.entity_id == "switch.patio_light"
    assert binding.required_access == ACCESS_LEVEL_CONTROL

    data = binding.to_dict()
    reconstituted = DomoluxEntityBinding.from_dict(data)
    assert reconstituted.entity_id == "switch.patio_light"
    assert reconstituted.name_override == "Patio Light"
    assert reconstituted.required_access == ACCESS_LEVEL_CONTROL


def test_card_config_validation():
    # Valid markdown card
    card_md = DomoluxCardConfig(
        card_id=VALID_CARD_ID_1,
        card_type=DomoluxCardType.MARKDOWN.value,
        title="Welcome",
        options={"content": "Hello World"},
    )
    assert card_md.card_type == "markdown"

    # Markdown card missing content
    with pytest.raises(DomoluxViewValidationError):
        DomoluxCardConfig(
            card_id=VALID_CARD_ID_1,
            card_type=DomoluxCardType.MARKDOWN.value,
            options={},
        )

    # Entity card missing entities
    with pytest.raises(DomoluxViewValidationError):
        DomoluxCardConfig(
            card_id=VALID_CARD_ID_1,
            card_type=DomoluxCardType.ENTITY.value,
            entities=[],
        )


def test_forbidden_credentials_rejection():
    # Forbidden field in options dictionary
    with pytest.raises(DomoluxViewValidationError):
        DomoluxCardConfig(
            card_id=VALID_CARD_ID_1,
            card_type=DomoluxCardType.MARKDOWN.value,
            options={"content": "test", "password": "secret_password"},
        )

    with pytest.raises(DomoluxViewValidationError):
        DomoluxCardConfig.from_dict(
            {
                "card_id": VALID_CARD_ID_1,
                "card_type": "markdown",
                "options": {"content": "ok", "token": "abc123token"},
            }
        )


def test_script_injection_rejection():
    with pytest.raises(DomoluxViewValidationError):
        DomoluxView(
            view_id=VALID_UUID_1,
            view_path="test-view",
            title="<script>alert('xss')</script>",
            created_by="system",
        )

    with pytest.raises(DomoluxViewValidationError):
        DomoluxEntityBinding(
            entity_id="light.living_room",
            name_override="javascript:alert(1)",
        )


def test_view_store_crud():
    store = DomoluxViewStore(MagicMock())

    view1 = DomoluxView(
        view_id=VALID_UUID_1,
        view_path="living-room",
        title="Living Room View",
        created_by="system",
    )
    store.add_view(view1)

    assert store.get_view(VALID_UUID_1) == view1
    assert store.get_view_by_path("living-room") == view1
    assert len(store.list_views()) == 1

    # Duplicate view_path rejection
    view2_dup_path = DomoluxView(
        view_id=VALID_UUID_2,
        view_path="living-room",
        title="Duplicate Path View",
        created_by="system",
    )
    with pytest.raises(DuplicateViewPathError):
        store.add_view(view2_dup_path)

    # Removal
    assert store.remove_view(VALID_UUID_1) is True
    assert store.get_view(VALID_UUID_1) is None
    assert store.remove_view("non-existent-id") is False


@pytest.mark.asyncio
async def test_view_store_persistence():
    saved_data = {}
    mock_store_helper = MagicMock()

    async def mock_save(data):
        nonlocal saved_data
        saved_data = data

    async def mock_load():
        return saved_data

    mock_store_helper.async_save = AsyncMock(side_effect=mock_save)
    mock_store_helper.async_load = AsyncMock(side_effect=mock_load)

    hass = MagicMock()

    # Pre-restart session
    store1 = DomoluxViewStore(hass)
    store1._store = mock_store_helper

    view1 = DomoluxView(
        view_id=VALID_UUID_1,
        view_path="kitchen",
        title="Kitchen View",
        created_by="system",
    )
    store1.add_view(view1)
    await store1.async_save()

    # Post-restart session
    store2 = DomoluxViewStore(hass)
    store2._store = mock_store_helper
    await store2.async_load()

    loaded_view = store2.get_view(VALID_UUID_1)
    assert loaded_view is not None
    assert loaded_view.view_path == "kitchen"
    assert loaded_view.title == "Kitchen View"


@pytest.mark.asyncio
async def test_view_store_migration_and_corruption_recovery():
    hass = MagicMock()
    mock_store_helper = MagicMock()

    # Legacy v0 structure
    legacy_payload = {
        "version": 0,
        "views": {
            VALID_UUID_1: {
                "view_id": VALID_UUID_1,
                "view_path": "bedroom",
                "title": "Master Bedroom",
                "created_by": "system",
            }
        },
    }
    mock_store_helper.async_load = AsyncMock(return_value=legacy_payload)

    store = DomoluxViewStore(hass)
    store._store = mock_store_helper

    await store.async_load()
    assert store.get_view(VALID_UUID_1) is not None
    assert store.get_view(VALID_UUID_1).view_path == "bedroom"

    # Corrupted payload (forbidden secret in view option)
    corrupted_payload = {
        "version": 1,
        "views": {
            VALID_UUID_1: {
                "view_id": VALID_UUID_1,
                "view_path": "bedroom",
                "title": "Master Bedroom",
                "created_by": "system",
                "cards": [
                    {
                        "card_id": VALID_CARD_ID_1,
                        "card_type": "markdown",
                        "options": {"content": "ok", "auth_token": "leak"},
                    }
                ],
            }
        },
    }
    mock_store_helper.async_load = AsyncMock(return_value=corrupted_payload)
    store_corrupt = DomoluxViewStore(hass)
    store_corrupt._store = mock_store_helper

    await store_corrupt.async_load()
    # Fails safely to empty views store
    assert len(store_corrupt.list_views()) == 0
