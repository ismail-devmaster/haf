"""Live WebSocket connection and subscription registry (T4.1).

Purpose
-------
Revocation (T4.2) and soft revocation (T4.3) need to know *which live
connections are watching which user* so that security reductions can terminate
the right subscriptions and, when required, close the right connections.

Supported mechanism
-------------------
Home Assistant does not publish a public global registry of active WebSocket
connections. The supported, version-tolerant hook is the
``ActiveConnection.subscriptions`` mapping: whatever a command stores there is
invoked by Home Assistant when the connection closes. This module therefore:

1. Registers a sentinel entry in ``connection.subscriptions`` for every tracked
   connection. When Home Assistant closes the connection it calls the sentinel,
   which removes the record. This gives disconnect cleanup without relying on
   private APIs.
2. Records Domolux-owned subscriptions explicitly so revocation can invoke the
   correct unsubscribe callbacks before the socket is closed.

Anything that cannot be done through that mapping (for example enumerating
connections that never called a Domolux command) is intentionally *not*
invented here. Connections are tracked lazily the first time they interact with
the Domolux management/subscription API, and closing a connection uses a
version-guarded duck-typed lookup of the close hook.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import inspect
import itertools
import logging
from typing import Any, Callable, Optional

_LOGGER = logging.getLogger(__name__)

# Prefix for the internal sentinel stored in ``connection.subscriptions``.
_REGISTRY_SENTINEL_PREFIX = "domolux_registry_"

# Home Assistant fires this event when it shuts down. Imported lazily so the
# module also loads in isolated unit tests where homeassistant is mocked.
try:  # pragma: no cover - exercised implicitly by the import fallback
    from homeassistant.const import EVENT_HOMEASSISTANT_STOP
except Exception:  # pragma: no cover - mocked/absent Home Assistant
    EVENT_HOMEASSISTANT_STOP = "homeassistant_stop"


@dataclass
class SubscriptionRecord:
    """A Domolux-owned subscription on a tracked connection."""

    subscription_id: str
    user_id: str
    kind: str
    unsub: Callable[[], Any]
    notify: Optional[Callable[[], Any]] = None

    def describe(self) -> dict[str, Any]:
        """Return a serialisable description (never includes the callback)."""
        return {
            "subscription_id": self.subscription_id,
            "user_id": self.user_id,
            "kind": self.kind,
        }


@dataclass
class ConnectionRecord:
    """A tracked WebSocket connection."""

    connection: Any
    user_id: str
    sentinel_id: str
    registered_at: str
    subscriptions: dict[str, SubscriptionRecord] = field(default_factory=dict)

    def describe(self) -> dict[str, Any]:
        """Return a serialisable description (never includes the connection)."""
        return {
            "user_id": self.user_id,
            "registered_at": self.registered_at,
            "subscriptions": [
                sub.describe() for sub in self.subscriptions.values()
            ],
        }


class DomoluxSessionRegistry:
    """Tracks live Domolux-aware WebSocket connections and subscriptions.

    The registry is deliberately per-integration-instance so that unloading the
    integration drops all references (no module-level connection leaks).
    """

    def __init__(self) -> None:
        self._connections: dict[int, ConnectionRecord] = {}
        self._sentinel_ids = itertools.count(1)

    # ------------------------------------------------------------------
    # Connection tracking
    # ------------------------------------------------------------------
    def register_connection(self, connection: Any) -> Optional[ConnectionRecord]:
        """Track ``connection`` once per object identity.

        Returns the existing record when the connection is already tracked.
        Returns ``None`` when the connection exposes no user object, because a
        record without a user cannot be revoked and must not be trusted.
        """
        if connection is None:
            return None

        key = id(connection)
        existing = self._connections.get(key)
        if existing is not None and existing.connection is connection:
            return existing

        user = getattr(connection, "user", None)
        user_id = getattr(user, "id", None)
        if not isinstance(user_id, str) or not user_id:
            return None

        sentinel_id = f"{_REGISTRY_SENTINEL_PREFIX}{next(self._sentinel_ids)}"
        record = ConnectionRecord(
            connection=connection,
            user_id=user_id,
            sentinel_id=sentinel_id,
            registered_at=_now_iso(),
        )

        subscriptions = getattr(connection, "subscriptions", None)
        if isinstance(subscriptions, dict):
            # Called by Home Assistant when the connection closes. Using the
            # documented mapping is what makes disconnect cleanup reliable.
            subscriptions[sentinel_id] = lambda: self._connections.pop(key, None)
        else:
            _LOGGER.debug(
                "Connection for user %s has no subscription mapping; "
                "registry cleanup will rely on explicit unregister.",
                user_id,
            )

        self._connections[key] = record
        return record

    def unregister_connection(self, connection: Any) -> bool:
        """Forget a connection and drop the sentinel entry from its mapping."""
        if connection is None:
            return False
        key = id(connection)
        record = self._connections.pop(key, None)
        if record is None:
            return False

        subscriptions = getattr(connection, "subscriptions", None)
        if isinstance(subscriptions, dict):
            subscriptions.pop(record.sentinel_id, None)
        return True

    # ------------------------------------------------------------------
    # Subscription tracking
    # ------------------------------------------------------------------
    def register_subscription(
        self,
        connection: Any,
        subscription_id: str,
        unsub: Callable[[], Any],
        *,
        kind: str = "permission",
        notify: Optional[Callable[[], Any]] = None,
    ) -> Optional[SubscriptionRecord]:
        """Track a Domolux subscription and make sure it is cleaned up.

        The wrapper stored in ``connection.subscriptions`` removes the record
        from the registry *before* delegating to the caller's unsubscribe
        function, so a disconnect can never leave a dangling record.
        """
        record = self.register_connection(connection)
        if record is None:
            return None

        def _cleanup() -> Any:
            record.subscriptions.pop(subscription_id, None)
            return unsub()

        subscriptions = getattr(connection, "subscriptions", None)
        if isinstance(subscriptions, dict):
            subscriptions[subscription_id] = _cleanup

        sub_record = SubscriptionRecord(
            subscription_id=subscription_id,
            user_id=record.user_id,
            kind=kind,
            unsub=_cleanup,
            notify=notify,
        )
        record.subscriptions[subscription_id] = sub_record
        return sub_record

    def remove_subscription(
        self, connection: Any, subscription_id: str, *, invoke: bool = True
    ) -> bool:
        """Remove one subscription, optionally invoking its unsubscribe hook."""
        record = self._connections.get(id(connection))
        if record is None:
            return False
        sub = record.subscriptions.pop(subscription_id, None)
        if sub is None:
            return False

        subscriptions = getattr(connection, "subscriptions", None)
        if isinstance(subscriptions, dict):
            subscriptions.pop(subscription_id, None)
        if invoke:
            _invoke_safely(sub.unsub)
        return True

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------
    def is_tracked(self, connection: Any) -> bool:
        """Return whether this exact connection object is tracked."""
        record = self._connections.get(id(connection))
        return record is not None and record.connection is connection

    def connection_count(self) -> int:
        """Return the number of tracked connections."""
        return len(self._connections)

    def user_ids(self) -> set[str]:
        """Return the ids of users with at least one tracked connection."""
        return {record.user_id for record in self._connections.values()}

    def connections_for_user(self, user_id: str) -> list[Any]:
        """Return tracked connection objects for ``user_id``."""
        return [
            record.connection
            for record in self._connections.values()
            if record.user_id == user_id
        ]

    def subscriptions_for_user(self, user_id: str) -> list[SubscriptionRecord]:
        """Return all tracked subscriptions belonging to ``user_id``."""
        result: list[SubscriptionRecord] = []
        for record in self._connections.values():
            if record.user_id == user_id:
                result.extend(record.subscriptions.values())
        return result

    def snapshot(self) -> list[dict[str, Any]]:
        """Return a serialisable snapshot for diagnostics and tests."""
        return [record.describe() for record in self._connections.values()]

    # ------------------------------------------------------------------
    # Revocation helpers
    # ------------------------------------------------------------------
    def refresh_user_subscriptions(
        self, user_id: str, reason: str = "revision_changed"
    ) -> int:
        """Signal that ``user_id``'s permissions changed.

        Invokes each subscription's *notify* callback (never its unsubscribe
        hook) and keeps the connection open. Returns the number of notified
        subscriptions. Subscriptions registered without a notify hook are left
        untouched.
        """
        count = 0
        for record in list(self._connections.values()):
            if record.user_id != user_id:
                continue
            for subscription_id, sub in list(record.subscriptions.items()):
                if sub.notify is None:
                    continue
                _invoke_safely(sub.notify)
                count += 1
                _LOGGER.debug(
                    "Refreshed subscription %s (%s) for user %s: %s",
                    subscription_id,
                    sub.kind,
                    user_id,
                    reason,
                )
        return count

    async def async_close_user_connections(
        self, user_id: str, reason: str = "revoked"
    ) -> int:
        """Close every tracked connection belonging to ``user_id``.

        Returns the number of connections that were both tracked and closable.
        A connection is only counted once its close hook has been invoked
        successfully. If Home Assistant exposes no close hook the connection is
        still unregistered, but it is not reported as closed - the caller must
        treat that as a failed hard revocation (fail loudly).
        """
        closed = 0
        for record in list(self._connections.values()):
            if record.user_id != user_id:
                continue

            # Re-run unsubscribe callbacks explicitly so Domolux-owned
            # subscriptions are torn down even if the close path is missing.
            # Removing them from the connection mapping first prevents the
            # close hook from invoking the same callback a second time.
            for sub in list(record.subscriptions.values()):
                self.remove_subscription(
                    record.connection, sub.subscription_id, invoke=True
                )

            if await _async_close_connection(record.connection):
                closed += 1
            else:
                _LOGGER.error(
                    "Could not close live connection for user %s during %s; "
                    "the connection must be rejected on its next request.",
                    user_id,
                    reason,
                )

            self.unregister_connection(record.connection)

        return closed

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------
    def prune_closed(self) -> int:
        """Drop records whose connection Home Assistant already closed."""
        removed = 0
        for key, record in list(self._connections.items()):
            subscriptions = getattr(record.connection, "subscriptions", None)
            if subscriptions is None or getattr(record.connection, "closed", False):
                self._connections.pop(key, None)
                removed += 1
        return removed

    def clear(self) -> None:
        """Drop all tracked connections and subscriptions."""
        self._connections.clear()


def _invoke_safely(callback: Callable[[], Any]) -> None:
    """Invoke ``callback`` and swallow/log its error (never abort revocation)."""
    try:
        result = callback()
        if inspect.isawaitable(result):
            # Unsubscribe callbacks are synchronous in Home Assistant. An
            # awaitable here means a caller misused the registry; consume the
            # coroutine to avoid a warning but never block revocation on it.
            if inspect.iscoroutine(result):
                result.close()
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.warning("Domolux subscription cleanup callback failed: %s", err)


async def _async_close_connection(connection: Any) -> bool:
    """Close a WebSocket connection using a version-guarded duck-typed hook."""
    for attribute in ("async_handle_close", "close"):
        close = getattr(connection, attribute, None)
        if not callable(close):
            continue
        try:
            result = close()
            if inspect.isawaitable(result):
                await result
            return True
        except Exception as err:
            _LOGGER.warning(
                "Domolux connection close via %s failed: %s", attribute, err
            )
    return False


def _now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def async_register_session_registry(
    hass: Any, registry: DomoluxSessionRegistry
) -> Callable[[], None]:
    """Clear the registry on Home Assistant shutdown; return an unsubscribe hook."""
    bus = getattr(hass, "bus", None)
    if bus is None or not hasattr(bus, "async_listen"):
        return lambda: None

    def _shutdown(_event: Any) -> None:
        registry.clear()

    try:
        return bus.async_listen(EVENT_HOMEASSISTANT_STOP, _shutdown)
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.warning("Could not subscribe to Home Assistant stop event: %s", err)
        return lambda: None
