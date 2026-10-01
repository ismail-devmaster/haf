"""Unit tests for DomoluxHAAuthAdapter and safety invariants."""

from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.ha_auth_adapter import (
    DomoluxAuthAdapterError,
    DomoluxAuthSecurityError,
    DomoluxGroupError,
    DomoluxHAAuthAdapter,
    DomoluxUserNotFoundError,
    get_managed_group_id,
)

VALID_USER_ID = "11111111-1111-4111-8111-111111111111"
ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999"


def _setup_mock_hass():
    hass = MagicMock()

    # Mock AuthStore & _groups
    mock_store = MagicMock()
    mock_store._groups = {}
    mock_store._async_schedule_save = MagicMock()

    # Mock HassAuthProvider
    provider = MagicMock()
    provider.type = "homeassistant"
    provider.async_add_auth = AsyncMock()
    provider.async_remove_auth = AsyncMock()
    provider.async_get_or_create_credentials = AsyncMock(return_value=MagicMock())
    provider.async_link_user = AsyncMock()
    provider.async_change_password = AsyncMock()
    provider.async_change_username = AsyncMock()
    provider.data = None

    # Mock AuthManager
    auth = MagicMock()
    auth._store = mock_store
    auth.auth_providers = [provider]
    auth.async_get_users = AsyncMock(return_value=[])
    auth.async_get_user = AsyncMock(return_value=None)
    auth.async_create_user = AsyncMock()
    auth.async_link_user = AsyncMock()
    auth.async_remove_user = AsyncMock()
    auth.async_deactivate_user = AsyncMock()
    auth.async_remove_refresh_token = AsyncMock()

    hass.auth = auth
    return hass, mock_store, provider


# 1. Group Helper ID Check
def test_managed_group_id_helper():
    assert get_managed_group_id(VALID_USER_ID) == f"domolux-family-{VALID_USER_ID}"


# 2. Create Managed User Success
@pytest.mark.asyncio
async def test_create_managed_user_success():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.is_admin = False
    mock_user.is_owner = False
    mock_user.groups = []
    mock_user.invalidate_cache = MagicMock()

    hass.auth.async_create_user.return_value = mock_user
    hass.auth.async_get_user.return_value = mock_user

    created_user = await adapter.async_create_managed_user("child1", "Pass123!", "Child One")

    assert created_user == mock_user
    hass.auth.async_create_user.assert_called_once_with(
        name="Child One",
        group_ids=[],
    )
    provider.async_add_auth.assert_called_once_with("child1", "Pass123!")

    # Verify custom group created with domolux-family-<user_id>
    group_id = get_managed_group_id(VALID_USER_ID)
    assert group_id in mock_store._groups
    mock_user.invalidate_cache.assert_called_once()
    mock_store._async_schedule_save.assert_called()


# 3. Create Managed User Atomic Rollback on Credentials Error
@pytest.mark.asyncio
async def test_create_managed_user_atomic_rollback_on_auth_failure():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    hass.auth.async_create_user.return_value = mock_user

    provider.async_add_auth.side_effect = Exception("Credentials Database Error")

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("child1", "Pass123!", "Child One")

    assert "Failed to bind authentication credentials" in str(exc_info.value)
    # Rollback verification: since async_add_auth failed, provider.async_remove_auth is not called, user removed
    provider.async_remove_auth.assert_not_called()
    hass.auth.async_remove_user.assert_called_once_with(mock_user)


# 4. Security Invariant: Reject Operations targeting Admin User
@pytest.mark.asyncio
async def test_security_invariant_rejects_admin_user():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    admin_user = MagicMock(id=ADMIN_USER_ID, is_admin=True, is_owner=False)
    hass.auth.async_get_user.return_value = admin_user

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_deactivate_managed_user(ADMIN_USER_ID)

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_delete_managed_user(ADMIN_USER_ID)

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_change_managed_user_password(ADMIN_USER_ID, "newpass")

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_change_managed_user_username(ADMIN_USER_ID, "newuser")

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_create_or_update_managed_group(ADMIN_USER_ID, {})


