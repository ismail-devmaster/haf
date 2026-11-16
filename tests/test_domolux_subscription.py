"""Behavioural tests for the dedicated Domolux permission subscription.

The subscription exposes permission-change events to a connected client.  It
must only ever deliver the caller's own permission stream, and it must refuse
to register at all when the caller is not authenticated or when the role
manager cannot be reached (fail closed).
"""

from unittest.mock import MagicMock

import pytest

from custom_components.domolux_roles import DOMAIN
from custom_components.domolux_roles.api import ws_permission_subscribe

CHILD = "22222222-2222-4222-8222-222222222222"
OTHER_CHILD = "44444444-4444-4444-8444-444444444444"
FATHER = "33333333-3333-4333-8333-333333333333"


def _manager(father_id=None):
    manager = MagicMock()
    father = None
    if father_id is not None:
        father = MagicMock()
        father.user_id = father_id
    manager.get_father_assignment.return_value = father
    return manager


def _hass(manager=None):
    hass = MagicMock()
    hass.data = {DOMAIN: {"entry": {"manager": manager if manager else _manager()}}}
    return hass


def _connection(hass, user_id=CHILD, is_disabled=False):
    connection = MagicMock()
    connection.hass = hass
    user = MagicMock()
    user.id = user_id
    user.is_admin = False
    user.is_owner = False
    user.is_disabled = is_disabled
    connection.user = user
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()
    connection.send_event = MagicMock()
    connection.subscriptions = {}
    return connection


@pytest.mark.asyncio
async def test_subscription_requires_authentication():
    """A disabled user cannot subscribe at all."""
    hass = _hass()
    connection = _connection(hass, is_disabled=True)

    await ws_permission_subscribe(hass, connection, {"id": 1})

    connection.send_error.assert_called_once()
    connection.send_result.assert_not_called()
    hass.bus.async_listen.assert_not_called()


@pytest.mark.asyncio
async def test_child_cannot_subscribe_to_another_user():
    """A Child may not subscribe to another user's permission stream."""
    hass = _hass(_manager(father_id=FATHER))
    connection = _connection(hass, user_id=CHILD)

    await ws_permission_subscribe(
        hass, connection, {"id": 1, "target_user_id": OTHER_CHILD}
    )

    connection.send_error.assert_called_once()
    connection.send_result.assert_not_called()
    hass.bus.async_listen.assert_not_called()


@pytest.mark.asyncio
async def test_child_may_subscribe_to_itself():
    """A Child subscribing to its own stream is accepted."""
    hass = _hass(_manager(father_id=FATHER))
    connection = _connection(hass, user_id=CHILD)

    await ws_permission_subscribe(hass, connection, {"id": 1})

    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()
    assert connection.send_result.call_args[0][1] == {
        "subscribed": True,
        "target_user_id": CHILD,
    }
    hass.bus.async_listen.assert_called_once()


@pytest.mark.asyncio
async def test_father_may_subscribe_to_another_user():
    """The Father may subscribe to any family member's stream."""
    hass = _hass(_manager(father_id=FATHER))
    connection = _connection(hass, user_id=FATHER)

    await ws_permission_subscribe(
        hass, connection, {"id": 1, "target_user_id": CHILD}
    )

    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()
    assert connection.send_result.call_args[0][1]["target_user_id"] == CHILD


@pytest.mark.asyncio
async def test_subscription_fails_closed_when_role_manager_is_unavailable():
    """If the role manager cannot be reached the subscription is refused."""
    hass = MagicMock()
    hass.data = {DOMAIN: {}}  # no manager at all
    connection = _connection(hass, user_id=CHILD)

    await ws_permission_subscribe(
        hass, connection, {"id": 1, "target_user_id": OTHER_CHILD}
    )

    connection.send_error.assert_called_once()
    connection.send_result.assert_not_called()
    hass.bus.async_listen.assert_not_called()


@pytest.mark.asyncio
async def test_subscription_only_delivers_the_subscribed_user():
    """Events for other users are never forwarded to the subscriber."""
    hass = _hass(_manager(father_id=FATHER))
    connection = _connection(hass, user_id=CHILD)

    await ws_permission_subscribe(hass, connection, {"id": 1})

    listener = hass.bus.async_listen.call_args[0][1]

    await listener(MagicMock(data={"user_id": OTHER_CHILD, "secret": "other"}))
    connection.send_event.assert_not_called()

    await listener(MagicMock(data={"user_id": CHILD, "state": "changed"}))
    connection.send_event.assert_called_once()
    assert connection.send_event.call_args[0][1]["user_id"] == CHILD


@pytest.mark.asyncio
async def test_subscription_is_registered_for_cleanup():
    """The subscription is registered so it can be removed on disconnect."""
    from custom_components.domolux_roles.session_registry import (
        DomoluxSessionRegistry,
    )

    hass = _hass(_manager(father_id=FATHER))
    registry = DomoluxSessionRegistry()
    hass.data[DOMAIN]["entry"]["session_registry"] = registry
    connection = _connection(hass, user_id=CHILD)

    await ws_permission_subscribe(hass, connection, {"id": 7})

    assert registry.is_tracked(connection) is True
    assert len(registry.subscriptions_for_user(CHILD)) == 1
    assert 7 in connection.subscriptions


@pytest.mark.asyncio
async def test_subscription_is_removed_on_disconnect():
    """The unsubscribe hook registered on the connection removes the record."""
    from custom_components.domolux_roles.session_registry import (
        DomoluxSessionRegistry,
    )

    hass = _hass(_manager(father_id=FATHER))
    registry = DomoluxSessionRegistry()
    hass.data[DOMAIN]["entry"]["session_registry"] = registry
    connection = _connection(hass, user_id=CHILD)

    await ws_permission_subscribe(hass, connection, {"id": 7})
    assert len(registry.subscriptions_for_user(CHILD)) == 1

    # Home Assistant calls every entry of ``connection.subscriptions`` when
    # the socket closes.
    connection.subscriptions[7]()

    assert registry.subscriptions_for_user(CHILD) == []
