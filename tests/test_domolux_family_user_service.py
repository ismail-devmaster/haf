"""Unit tests for DomoluxFamilyUserService and safety invariants."""

from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.family_user_service import (
    DomoluxDuplicateUsernameError,
    DomoluxFamilyUserError,
    DomoluxFamilyUserService,
    DomoluxInvalidInputError,
    DomoluxSecurityInvariantError,
)
from custom_components.domolux_roles.ha_auth_adapter import (
    DomoluxHAAuthAdapter,
    get_managed_group_id,
)
from custom_components.domolux_roles.models import (
    DomoluxAuthState,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

VALID_USER_ID = "11111111-1111-4111-8111-111111111111"
ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999"


def _setup_service():
    hass = MagicMock()
    mock_store_helper = MagicMock()
    mock_store_helper.async_load = AsyncMock(return_value=None)
    mock_store_helper.async_save = AsyncMock(return_value=None)

    store = DomoluxRoleStore(hass)
    store._store = mock_store_helper

    adapter = MagicMock(spec=DomoluxHAAuthAdapter)
    adapter.hass = hass
    adapter.async_create_managed_user = AsyncMock()
    adapter.async_delete_managed_user = AsyncMock(return_value=True)

    service = DomoluxFamilyUserService(hass, adapter, store)
    return hass, adapter, store, service, mock_store_helper


# 1. Create Family User Success
@pytest.mark.asyncio
async def test_create_family_user_success():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    mock_group = MagicMock(id=get_managed_group_id(VALID_USER_ID))
    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.is_admin = False
    mock_user.is_owner = False
    mock_user.is_active = True
    mock_user.groups = [mock_group]
    mock_user.group_ids = [get_managed_group_id(VALID_USER_ID)]

    adapter.async_create_managed_user.return_value = mock_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    record = await service.async_create_family_user(
        display_name="Child One",
        username="child1",
        password="Password123!",
        metadata={"room": "Bedroom 1"},
    )

    assert isinstance(record, FamilyMemberRecord)
    assert record.user_id == VALID_USER_ID
    assert record.display_name == "Child One"
    assert record.username == "child1"
    assert record.managed_group_id == get_managed_group_id(VALID_USER_ID)
    assert record.permissions_metadata == {"room": "Bedroom 1"}

    # Assert stored in memory and persisted
    assert store.get_family_member(VALID_USER_ID) == record
    mock_store_helper.async_save.assert_called_once()


# 2. Security Invariants Verification
@pytest.mark.asyncio
async def test_security_invariants_hold():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    mock_group = MagicMock(id=get_managed_group_id(VALID_USER_ID))
    mock_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        is_active=True,
        groups=[mock_group],
        group_ids=[get_managed_group_id(VALID_USER_ID)],
    )

    adapter.async_create_managed_user.return_value = mock_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    record = await service.async_create_family_user("Alice", "alice", "Pass1234!")

    assert record.user_id == VALID_USER_ID
    assert record.managed_group_id == f"domolux-family-{VALID_USER_ID}"


# 3. Invalid Inputs Validation
@pytest.mark.asyncio
async def test_invalid_inputs_rejected():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    with pytest.raises(DomoluxInvalidInputError):
        await service.async_create_family_user("", "child1", "Pass1234!")

    with pytest.raises(DomoluxInvalidInputError):
        await service.async_create_family_user("Child One", "", "Pass1234!")

    with pytest.raises(DomoluxInvalidInputError):
        await service.async_create_family_user("Child One", "child 1", "Pass1234!")

    with pytest.raises(DomoluxInvalidInputError):
        await service.async_create_family_user("Child One", "child1", "short")


# 4. Duplicate Username Rejection
@pytest.mark.asyncio
async def test_duplicate_username_rejection():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    existing_user = MagicMock(username="child1")
    hass.auth.async_get_users = AsyncMock(return_value=[existing_user])

    with pytest.raises(DomoluxDuplicateUsernameError):
        await service.async_create_family_user("Child One", "child1", "Pass1234!")


# 5. Security Invariant Violation Rollback (Admin Granted)
@pytest.mark.asyncio
async def test_security_invariant_violation_rollback_admin():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    bad_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=True,  # VIOLATION
        is_owner=False,
        is_active=True,
        groups=[],
    )
    adapter.async_create_managed_user.return_value = bad_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    with pytest.raises(DomoluxSecurityInvariantError):
        await service.async_create_family_user("Bad Admin", "badadmin", "Pass1234!")

    # Verify atomic rollback
    adapter.async_delete_managed_user.assert_called_once_with(VALID_USER_ID)
    assert store.get_family_member(VALID_USER_ID) is None


