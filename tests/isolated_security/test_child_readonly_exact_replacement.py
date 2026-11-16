"""Behavioural tests for the native group replacement of a managed Child.

A managed Child must end up with **exactly one** Home Assistant group: its
Domolux managed group, which carries the complete native permission policy
for that Child.  A leftover permissive system group (for example
``system-read-only``) would silently widen the Child's access, because Home
Assistant merges group policies permissively.

These tests assert the observable behaviour of the adapter instead of
inspecting the source text.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles.ha_auth_adapter import (
    DomoluxAuthAdapterError,
    DomoluxHAAuthAdapter,
    get_managed_group_id,
)

CHILD_ID = "22222222-2222-4222-8222-222222222222"


def _hass():
    hass = MagicMock()
    store = MagicMock()
    store._groups = {}
    store._async_schedule_save = MagicMock()

    auth = MagicMock()
    auth._store = store
    auth.auth_providers = []

    async def _async_update_user(user, group_ids=None, is_active=None, **kwargs):
        if group_ids is not None:
            user.groups = [
                store._groups.get(gid) or MagicMock(id=gid) for gid in group_ids
            ]
        if is_active is not None:
            user.is_active = is_active

    auth.async_update_user = AsyncMock(side_effect=_async_update_user)
    auth.async_get_user = AsyncMock(return_value=None)
    hass.auth = auth
    return hass, store


def _child():
    user = MagicMock()
    user.id = CHILD_ID
    user.is_admin = False
    user.is_owner = False
    user.is_active = True
    user.groups = []
    user.invalidate_cache = MagicMock()
    return user


@pytest.mark.asyncio
async def test_child_is_bound_to_exactly_the_managed_group():
    """Activation replaces every group with the Domolux managed group."""
    hass, store = _hass()
    adapter = DomoluxHAAuthAdapter(hass)
    user = _child()
    hass.auth.async_get_user.return_value = user

    assert await adapter.async_activate_managed_user(CHILD_ID) is True

    group_ids = {group.id for group in user.groups}
    assert group_ids == {get_managed_group_id(CHILD_ID)}
    # No permissive system group may remain attached.
    assert "system-read-only" not in group_ids
    assert "system-users" not in group_ids
    assert "system-admin" not in group_ids
    hass.auth.async_update_user.assert_called_once_with(
        user, group_ids=[get_managed_group_id(CHILD_ID)], is_active=True
    )


@pytest.mark.asyncio
async def test_owner_account_is_rejected_before_provisioning():
    """An owner account is never provisioned as a managed Child."""
    hass, store = _hass()
    adapter = DomoluxHAAuthAdapter(hass)
    user = _child()
    user.is_owner = True
    hass.auth.async_get_user.return_value = user

    with pytest.raises(DomoluxAuthAdapterError):
        await adapter.async_activate_managed_user(CHILD_ID)

    hass.auth.async_update_user.assert_not_called()


@pytest.mark.asyncio
async def test_fails_closed_when_group_update_is_unavailable():
    """Without ``async_update_user`` the adapter refuses to provision."""
    hass, store = _hass()
    adapter = DomoluxHAAuthAdapter(hass)
    user = _child()
    hass.auth.async_get_user.return_value = user
    hass.auth.async_update_user = MagicMock()

    with pytest.raises(DomoluxAuthAdapterError):
        await adapter.async_activate_managed_user(CHILD_ID)

    # No silent fallback activation.
    assert user.is_active is True  # untouched by the adapter
    assert not user.groups


@pytest.mark.asyncio
async def test_group_mismatch_deactivates_and_raises():
    """When the membership cannot be verified the account is deactivated."""
    hass, store = _hass()
    adapter = DomoluxHAAuthAdapter(hass)
    user = _child()
    hass.auth.async_get_user.return_value = user

    async def _wrong_update(_user, group_ids=None, is_active=None, **kwargs):
        # Simulate Home Assistant not applying the requested membership.
        if group_ids is not None:
            _user.groups = []
        if is_active is not None:
            _user.is_active = is_active

    hass.auth.async_update_user = AsyncMock(side_effect=_wrong_update)

    with pytest.raises(DomoluxAuthAdapterError):
        await adapter.async_activate_managed_user(CHILD_ID)

    # The deactivation fallback was attempted.
    assert hass.auth.async_update_user.await_count >= 2


@pytest.mark.asyncio
async def test_managed_group_is_created_with_deny_all_policy():
    """A brand new managed group grants nothing until a policy is synced."""
    hass, store = _hass()
    adapter = DomoluxHAAuthAdapter(hass)
    user = _child()
    hass.auth.async_get_user.return_value = user

    await adapter.async_activate_managed_user(CHILD_ID)

    group = store._groups[get_managed_group_id(CHILD_ID)]
    assert group.policy == {"entities": {}}
