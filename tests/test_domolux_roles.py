"""Unit tests for Domolux Roles persistent storage and role lifecycle."""

from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.const import (
    ROLE_FATHER,
    ROLE_USER,
    STATUS_ACTIVE,
    STATUS_SUSPENDED_ADMIN,
)
from custom_components.domolux_roles.models import (
    DomoluxAuthState,
    DomoluxRole,
    DomoluxRoleValidationError,
    FatherRoleAssignment,
    FatherRoleStatus,
    validate_non_admin_user,
    validate_user_id,
)
from custom_components.domolux_roles.role_manager import DomoluxRoleManager
from custom_components.domolux_roles.store import (
    DomoluxRoleStore,
    DuplicateFatherError,
    StorageCorruptionError,
)

VALID_UUID_1 = "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
VALID_UUID_2 = "98765432-10fe-abcd-ef01-234567890abc"


# 1. First Startup (No storage file present)
@pytest.mark.asyncio
async def test_first_startup_empty_store():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    mock_store_helper.async_load = AsyncMock(return_value=None)

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper

    await store.async_load()

    assert store.get_father() is None
    assert store.data.version == 1
    assert store.data.father is None


# 2. No Father State
def test_no_father_state():
    store = DomoluxRoleStore(MagicMock())
    assert store.get_father() is None
    manager = DomoluxRoleManager(MagicMock(), store)
    assert manager.get_user_role(VALID_UUID_1) == DomoluxRole.USER


# 3. Valid Father Assignment and Storage Validation
def test_valid_father_assignment():
    store = DomoluxRoleStore(MagicMock())
    assignment = FatherRoleAssignment(
        user_id=VALID_UUID_1,
        assigned_at="2026-09-27T12:00:00Z",
        assigned_by="system",
        status=FatherRoleStatus.ACTIVE,
    )

    store.set_father(assignment)

    father = store.get_father()
    assert father is not None
    assert father.user_id == VALID_UUID_1
    assert father.assigned_by == "system"
    assert father.status == FatherRoleStatus.ACTIVE

    # Validate output dict
    valid_dict = store.validate(store.data.to_dict())
    assert valid_dict["father"]["user_id"] == VALID_UUID_1


# 4. Replacing Father
@pytest.mark.asyncio
async def test_replacing_father():
    hass = MagicMock()
    user1 = MagicMock(is_admin=False, is_owner=False, is_disabled=False)
    user2 = MagicMock(is_admin=False, is_owner=False, is_disabled=False)
    hass.auth.async_get_user = AsyncMock(side_effect=[user1, user2])

    store = DomoluxRoleStore(hass)
    manager = DomoluxRoleManager(hass, store)

    # Assign Father 1
    await manager.async_assign_father(VALID_UUID_1, "system")
    assert manager.get_user_role(VALID_UUID_1) == DomoluxRole.FATHER

    # Revoke Father 1 before assigning Father 2
    await manager.async_revoke_father()
    assert manager.get_user_role(VALID_UUID_1) == DomoluxRole.USER

    # Assign Father 2
    await manager.async_assign_father(VALID_UUID_2, "system")
    assert manager.get_user_role(VALID_UUID_2) == DomoluxRole.FATHER
    assert manager.get_user_role(VALID_UUID_1) == DomoluxRole.USER


# 5. Removing Father
def test_remove_father():
    store = DomoluxRoleStore(MagicMock())
    assignment = FatherRoleAssignment(
        user_id=VALID_UUID_1,
        assigned_at="2026-09-27T12:00:00Z",
        assigned_by="system",
    )
    store.set_father(assignment)
    assert store.get_father() is not None

    removed = store.remove_father()
    assert removed is True
    assert store.get_father() is None


# 6. Restart Persistence Simulation
@pytest.mark.asyncio
async def test_restart_persistence():
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
    store1 = DomoluxRoleStore(hass)
    store1._store = mock_store_helper
    store1.set_father(
        FatherRoleAssignment(
            user_id=VALID_UUID_1,
            assigned_at="2026-09-27T12:00:00Z",
            assigned_by="system",
        )
    )
    await store1.async_save()

    # Post-restart session
    store2 = DomoluxRoleStore(hass)
    store2._store = mock_store_helper
    await store2.async_load()

    father = store2.get_father()
    assert father is not None
    assert father.user_id == VALID_UUID_1


# 7. Invalid User ID
def test_invalid_user_id_rejection():
    store = DomoluxRoleStore(MagicMock())
    with pytest.raises(DomoluxRoleValidationError):
        FatherRoleAssignment(
            user_id="not-a-valid-uuid",
            assigned_at="2026-09-27T12:00:00Z",
            assigned_by="system",
        )

    with pytest.raises(DomoluxRoleValidationError):
        store.set_father(
            FatherRoleAssignment(
                user_id="invalid-id",
                assigned_at="2026-09-27T12:00:00Z",
                assigned_by="system",
            )
        )


# 8. Deleted User Sync
@pytest.mark.asyncio
async def test_deleted_user_resets_role():
    hass = MagicMock()
    # User no longer exists in HA User Registry
    hass.auth.async_get_user = AsyncMock(return_value=None)

    store = DomoluxRoleStore(hass)
    store.set_father(
        FatherRoleAssignment(
            user_id=VALID_UUID_1,
            assigned_at="2026-09-27T12:00:00Z",
            assigned_by="system",
        )
    )

    manager = DomoluxRoleManager(hass, store)
    await manager.async_validate_and_sync()

    # Father user deleted from HA -> role reset to UNASSIGNED (None)
    assert store.get_father() is None
    assert manager.get_user_role(VALID_UUID_1) == DomoluxRole.USER


# 9. Corrupted Storage Recovery
@pytest.mark.asyncio
async def test_corrupted_storage_recovery():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    # Return malformed JSON structure with invalid user_id format
    mock_store_helper.async_load = AsyncMock(
        return_value={
            "version": 1,
            "father": {"user_id": "malformed_not_uuid"},
        }
    )

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper

    await store.async_load()

    # Fails safely to UNASSIGNED without granting privileges
    assert store.get_father() is None


# 10. Schema Migration (v0 -> v1)
@pytest.mark.asyncio
async def test_schema_migration_v0_to_v1():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    legacy_data = {
        "version": 0,
        "father": {
            "user_id": VALID_UUID_1,
            "assigned_at": "2026-09-27T12:00:00Z",
            "assigned_by": "system",
            "status": "ACTIVE",
        },
    }
    mock_store_helper.async_load = AsyncMock(return_value=legacy_data)

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper

    await store.async_load()

    # Migrated version to 1 and loaded valid father assignment
    assert store.data.version == 1
    assert store.get_father() is not None
    assert store.get_father().user_id == VALID_UUID_1


# 11. Duplicate Father Data Rejection
@pytest.mark.asyncio
async def test_duplicate_father_rejection():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    # Malicious/corrupt data containing list of multiple father entries
    duplicate_data = {
        "version": 1,
        "father": [
            {
                "user_id": VALID_UUID_1,
                "assigned_at": "2026-09-27T12:00:00Z",
                "assigned_by": "system",
                "status": "ACTIVE",
            },
            {
                "user_id": VALID_UUID_2,
                "assigned_at": "2026-09-27T12:00:00Z",
                "assigned_by": "system",
                "status": "ACTIVE",
            },
        ],
    }
    mock_store_helper.async_load = AsyncMock(return_value=duplicate_data)

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper

    await store.async_load()

    # Catches DuplicateFatherError and defaults safely to UNASSIGNED
    assert store.get_father() is None
