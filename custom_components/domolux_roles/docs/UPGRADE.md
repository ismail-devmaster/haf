Upgrade Instructions - Domolux Roles

Phase 1 schema is versioned (STORAGE_VERSION = 1). Storage migration from v0 to v1 runs automatically via DomoluxRoleStore.migrate().

Upgrade steps:

1. Stop Home Assistant
2. Replace custom_components/domolux_roles/ files with new version
3. Start Home Assistant
4. Verify integration loads without errors (check logs for "Domolux Roles integration setup completed successfully")
5. Check .storage/domolux_auth loads correctly via Developer Tools > States

Compatibility:

- No breaking changes in Phase 1
- WebSocket API endpoint names unchanged
- Frontend identity API (src/data/domolux_roles.ts) stable for Phase 2 consumption

Rolling back:

- Revert files to previous version; storage is backward compatible (validate/migrate handles older formats)