# 5. Security Invariant: Reject Operations targeting Owner User
@pytest.mark.asyncio
async def test_security_invariant_rejects_owner_user():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    owner_user = MagicMock(id=ADMIN_USER_ID, is_admin=False, is_owner=True)
    hass.auth.async_get_user.return_value = owner_user

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_deactivate_managed_user(ADMIN_USER_ID)

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_change_managed_user_password(ADMIN_USER_ID, "newpass")

    with pytest.raises(DomoluxAuthSecurityError):
        await adapter.async_change_managed_user_username(ADMIN_USER_ID, "newuser")


# 6. Group CRUD Operations & Invalidation
@pytest.mark.asyncio
async def test_group_crud_operations():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    managed_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, groups=[])
    managed_user.invalidate_cache = MagicMock()
    hass.auth.async_get_user.return_value = managed_user

    test_policy = {"entities": {"light.living_room": {"read": True}}}
    group = await adapter.async_create_or_update_managed_group(VALID_USER_ID, test_policy)

    group_id = get_managed_group_id(VALID_USER_ID)
    assert group.id == group_id
    assert group.policy == test_policy
    assert mock_store._groups[group_id] == group
    managed_user.invalidate_cache.assert_called_once()

    # Read back
    retrieved_group = await adapter.async_get_managed_group(VALID_USER_ID)
    assert retrieved_group == group

    # Delete group
    deleted = await adapter.async_delete_managed_group(VALID_USER_ID)
    assert deleted is True
    assert group_id not in mock_store._groups


# 7. Password and Username Change (API Signatures Verification)
@pytest.mark.asyncio
async def test_password_and_username_change():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_cred = MagicMock()
    mock_cred.data = {"username": "olduser"}

    managed_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        credentials=[mock_cred],
    )
    hass.auth.async_get_user.return_value = managed_user

    # Password change passes string username "olduser"
    await adapter.async_change_managed_user_password(VALID_USER_ID, "NewPass123!")
    provider.async_change_password.assert_called_once_with("olduser", "NewPass123!")

    # Username change passes mock_cred object
    await adapter.async_change_managed_user_username(VALID_USER_ID, "newuser")
    provider.async_change_username.assert_called_once_with(mock_cred, "newuser")


# 8. Session Revocation & User Deactivation
@pytest.mark.asyncio
async def test_session_revocation():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    token1 = MagicMock()
    token2 = MagicMock()
    managed_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        refresh_tokens={"t1": token1, "t2": token2},
    )
    hass.auth.async_get_user.return_value = managed_user

    count = await adapter.async_revoke_user_sessions(VALID_USER_ID)
    assert count == 2
    assert hass.auth.async_remove_refresh_token.call_count == 2


# 9. Delete Managed User Lifecycle
@pytest.mark.asyncio
async def test_delete_managed_user_lifecycle():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    managed_user = MagicMock(
        id=VALID_USER_ID,
        is_admin=False,
        is_owner=False,
        groups=[],
        refresh_tokens={},
    )
    hass.auth.async_get_user.return_value = managed_user

    success = await adapter.async_delete_managed_user(VALID_USER_ID)
    assert success is True
    hass.auth.async_remove_user.assert_called_once_with(managed_user)


# 10. Create Managed User Post-Creation Invariant Failure Rollback
@pytest.mark.asyncio
async def test_create_managed_user_post_creation_invariant_failure():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    # Simulate created user returning is_admin=True unexpected invariant violation
    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.is_admin = True
    mock_user.is_owner = False
    mock_user.groups = []

    hass.auth.async_create_user.return_value = mock_user

    with pytest.raises(DomoluxAuthSecurityError) as exc_info:
        await adapter.async_create_managed_user("child1", "Pass123!", "Child One")

    assert "Post-creation security invariant verification failed" in str(exc_info.value)
    hass.auth.async_remove_user.assert_called_once_with(mock_user)


