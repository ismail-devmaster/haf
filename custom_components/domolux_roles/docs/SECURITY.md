Security Notes - Domolux Roles Phase 1

- Server-side authority only; frontend visibility is never a security mechanism
- Father bound to HA user UUID; never username or display name
- Backend validation rejects Admin/Owner targets and disabled users
- Isolated storage (.storage/domolux_auth); never touches .storage/auth
- No passwords, tokens, or secrets stored
- Corrupted storage fails closed to unassigned
- All management WS endpoints require active HA Admin privilege + non-disabled
- Fail-closed live check: Father loses role if elevated to admin/owner post-assignment
- Concurrency safety via asyncio.Lock() on all role mutations
