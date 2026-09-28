Changelog - Domolux Roles

## 1.0.0 (Phase 1 Release)

- Initial production release of Domolux Father Role system
- Server-side RBAC with single-Father invariant
- WebSocket API: domolux/role/get, users/list, set_father, remove_father
- Isolated persistent storage (.storage/domolux_auth)
- Full fail-closed security: corrupted storage resets safely
- Admin frontend panel (ha-config-domolux-roles)
- Developer identity API (src/data/domolux_roles.ts) with real-time subscription
- 21 backend tests + 10 frontend tests covering security threat model
- Schema migration v0 -> v1 support
- Arabic/English bilingual UI labels

Not implemented (Phase 2):

- Family Manager
- Device/entity permissions
- Room-based permissions
- Multi-user permissions UI
