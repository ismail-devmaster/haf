Backup and Restore Instructions - Domolux Roles

Backup:

- Copy .storage/domolux_auth to a safe location
- Include the file's JSON content; it contains the single Father user_id and metadata timestamps
- Do NOT back up .storage/auth unless you also require full HA user backups

Restore:

1. Stop Home Assistant
2. Replace .storage/domolux_auth with the backup file
3. Start Home Assistant
4. Open Domolux Roles panel to verify Father assignment restored

Important:

- If the stored user_id no longer exists in HA User Registry, the role will be marked ORPHANED_DELETED on next load (safe fallback)
- If the stored user has been elevated to Admin/Owner, the role is suspended automatically (SUSPENDED_ADMIN)
- Corrupted JSON is detected on load; role resets to UNASSIGNED (fail-safe)
