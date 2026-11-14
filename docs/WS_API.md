# Domolux Roles — WebSocket API Gate Matrix

> Every `domolux/*` command, its required caller role, schema, rate limit, and error codes.
> Adding a new `domolux/*` command **requires** a row in this table, enforced by
> `tests/storage/test_ws_gate_matrix.py` (missing row → CI fails).

## Caller roles

| Role | Meaning |
|------|---------|
| `anonymous` | Not possible on HA WS (authenticated connections only). |
| `child` | Managed family member, non-admin, non-owner, not Father. |
| `father` | The single active Father of the Domolux family. |
| `ex_father` | A user whose Father status was revoked/expired. |
| `admin` | HA Administrator who is **not** bound as Father. |
| `owner` | HA Owner who is **not** bound as Father. |
| `system` | HA system/internal context (never a WS caller; reserved). |

## Gate matrix

| Command | Required role | Mutating? | Rate limit | Error codes |
|---------|--------------|-----------|------------|-------------|
| `domolux/role/get` | any authenticated (self) | no | none | `unauthorized` |
| `domolux/users/list` | admin/owner | no | none | `unauthorized` |
| `domolux/role/set_father` | admin/owner | yes | low | `unauthorized`, `invalid_format`, `unknown_error` |
| `domolux/role/remove_father` | admin/owner | yes | low | `unauthorized`, `unknown_error` |
| `domolux/permission/subscribe` | self or father | no | none | `unauthorized` |
| `domolux/permission/get` | father | no | none | `unauthorized`, `family_user_not_found`, `internal_error` |
| `domolux/permission/set_default_level` | father | yes | medium | `unauthorized`, `invalid_input`, `internal_error` |
| `domolux/permission/set_entity_rule` | father | yes | medium | `unauthorized`, `invalid_input`, `internal_error` |
| `domolux/permission/remove_entity_rule` | father | yes | medium | `unauthorized`, `rule_not_found`, `internal_error` |
| `domolux/permission/set_view_rule` | father | yes | medium | `unauthorized`, `invalid_input`, `internal_error` |
| `domolux/permission/remove_view_rule` | father | yes | medium | `unauthorized`, `rule_not_found`, `internal_error` |
| `domolux/permission/reset` | father | yes | low | `unauthorized`, `internal_error` |
| `domolux/permission/evaluate` | self | no | none | `unauthorized`, `internal_error` |
| `domolux/permission/my_views` | self | no | none | `unauthorized` |
| `domolux/family/list` | father | no | none | `unauthorized`, `internal_error` |
| `domolux/family/create` | father | yes | low | `unauthorized`, `invalid_input`, `duplicate_username`, `permission_denied`, `internal_error` |
| `domolux/family/delete` | father | yes | low | `unauthorized`, `family_user_not_found`, `cannot_target_*`, `internal_error` |
| `domolux/family/disable` | father | yes | low | `unauthorized`, `family_user_not_found`, `cannot_target_*`, `internal_error` |
| `domolux/family/enable` | father | yes | low | `unauthorized`, `family_user_not_found`, `cannot_target_*`, `internal_error` |
| `domolux/family/change_password` | father | yes | low | `unauthorized`, `family_user_not_found`, `cannot_target_*`, `invalid_input`, `internal_error` |
| `domolux/service/authorize` | self | no | medium | `unauthorized`, `service_not_allowed`, `target_invalid`, `service_denied` |
| `domolux/service/enforce` | self | yes | medium | `unauthorized`, `service_not_allowed`, `target_invalid`, `service_denied` |
| `domolux/view/list` | father or self | no | none | `unauthorized`, `internal_error` |
| `domolux/view/get` | father or self | no | none | `unauthorized`, `view_not_found`, `internal_error` |
| `domolux/view/create` | father | yes | low | `unauthorized`, `invalid_input`, `duplicate_view_path`, `internal_error` |
| `domolux/view/update` | father | yes | low | `unauthorized`, `invalid_input`, `view_not_found`, `internal_error` |
| `domolux/view/delete` | father | yes | low | `unauthorized`, `view_not_found`, `internal_error` |
| `domolux/view/subscribe` | self or father | no | none | `unauthorized` |
| `domolux/catalog` | any authenticated | no | none | `unauthorized` |

## Enforcement notes

1. **Identity is server-derived**: `connection.user.id` only; client-supplied `user_id` never establishes identity.
2. **Father ≠ Admin**: HA Admins/Owners who are not bound as Father get `ERR_FATHER_REQUIRED` on family/permission commands.
3. **Target isolation**: family/permission commands reject Admin, Owner, Father, and non-family targets via `_verify_and_get_target_member`.
4. **Atomic multi-target**: `domolux/service/enforce` evaluates every target; any unauthorized target denies the whole request.
5. **No credential echo**: `family/change_password` never returns the password; storage never persists tokens/hashes.
