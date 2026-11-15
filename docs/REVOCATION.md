# Revocation & Soft-Revoke Routine (T4.2 / T4.3)

> One ordered routine for every access reduction, plus the synchronous
> soft-revoke signal used when a session should stay open.

## Ordered routine

`DomoluxRevocationOrchestrator.async_apply()` is the only path that may lower
access. It performs, in this exact order:

1. **Store update** — the caller supplies `mutate()`; it runs first.
2. **Revision bump + durable flush** — `store.bump_revisions()` then
   `store.async_save()` (awaited). Security reductions are never debounced.
3. **Cache invalidation** — store-level invalidators, then the Home Assistant
   user permission cache through the version-isolated adapter helper.
4. **Subscription handling**
   - soft: `registry.refresh_user_subscriptions()` (never unsubscribes),
   - hard: deferred to step 6.
5. **Token revocation** — only when `revoke_tokens=True`; requires an explicit
   `token_revoker` or `adapter.async_revoke_user_sessions`. Missing revoker
   raises `DomoluxRevocationError` instead of claiming success.
6. **Connection close** — only when `hard_close=True`; uses the
   registry's version-guarded close hook and counts only verified closes.
7. **Audit** — `security.revoke` entry with outcome `allowed`, or `failed`
   plus a re-raised `DomoluxRevocationError` if any step failed.

A failure before step 7 means no success result is ever returned.

## Soft revoke (T4.3)

For reductions that do not require killing the session, the orchestrator fires
`domolux_permissions_updated` **synchronously** (on the same event loop turn)
with:

```json
{
  "user_id": "<child>",
  "reason": "permission.reduced",
  "revision": 7,
  "removed_targets": [
    { "target_type": "entity", "target_id": "light.living_room" },
    { "target_type": "area", "target_id": "living_room" },
    { "target_type": "view", "target_id": "dashboard/kids" }
  ]
}
```

`removed_targets` is computed by `reduced_targets(old, new)` and covers removed
or lowered entity/device/area rules and removed allow view rules. The Child
subscription forwards the payload to the client, which removes the items and
shows the neutral message "This device is no longer shared with you" instead of
a raw error. No hidden entity names are included beyond the target the Child
was already allowed to see before the reduction.

Increases use `reduction=False`: the revision is bumped and saved, the event is
emitted with an empty `removed_targets`, and the client refreshes.

## Wiring matrix

| Event                            | Path                                                                                       | State                         |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| Child permission reduced/removed | `permission_api._execute_atomic_permission_mutation` → orchestrator                        | Wired                         |
| Child account deleted            | `family_api.ws_family_delete` → orchestrator (hard close + grant prune)                    | Wired                         |
| Child account disabled           | `family_api.ws_family_disable` → orchestrator (hard close)                                 | Wired                         |
| Father removed/demoted           | `api.ws_remove_father` → orchestrator (token revoke + hard close)                          | Wired                         |
| Dashboard/view rule revoked      | `permission_api.ws_permission_set_view_rule` / `remove_view_rule` (permission transaction) | Wired                         |
| Registry change reduces access   | area/device registry events                                                                | **Not wired** — see gap below |
| Father replaced atomically       | T4.4                                                                                       | **Not implemented**           |

## Known gaps (explicit)

- **Registry-change reductions** (T4.2 last clause): a device moving out of a
  granted area is enforced dynamically by the evaluator (T3/LC-11), but a
  dedicated registry listener that calls the orchestrator is not implemented
  yet. It is tracked as an open item for T4.2 and blocks calling T4.2 fully
  DONE.
- **Father replacement** is still "revoke then assign"; the atomic two-phase
  replace with crash recovery belongs to T4.4 and is not implemented.
- Connections that only issue `call_service` are not tracked by the session
  registry (see `docs/SESSION_REGISTRY.md`); hard revocation for them relies on
  refresh-token revocation plus per-request denial.

## Tests

`tests/test_domolux_revocation.py` covers ordering, fail-closed persistence,
hard vs soft behaviour, token revoker requirement, user disable, reduction
detection, removal payload, evaluator denial/regrant round-trip, and the Father
removal wiring (`evidence/T4.2/`, `evidence/T4.3/`).
