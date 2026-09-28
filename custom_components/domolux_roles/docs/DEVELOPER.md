Developer Documentation - Domolux Roles Phase 1

Backend API contract (Phase 2 stable):

- getDomoluxRole(hass) -> Promise<DomoluxRoleInfo>
  - userId: string | null
  - role: DomoluxRole.FATHER | DomoluxRole.USER
  - isFather: boolean
  - isAdmin: boolean
  - isOwner: boolean
  - hasNoDomoluxRole: boolean
  - fatherAssigned: boolean
  - available: boolean
- subscribeDomoluxRole(hass, callback) -> unsubscribe function
- isFatherUser(hass, roleInfo?) -> boolean
- isAdminUser(hass) -> boolean
- isOwnerUser(hass) -> boolean
- hasNoDomoluxRole(roleInfo?) -> boolean

Enums:

- DomoluxRole: FATHER, USER
- FatherRoleStatus: UNASSIGNED, ACTIVE, SUSPENDED_ADMIN, SUSPENDED_DISABLED, ORPHANED_DELETED, CORRUPTED

WebSocket endpoints (server-authoritative):

- domolux/role/get -> { user_id, role, is_father, father_assigned }
- domolux/users/list -> [{ id, name, username }]
- domolux/role/set_father { user_id } -> { success, user_id, status, assigned_at }
- domolux/role/remove_father -> { success, revoked }

Storage:

- Key: .storage/domolux_auth
- Schema version: 1
- Single father record: { user_id, assigned_at, assigned_by, status }

Security rules (do not relax for Phase 2):

- Father MUST NOT be admin or owner
- Role evaluation MUST fail closed on any exception
- All management calls require active HA admin privilege
- Target user MUST exist in HA registry and be non-disabled
