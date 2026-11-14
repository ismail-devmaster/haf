# T5.3 — Durability & atomic writes (domolux_auth / domolux_views_data)

## HA Store semantics relied on (verified from installed source)

Both `DomoluxRoleStore` (key `domolux_auth`) and `DomoluxViewStore` (key
`domolux_views_data`) write exclusively through `homeassistant.helpers.storage.Store`.
The installed HA Store helper (site-packages `homeassistant/helpers/storage.py`):

- Serializes to a temporary file in the same directory as `.storage/<key>`.
- `os.replace()`s the temp file over the target (atomic on POSIX).
- fsyncs the temp file before rename; on crash before rename, the old file is untouched.
- A reader never sees a torn/partial file — it either sees the old or the new complete payload.

Both stores also perform **pre-save validation** (`validate(payload)`) inside
`async_save()` and raise on failure _before_ the Store is called, so an
invalid payload is never written.

## Sync security-reduction durability (flush-before-success)

Security-reducing changes in Domolux Roles flow through the role/permission
managers, which call `flush_security_reduction(...)` (revision-tuple cache key)
_before_ the API reports success. HA Store writes are awaited inside
`async_save()` (the result is awaited when awaitable), so a process kill -9
after `async_save()` returns leaves either the old or the new consistent
state — never a partially-written store.

## kill -9 during save

A kill -9 injection test requires a live HA Core container with a writable
`.storage`. The Windows/Kali host here has no HA Core installed (see
`evidence/T5.5` for environment notes). This is therefore marked:

- **SARIF/functional evidence**: covered by `tests/test_domolux_roles.py`
  (save/load round-trip through a mock Store), `tests/storage/` golden and
  fuzz coverage, and pre-save validation failure paths.
- **Container kill -9 test**: pending Phase 11 (LC-01 … LC-22 live-container
  staging), where a real HA container is available. Tracked as **BLOCKED**
  for T5.3(container) until Phase 11.

No claim of "kill -9 verified" is made in this environment.
