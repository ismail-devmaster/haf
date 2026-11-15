"""T4.1 — live connection and subscription registry tests.

These tests use a small fake of Home Assistant's ``ActiveConnection`` contract:
a ``user`` object and a ``subscriptions`` mapping whose callbacks Home
Assistant invokes when the socket closes. They verify that:
  * tracking is idempotent and per-object,
  * Home Assistant's disconnect callback removes the record (no leaks),
  * 1,000 connect/disconnect cycles return the registry to baseline (WS-04
    scaled down),
  * Domolux subscriptions are cleaned before their unsubscribe hook runs,
  * revocation helpers only touch the target user and fail loudly when the
    close hook is unavailable.
"""

import asyncio

from custom_components.domolux_roles.session_registry import (
    DomoluxSessionRegistry,
)


class FakeUser:
    def __init__(self, user_id):
        self.id = user_id


class FakeConnection:
    def __init__(self, user_id=None, supports_close=True):
        self.user = FakeUser(user_id) if user_id is not None else None
        self.subscriptions = {}
        self.closed = False
        self._supports_close = supports_close
        self.close_calls = 0

    async def async_handle_close(self):
        self.close_calls += 1
        self.closed = True
        for unsub in list(self.subscriptions.values()):
            unsub()
        self.subscriptions.clear()


class LegacyConnection:
    """Connection exposing only a synchronous close hook."""

    def __init__(self, user_id):
        self.user = FakeUser(user_id)
        self.subscriptions = {}
        self.close_calls = 0

    def close(self):
        self.close_calls += 1


def test_register_connection_is_idempotent():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("user-a")

    first = registry.register_connection(connection)
    second = registry.register_connection(connection)

    assert first is second
    assert registry.connection_count() == 1


def test_register_without_user_is_rejected():
    registry = DomoluxSessionRegistry()
    assert registry.register_connection(FakeConnection(None)) is None
    assert registry.register_connection(None) is None
    assert registry.connection_count() == 0


def test_disconnect_callback_cleans_registry():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("user-a")
    registry.register_connection(connection)

    # Home Assistant invokes every callback in connection.subscriptions when
    # the socket closes. Simulate exactly that contract.
    for unsub in list(connection.subscriptions.values()):
        unsub()
    connection.subscriptions.clear()

    assert registry.connection_count() == 0
    assert registry.user_ids() == set()


def test_thousand_connect_disconnect_cycles_do_not_leak():
    registry = DomoluxSessionRegistry()

    for _ in range(1000):
        connection = FakeConnection("user-a")
        registry.register_connection(connection)
        registry.register_subscription(
            connection, "1", lambda: None, kind="permission"
        )
        for unsub in list(connection.subscriptions.values()):
            unsub()
        connection.subscriptions.clear()

    assert registry.connection_count() == 0
    assert registry.snapshot() == []


def test_unregister_connection_removes_sentinel():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("user-a")
    registry.register_connection(connection)
    assert len(connection.subscriptions) == 1

    assert registry.unregister_connection(connection) is True
    assert registry.connection_count() == 0
    assert connection.subscriptions == {}
    assert registry.unregister_connection(connection) is False


def test_register_subscription_cleans_record_before_unsub():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("user-a")
    calls = []

    def _unsub():
        # The record must already be gone by the time the caller's hook runs.
        assert registry.subscriptions_for_user("user-a") == []
        calls.append("unsub")

    registry.register_subscription(connection, "sub-1", _unsub)

    assert len(registry.subscriptions_for_user("user-a")) == 1
    connection.subscriptions["sub-1"]()
    assert calls == ["unsub"]
    assert registry.connection_count() == 1  # socket is still open
    assert registry.subscriptions_for_user("user-a") == []


def test_remove_subscription_invokes_unsub_once():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("user-a")
    calls = []

    registry.register_subscription(connection, "sub-1", lambda: calls.append(1))

    assert registry.remove_subscription(connection, "sub-1") is True
    assert calls == [1]
    assert registry.remove_subscription(connection, "sub-1") is False
    assert "sub-1" not in connection.subscriptions


