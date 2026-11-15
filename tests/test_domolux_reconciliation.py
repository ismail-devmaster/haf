"""T4.5 — startup reconciliation tests."""

from unittest.mock import AsyncMock, MagicMock

from custom_components.domolux_roles.const import STATUS_SUSPENDED_ADMIN, STATUS_SUSPENDED_DISABLED
from custom_components.domolux_roles.models import FamilyMemberRecord, FatherRoleAssignment, FatherRoleStatus
from custom_components.domolux_roles.role_manager import DomoluxRoleManager
from custom_components.domolux_roles.store import DomoluxRoleStore

CHILD = "22222222-2222-4222-8222-222222222222"
ORPHAN = "33333333-3333-4333-8333-333333333333"


def _store(hass):
    store = DomoluxRoleStore(hass)
    store._store = None
    return store


def _member(user_id, status="ACTIVE"):
    return FamilyMemberRecord(
        user_id=user_id,
        display_name="Child",
        username="child",
        managed_group_id=f"domolux-family-{user_id}",
        status=status,
    )


async def test_reconciliation_prunes_deleted_family_member_and_grants():
    hass = MagicMock()
    auth = MagicMock()
    auth.async_get_user = AsyncMock(return_value=None)
    hass.auth = auth
    store = _store(hass)
    store.add_family_member(_member(CHILD))
    store.set_user_permissions(__import__("custom_components.domolux_roles.models", fromlist=["UserPermissionSet"]).UserPermissionSet(user_id=CHILD))
    manager = DomoluxRoleManager(hass, store)

    await manager.async_reconcile()

    assert store.get_family_member(CHILD) is None
    assert CHILD not in store.data.permissions


async def test_reconciliation_suspends_disabled_member():
    hass = MagicMock()
    user = MagicMock()
    user.is_disabled = True
    user.is_admin = False
    user.is_owner = False
    auth = MagicMock()
    auth.async_get_user = AsyncMock(return_value=user)
    hass.auth = auth
    store = _store(hass)
    store.add_family_member(_member(CHILD))
    manager = DomoluxRoleManager(hass, store)

    await manager.async_reconcile()

    member = store.get_family_member(CHILD)
    assert member is not None
    assert member.status == STATUS_SUSPENDED_DISABLED


async def test_reconciliation_suspends_admin_member():
    hass = MagicMock()
    user = MagicMock()
    user.is_disabled = False
    user.is_admin = True
    user.is_owner = False
    auth = MagicMock()
    auth.async_get_user = AsyncMock(return_value=user)
    hass.auth = auth
    store = _store(hass)
    store.add_family_member(_member(CHILD))
    manager = DomoluxRoleManager(hass, store)

    await manager.async_reconcile()

    member = store.get_family_member(CHILD)
    assert member is not None
    assert member.status == STATUS_SUSPENDED_ADMIN


async def test_reconciliation_prunes_dangling_permissions():
    hass = MagicMock()
    hass.auth = None
    store = _store(hass)
    from custom_components.domolux_roles.models import UserPermissionSet

    store.set_user_permissions(UserPermissionSet(user_id=ORPHAN))
    manager = DomoluxRoleManager(hass, store)

    await manager.async_reconcile()

    assert ORPHAN not in store.data.permissions


async def test_reconciliation_handles_deleted_father():
    hass = MagicMock()
    auth = MagicMock()
    auth.async_get_user = AsyncMock(return_value=None)
    hass.auth = auth
    store = _store(hass)
    store.set_father(
        FatherRoleAssignment(
            user_id=CHILD,
            assigned_at="2026-01-01T00:00:00+00:00",
            assigned_by="system",
            status=FatherRoleStatus.ACTIVE,
        )
    )
    manager = DomoluxRoleManager(hass, store)

    await manager.async_reconcile()

    assert store.get_father() is None
