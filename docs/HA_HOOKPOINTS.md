# HA Hook Points (pinned HA Core 2026.2.3)

- ServiceRegistry.__slots__ = ("_hass", "_services"); hass.services is a plain instance attribute.
- Guard installed by replacing ServiceRegistry.async_call at class level (reversible by identity).
- Originating user carried via Context.user_id; parent_id available on Context.
