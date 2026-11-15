# Session & Subscription Registry (T4.1)

> Live-connection tracking used by revocation (T4.2) and soft revocation (T4.3).

## Why this exists

A revoked Child must stop receiving state pushes immediately, and a deleted
account must lose its open sockets. Both need to know which live connections
belong to a user.

## Supported mechanism

Home Assistant does **not** publish a public registry of active WebSocket
connections. The only supported, version-tolerant hook is
`ActiveConnection.subscriptions`: Home Assistant invokes every callback stored
there when the socket closes. Domolux therefore:

1. Stores a sentinel callback (`domolux_registry_<n>`) in
   `connection.subscriptions` for every tracked connection. On disconnect Home
   Assistant calls it and the registry entry is removed — cleanup does not rely
   on private APIs.
2. Stores Domolux-owned subscriptions through
   `DomoluxSessionRegistry.register_subscription()`, which wraps the caller's
   unsubscribe hook so the record is dropped _before_ the caller's cleanup runs
   (no dangling records, even if the hook raises).

Connections are tracked lazily: the first time they reach a Domolux management
helper (`_require_admin_or_father`, `_require_father`) or the Domolux
permission subscription command. There is deliberately no attempt to enumerate
connections that never touch the Domolux API; that would require private
internals and is not claimed.

## API

| Method                                                   | Purpose                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `register_connection(connection)`                        | Idempotent per object identity; returns `None` for connections without a user id. |
| `unregister_connection(connection)`                      | Remove record and sentinel.                                                       |
| `register_subscription(connection, id, unsub, kind=...)` | Track a Domolux subscription; installs a cleanup wrapper.                         |
| `remove_subscription(connection, id, invoke=True)`       | Remove one subscription, optionally invoking its hook.                            |
| `connections_for_user(user_id)`                          | Live connection objects for a user.                                               |
| `subscriptions_for_user(user_id)`                        | Tracked subscriptions for a user.                                                 |
| `refresh_user_subscriptions(user_id, reason)`            | Re-run subscription callbacks without closing the socket (soft revoke).           |
| `async_close_user_connections(user_id, reason)`          | Unsubscribe, close, and unregister every tracked connection for a user.           |
| `prune_closed()`                                         | Drop records whose socket Home Assistant already closed.                          |
| `clear()`                                                | Drop everything (called on integration unload and HA stop).                       |

## Closing a connection

Closing uses a version-guarded duck-typed lookup:

1. `connection.async_handle_close()` when available (current Home Assistant),
2. otherwise `connection.close()`.

If neither exists the connection is still unregistered but **not** counted as
closed, and an error is logged. Callers must treat that as a failed hard
revocation and fall back to token revocation; the registry never reports success
it cannot verify.

## Lifecycle

- Created per config entry in `async_setup_entry` and stored under
  `hass.data[DOMAIN][entry_id]["session_registry"]`.
- `EVENT_HOMEASSISTANT_STOP` clears it.
- `async_unload_entry` clears it and removes the stop listener.
- Nothing is stored on disk: the registry only contains references to live
  objects.

## Leak guarantee

`tests/test_domolux_session_registry.py` runs 1,000 register/disconnect cycles
and asserts the registry returns to `connection_count() == 0` and an empty
snapshot (scaled-down WS-04, see T7.2 for full scale).

## Known limitation

Service calls (`call_service`) do not carry an `ActiveConnection`. A Child that
only calls services is not tracked by this registry. Hard revocation for such a
user therefore relies on Home Assistant refresh-token revocation
(`async_remove_refresh_token`) and the live per-request authorization check in
the service guard. This limitation is recorded here and in the staging
checklist; it is not silently ignored.
