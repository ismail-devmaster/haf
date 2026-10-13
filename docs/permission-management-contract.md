# Phase 3 — Parent Permission Management Contract

Commands reused from permission_api.py (existing, tested):
- domolux/permission/get (snapshot of child grants)
- domolux/permission/set_entity_rule (grant/revoke read/control to entity)
- domolux/permission/remove_entity_rule (revoke)
- domolux/permission/set_view_rule (grant/revoke View access)
- domolux/permission/remove_view_rule (revoke)
- domolux/permission/evaluate (effective access check)

New convenience (not inheritance):
- Device selection resolves device -> registry entities -> applies existing entity grants per entity.
- No persistent device-level authorization.
- Zero-entity device -> explicit error.

Authorization: connection.user.id; parent check via _is_father / _require_father.
Response: success/failure with stored result verification (read-after-write via get/evaluate).