# 11. Regression Test: Created User ID Matches Linked Credential Target
@pytest.mark.asyncio
async def test_regression_created_user_id_matches_linked_credential_user_id():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock()
    mock_user.id = VALID_USER_ID
    mock_user.is_admin = False
    mock_user.is_owner = False
    mock_user.groups = []

    mock_cred = MagicMock()
    provider.async_get_or_create_credentials.return_value = mock_cred
    hass.auth.async_create_user.return_value = mock_user
    hass.auth.async_get_user.return_value = mock_user

    created_user = await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert created_user.id == VALID_USER_ID
    provider.async_get_or_create_credentials.assert_called_once_with({"username": "testchild"})
    hass.auth.async_link_user.assert_called_once_with(mock_user, mock_cred)


# 12. Regression Test: Duplicate Username Collision Fails Closed (No User Created)
@pytest.mark.asyncio
async def test_regression_duplicate_username_fails_closed_no_user_created():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    provider.data = MagicMock()
    provider.data.users = [{"username": "testchild"}]
    provider.data.normalize_username = lambda x: x.strip().lower()

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert "already exists in Home Assistant" in str(exc_info.value)
    hass.auth.async_create_user.assert_not_called()
    provider.async_add_auth.assert_not_called()


# 13. Regression Test: Missing async_get_or_create_credentials Triggers Full Rollback
@pytest.mark.asyncio
async def test_regression_missing_get_or_create_credentials_causes_rollback():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, groups=[])
    hass.auth.async_create_user.return_value = mock_user

    provider.async_get_or_create_credentials = None
    provider.async_link_user = AsyncMock()  # Even if present, MUST NOT be called

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert "Failed to bind authentication credentials" in str(exc_info.value)
    hass.auth.async_remove_user.assert_called_once_with(mock_user)
    provider.async_link_user.assert_not_called()


# 14. Regression Test: Missing hass.auth.async_link_user Triggers Full Rollback
@pytest.mark.asyncio
async def test_regression_missing_hass_auth_async_link_user_causes_rollback():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, groups=[])
    hass.auth.async_create_user.return_value = mock_user

    hass.auth.async_link_user = None
    provider.async_link_user = AsyncMock()  # Even if present, MUST NOT be called

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert "Failed to bind authentication credentials" in str(exc_info.value)
    hass.auth.async_remove_user.assert_called_once_with(mock_user)
    provider.async_link_user.assert_not_called()


# 15. Regression Test: Change Username Duplicate Fails Closed via User Credentials & Provider Data
@pytest.mark.asyncio
async def test_regression_change_username_duplicate_fails_closed():
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_cred = MagicMock()
    mock_cred.data = {"username": "olduser"}
    managed_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, credentials=[mock_cred])
    hass.auth.async_get_user.return_value = managed_user

    # Setup existing user with matching credential username
    other_cred = MagicMock()
    other_cred.data = {"username": "existinguser"}
    other_user = MagicMock(id="other-user-uuid", credentials=[other_cred])
    hass.auth.async_get_users.return_value = [other_user]

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_change_managed_user_username(VALID_USER_ID, "existinguser")

    assert "already taken by another user" in str(exc_info.value)
    provider.async_change_username.assert_not_called()


# ----------------------------------------------------------------------
# NEW SECURITY REQUIREMENT REGRESSION TESTS (REQUIREMENTS 1, 2, 3)
# ----------------------------------------------------------------------

# REQUIREMENT 1: True Rollback for Credential Creation

