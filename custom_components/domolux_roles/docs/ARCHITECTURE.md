Domolux Architecture

- custom_components/domolux_roles/ (backend)
  - __init__.py: integration lifecycle
  - const.py: domain, storage key, version, roles, status constants
  - models.py: data models (DomoluxRole, FatherRoleAssignment, FatherRoleStatus), validation helpers
  - store.py: isolated .storage/domolux_auth persistence, validation, migration, corruption recovery
  - role_manager.py: single-father invariant, asyncio.Lock concurrency, fail-closed live evaluation
  - api.py: WebSocket RPC endpoints (domolux/role/get, users/list, set_father, remove_father)
  - config_flow.py: single-instance UI config flow
- src/panels/config/domolux-roles/ (frontend panel)
  - ha-config-domolux-roles.ts: LitElement admin panel
- src/data/domolux_roles.ts: developer-facing identity API
- tests/: 21 pytest backend unit tests + 10 Vitest frontend identity tests
