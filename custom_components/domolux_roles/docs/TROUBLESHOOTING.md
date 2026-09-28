Troubleshooting Guide - Domolux Roles

Problem: "Access Denied / غير مصرح" on panel

- Cause: Current HA user is not an Administrator
- Fix: Log in with an HA admin account; only admins can manage Father roles

Problem: No eligible users in dropdown

- Cause: All non-admin users are missing or disabled
- Fix: Create a regular (non-admin, non-owner) HA user first

Problem: Father role not persisting after restart

- Check .storage/domolux_auth exists and is valid JSON
- Check HA logs for "Domolux role storage corruption" errors
- If corrupted, file resets to empty state on load (safe default)

Problem: Father user lost role unexpectedly

- Check if the user was disabled, deleted, or promoted to admin/owner
- Check logs for "Live privilege check failed" or "suspending Father role"
- Restore user's non-admin status or re-assign role

Problem: WebSocket error "Unknown command 'domolux/...'"

- Integration not loaded; check Settings > Integrations for Domolux Roles
- Restart HA if integration was installed while running

Problem: Integration fails to load

- Verify all files in custom_components/domolux_roles/ are present
- Check HA logs for ImportError or syntax errors
- Ensure no manual edits to .storage/auth were made
