Installation Instructions - Domolux Roles

1. Place custom_components/domolux_roles/ in your Home Assistant config directory custom_components/
2. Restart Home Assistant
3. Navigate to Settings > Add-ons > Browse add-on store (or Integrations)
4. Find "Domolux Roles" and click Configure / Install
5. Integration creates .storage/domolux_auth on first save
6. Admin users can access the Domolux Roles panel via Settings > Domolux Roles

Requirements:

- Home Assistant 2024.x+
- Python 3.11+ (bundled with HA OS)
- No additional pip packages required

Post-install verification:

- Check Developer Tools > Events for `domolux_role_changed`
- Admin panel loads with Current Father status card
