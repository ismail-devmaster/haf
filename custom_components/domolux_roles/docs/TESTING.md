Test Documentation - Domolux Roles Phase 1

Run tests:

- Backend: PYTHONPATH=. /home/ismabeast/hoco/venv/bin/pytest tests/ -v
- Frontend: yarn test test/data/domolux_roles.test.ts

Test counts:

- 21 backend pytest tests (storage, API, security, lifecycle)
- 10 frontend Vitest tests (identity API, subscriptions, edge cases)

Coverage areas:

- Installation & empty store
- Valid/invalid assignment paths
- Admin/Owner/disabled target rejection
- Unauthorized WS access
- Storage corruption recovery
- Deleted/disabled user sync
- Father elevated to admin (fail-closed)
- HA restart persistence
- Schema migration v0 -> v1
- Duplicate father rejection
- Normal user, Father, Admin, Owner identity checks
- Integration unavailable / disconnected handling
- Username/name manipulation denial
- Real-time subscription event handling

Manual test checklist (for release QA):

1. Fresh install -> no Father assigned
2. Admin assigns Father -> success
3. Non-admin tries assign -> rejected
4. Replace Father -> confirmation dialog, old role revoked
5. Remove Father -> returns to unassigned
6. Restart HA -> Father persists
7. Delete Father user -> role auto-orphans
8. Disable Father user -> role suspends
9. Promote Father to admin -> role auto-revokes
10. Corrupt .storage/domolux_auth -> fails safe to unassigned