@pytest.mark.asyncio
async def test_regression_creation_rollback_removes_provider_auth_on_get_credentials_failure():
    """Prove that if provider.async_get_or_create_credentials fails after provider.async_add_auth succeeds,
    provider.async_remove_auth is explicitly called to clean up the orphan provider credential."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, groups=[])
    hass.auth.async_create_user.return_value = mock_user
    provider.async_get_or_create_credentials.side_effect = Exception("Get creds error")

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert "Failed to bind authentication credentials" in str(exc_info.value)
    provider.async_remove_auth.assert_called_once_with("testchild")
    hass.auth.async_remove_user.assert_called_once_with(mock_user)


@pytest.mark.asyncio
async def test_regression_creation_rollback_removes_provider_auth_on_async_link_user_failure():
    """Prove that if hass.auth.async_link_user fails after provider.async_add_auth succeeds,
    provider.async_remove_auth is explicitly called to clean up the orphan provider credential."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, groups=[])
    hass.auth.async_create_user.return_value = mock_user
    hass.auth.async_link_user.side_effect = Exception("Link error")

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert "Failed to bind authentication credentials" in str(exc_info.value)
    provider.async_remove_auth.assert_called_once_with("testchild")
    hass.auth.async_remove_user.assert_called_once_with(mock_user)


@pytest.mark.asyncio
async def test_regression_creation_rollback_removes_provider_auth_on_managed_group_creation_failure():
    """Prove that if custom group creation fails after provider.async_add_auth succeeds,
    provider.async_remove_auth is explicitly called to clean up the orphan provider credential."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, groups=[])
    hass.auth.async_create_user.return_value = mock_user
    adapter.async_create_or_update_managed_group = AsyncMock(side_effect=Exception("Group error"))

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_create_managed_user("testchild", "Pass123!", "Test Child")

    assert "Failed initializing managed group" in str(exc_info.value)
    provider.async_remove_auth.assert_called_once_with("testchild")
    hass.auth.async_remove_user.assert_called_once_with(mock_user)


# REQUIREMENT 2: Password Change API Fixes

@pytest.mark.asyncio
async def test_change_password_passes_username_string_to_provider():
    """Verify that async_change_managed_user_password extracts the username string from user credentials
    and passes that exact string to provider.async_change_password."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_cred = MagicMock()
    mock_cred.data = {"username": "child1"}
    managed_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, credentials=[mock_cred])
    hass.auth.async_get_user.return_value = managed_user

    result = await adapter.async_change_managed_user_password(VALID_USER_ID, "NewPass999!")

    assert result is True
    provider.async_change_password.assert_called_once_with("child1", "NewPass999!")


@pytest.mark.asyncio
async def test_change_password_missing_credential_fails_closed():
    """Verify that async_change_managed_user_password fails closed if the user has no Home Assistant credentials."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    managed_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, credentials=[])
    hass.auth.async_get_user.return_value = managed_user

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_change_managed_user_password(VALID_USER_ID, "NewPass999!")

    assert "has no Home Assistant credential/username" in str(exc_info.value)
    provider.async_change_password.assert_not_called()


# REQUIREMENT 3: Username Change API Fixes

@pytest.mark.asyncio
async def test_change_username_passes_credential_object_to_provider():
    """Verify that async_change_managed_user_username resolves the Credentials object
    and passes that object to provider.async_change_username."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    mock_cred = MagicMock()
    mock_cred.data = {"username": "oldusername"}
    managed_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, credentials=[mock_cred])
    hass.auth.async_get_user.return_value = managed_user

    result = await adapter.async_change_managed_user_username(VALID_USER_ID, "newusername")

    assert result is True
    provider.async_change_username.assert_called_once_with(mock_cred, "newusername")


@pytest.mark.asyncio
async def test_change_username_missing_credential_fails_closed():
    """Verify that async_change_managed_user_username fails closed if the user has no Home Assistant credentials."""
    hass, mock_store, provider = _setup_mock_hass()
    adapter = DomoluxHAAuthAdapter(hass)

    managed_user = MagicMock(id=VALID_USER_ID, is_admin=False, is_owner=False, credentials=[])
    hass.auth.async_get_user.return_value = managed_user

    with pytest.raises(DomoluxAuthAdapterError) as exc_info:
        await adapter.async_change_managed_user_username(VALID_USER_ID, "newusername")

    assert "has no Home Assistant credential object" in str(exc_info.value)
    provider.async_change_username.assert_not_called()