# 6. Security Invariant Violation Rollback (Forbidden System Group)
@pytest.mark.asyncio
async def test_security_invariant_violation_rollback_system_group():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    sys_admin_group = MagicMock(id="system-admin")
    bad_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        is_active=True,
        groups=[sys_admin_group],  # VIOLATION
    )
    adapter.async_create_managed_user.return_value = bad_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    with pytest.raises(DomoluxSecurityInvariantError):
        await service.async_create_family_user("Bad Group", "badgroup", "Pass1234!")

    # Verify atomic rollback
    adapter.async_delete_managed_user.assert_called_once_with(VALID_USER_ID)
    assert store.get_family_member(VALID_USER_ID) is None


# 7. Store Save Failure Atomic Rollback
@pytest.mark.asyncio
async def test_store_persistence_failure_rollback():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    mock_group = MagicMock(id=get_managed_group_id(VALID_USER_ID))
    mock_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        is_active=True,
        groups=[mock_group],
    )
    adapter.async_create_managed_user.return_value = mock_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    # Simulate store save failure
    mock_store_helper.async_save = AsyncMock(side_effect=Exception("Disk full"))

    with pytest.raises(DomoluxFamilyUserError):
        await service.async_create_family_user("Child One", "child1", "Pass1234!")

    # Verify atomic rollback purges store and adapter
    assert store.get_family_member(VALID_USER_ID) is None
    adapter.async_delete_managed_user.assert_called_once_with(VALID_USER_ID)


# 8. No Secrets stored or exposed
@pytest.mark.asyncio
async def test_no_secrets_in_record_or_store():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    mock_group = MagicMock(id=get_managed_group_id(VALID_USER_ID))
    mock_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        is_active=True,
        groups=[mock_group],
    )
    adapter.async_create_managed_user.return_value = mock_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    password = "SuperSecretPassword123!"
    record = await service.async_create_family_user("Child One", "child1", password)

    record_dict = record.to_dict()
    assert "password" not in record_dict
    assert "secret" not in record_dict
    assert "token" not in record_dict

    store_data = store.data.to_dict()
    store.validate(store_data)  # Asserts no forbidden fields exist


# 9. Phase 1 Father Role Protection Unaffected
@pytest.mark.asyncio
async def test_father_role_protection_unaffected():
    hass, adapter, store, service, mock_store_helper = _setup_service()

    father_assign = FatherRoleAssignment(
        user_id=VALID_USER_ID,
        assigned_at="2026-01-01T00:00:00Z",
        assigned_by="system",
        status=FatherRoleStatus.ACTIVE,
    )
    store.set_father(father_assign)

    assert store.get_father() == father_assign

    # Create family user alongside Father
    mock_group = MagicMock(id=get_managed_group_id("22222222-2222-4222-8222-222222222222"))
    mock_user = MagicMock(
        id="22222222-2222-4222-8222-222222222222",
        is_admin=False,
        is_owner=False,
        is_active=True,
        groups=[mock_group],
    )
    adapter.async_create_managed_user.return_value = mock_user
    hass.auth.async_get_users = AsyncMock(return_value=[])

    record = await service.async_create_family_user("Child Two", "child2", "Pass1234!")

    # Father role remains completely intact
    assert store.get_father() == father_assign
    assert store.get_family_member("22222222-2222-4222-8222-222222222222") == record


# 10. Storage Schema Migration
@pytest.mark.asyncio
async def test_storage_schema_migration():
    hass = MagicMock()
    store = DomoluxRoleStore(hass)

    legacy_raw = {
        "version": 0,
        "father": {
            "user_id": VALID_USER_ID,
            "assigned_at": "2026-01-01T00:00:00Z",
            "assigned_by": "system",
            "status": "ACTIVE",
        },
    }

    migrated = store.migrate(legacy_raw)
    assert migrated["version"] == 1
    assert "family_members" in migrated
    assert migrated["family_members"] == {}

    state = DomoluxAuthState.from_dict(migrated)
    assert state.father is not None
    assert state.father.user_id == VALID_USER_ID
    assert state.family_members == {}