def test_refresh_only_affects_target_user():
    registry = DomoluxSessionRegistry()
    child = FakeConnection("child")
    other = FakeConnection("other")
    child_calls = []
    other_calls = []

    registry.register_subscription(
        child, "sub-1", lambda: child_calls.append(1), kind="permission"
    )
    registry.register_subscription(
        other, "sub-2", lambda: other_calls.append(1), kind="permission"
    )

    refreshed = registry.refresh_user_subscriptions("child")

    assert refreshed == 1
    assert child_calls == [1]
    assert other_calls == []
    # Soft refresh never closes the connection.
    assert registry.is_tracked(child) is True


def test_close_user_connections_closes_and_unregisters():
    registry = DomoluxSessionRegistry()
    child_a = FakeConnection("child")
    child_b = FakeConnection("child")
    other = FakeConnection("other")
    unsub_calls = []

    for conn in (child_a, child_b, other):
        registry.register_connection(conn)
    registry.register_subscription(
        child_a, "sub-1", lambda: unsub_calls.append("a")
    )

    closed = asyncio.run(registry.async_close_user_connections("child"))

    assert closed == 2
    assert child_a.closed is True
    assert child_b.closed is True
    assert other.closed is False
    assert registry.connection_count() == 1
    assert registry.user_ids() == {"other"}
    assert unsub_calls == ["a"]


def test_close_uses_legacy_synchronous_hook():
    registry = DomoluxSessionRegistry()
    connection = LegacyConnection("child")
    registry.register_connection(connection)

    closed = asyncio.run(registry.async_close_user_connections("child"))

    assert closed == 1
    assert connection.close_calls == 1
    assert registry.connection_count() == 0


def test_close_without_hook_fails_loudly_and_unregisters():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("child")
    connection.async_handle_close = None  # type: ignore[assignment]
    registry.register_connection(connection)

    closed = asyncio.run(registry.async_close_user_connections("child"))

    # Not counted as closed: the caller must treat this as a hard failure.
    assert closed == 0
    assert registry.connection_count() == 0


def test_prune_closed_and_clear():
    registry = DomoluxSessionRegistry()
    open_connection = FakeConnection("open")
    closed_connection = FakeConnection("closed")
    registry.register_connection(open_connection)
    registry.register_connection(closed_connection)
    closed_connection.subscriptions = None
    closed_connection.closed = True

    assert registry.prune_closed() == 1
    assert registry.user_ids() == {"open"}

    registry.clear()
    assert registry.connection_count() == 0


def test_snapshot_describes_without_exposing_objects():
    registry = DomoluxSessionRegistry()
    connection = FakeConnection("user-a")
    registry.register_connection(connection)
    registry.register_subscription(connection, "sub-1", lambda: None)

    snapshot = registry.snapshot()

    assert snapshot[0]["user_id"] == "user-a"
    assert snapshot[0]["subscriptions"][0]["subscription_id"] == "sub-1"
    assert connection not in snapshot


def test_shutdown_listener_clears_registry():
    from unittest.mock import MagicMock

    from custom_components.domolux_roles.session_registry import (
        EVENT_HOMEASSISTANT_STOP,
        async_register_session_registry,
    )

    registry = DomoluxSessionRegistry()
    registry.register_connection(FakeConnection("user-a"))

    hass = MagicMock()
    captured = {}
    hass.bus.async_listen = MagicMock(
        side_effect=lambda event, cb: captured.setdefault("cb", cb)
    )

    unregister = async_register_session_registry(hass, registry)
    assert callable(unregister)
    assert hass.bus.async_listen.call_args.args[0] == EVENT_HOMEASSISTANT_STOP
    assert registry.connection_count() == 1

    captured["cb"](None)
    assert registry.connection_count() == 0
