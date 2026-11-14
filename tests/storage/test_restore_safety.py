"""T5.4 — Restore safety after store backup/restore.

A restored Domolux store must be re-validated against live HA auth
(`async_validate_and_sync`, the T4.5 startup routine) and must never
resurrect deleted/disabled users or grant Father/Admin to invalid users.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles.models import (
    DomoluxRole,
    FatherRoleAssignment,
    FatherRoleStatus,
)
from custom_components.domolux_roles.role_manager import DomoluxRoleManager
from custom_components.domolux_roles.store import DomoluxRoleStore

VALID_FATHER = "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
VALID_CHILD = "98765432-10fe-abcd-ef01-234567890abc"


def _restore_store(hass, father_user_id=VALID_FATHER):
    """Simulate restore: in-memory state loaded from a backup file."""
    store = DomoluxRoleStore(hass)
    store.set_father(
        FatherRoleAssignment(
            user_id=father_user_id,
            assigned_at="2026-09-27T12:00:00Z",
            assigned_by="system",
            status=FatherRoleStatus.ACTIVE,
        )
    )
    return store


@pytest.mark.asyncio
async def test_restore_does_not_resurrect_deleted_father():
    hass = MagicMock()
    hass.auth.async_get_user = AsyncMock(return_value=None)

    store = _restore_store(hass)
    manager = DomoluxRoleManager(hass, store)
    await manager.async_validate_and_sync()

    assert store.get_father() is None
    assert manager.get_user_role(VALID_FATHER) == DomoluxRole.USER


@pytest.mark.asyncio
async def test_restore_does_not_grant_father_to_disabled_user():
    hass = MagicMock()
    hass.auth.async_get_user = AsyncMock(
        return_value=MagicMock(is_admin=False, is_owner=False, is_disabled=True)
    )

    store = _restore_store(hass)
    manager = DomoluxRoleManager(hass, store)
    await manager.async_validate_and_sync()

    assert store.get_father() is None
    assert manager.get_user_role(VALID_FATHER) == DomoluxRole.USER


@pytest.mark.asyncio
async def test_restore_does_not_grant_father_to_admin_user():
    hass = MagicMock()
    hass.auth.async_get_user = AsyncMock(
        return_value=MagicMock(is_admin=True, is_owner=False, is_disabled=False)
    )

    store = _restore_store(hass)
    manager = DomoluxRoleManager(hass, store)
    await manager.async_validate_and_sync()

    assert store.get_father() is None
    assert manager.get_user_role(VALID_FATHER) == DomoluxRole.USER


@pytest.mark.asyncio
async def test_restore_restores_valid_father():
    hass = MagicMock()
    hass.auth.async_get_user = AsyncMock(
        return_value=MagicMock(is_admin=False, is_owner=False, is_disabled=False)
    )

    store = _restore_store(hass)
    manager = DomoluxRoleManager(hass, store)
    await manager.async_validate_and_sync()

    assert store.get_father() is not None
    assert manager.get_user_role(VALID_FATHER) == DomoluxRole.FATHER


@pytest.mark.asyncio
async def test_restore_grants_no_admin_to_invalid_child():
    """A restored child must never gain admin/owner status."""
    hass = MagicMock()
    hass.auth.async_get_user = AsyncMock(
        return_value=MagicMock(is_admin=False, is_owner=False, is_disabled=False)
    )

    store = _restore_store(hass)
    manager = DomoluxRoleManager(hass, store)
    await manager.async_validate_and_sync()

    role = manager.get_user_role(VALID_CHILD)
    assert role in (DomoluxRole.USER, DomoluxRole.FATHER)
    assert role != DomoluxRole.FATHER
