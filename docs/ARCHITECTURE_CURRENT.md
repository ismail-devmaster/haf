# Domolux Roles Architecture (Current)

## Modules & Classes

1. **`store.py` (`DomoluxRoleStore`)**: Manages JSON storage (`.storage/domolux_auth`), persistence, revisions, migration, and CRUD for Father, Children, and permissions.
2. **`role_manager.py` (`DomoluxRoleManager`)**: Coordinates role assignments, user lifecycle, and permissions state synchronization.
3. **`permission_evaluator.py` (`DomoluxPermissionEvaluator`)**: Evaluates access (`none`, `read`, `control`) across entity, device, and area hierarchies with Father/Admin overrides.
4. **`ha_auth_adapter.py` (`DomoluxHAAuthAdapter`)**: Integrates with Home Assistant's native auth system (`hass.auth`, user groups like `system-read-only`).
5. **`service_auth_api.py` / `api.py` / `family_api.py` / `permission_api.py` / `view_api.py`**: WebSocket and REST endpoints under `domolux/*`.
6. **`view_store.py` / `view_manager.py`**: Manages dashboard and view access restrictions for Child users.

## WebSocket Commands (`domolux/*`)

- `domolux/family/get`: Returns family state (Father, Children). (Auth: Authenticated user)
- `domolux/permission/get` / `evaluate`: Evaluates or gets permissions. (Auth: Father or Self)
- `domolux/service/authorize`: Evaluates service execution authorization. (Auth: Child/Father)
- `domolux/view/get`: Gets view/dashboard access. (Auth: Authenticated user)

## Storage & State

- `.storage/domolux_auth`: Stores roles, rules, revisions.
- `.storage/domolux_views_data`: Stores dashboard view mappings.
