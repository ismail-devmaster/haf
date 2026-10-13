# Domolux Catalog API — Phase 2 Contract

Command: `domolux/catalog` (read-only)
Auth: father only (connection.user.id, not msg param)
Request: `{"type":"domolux/catalog"}`
Response: `{"catalog":{"devices":[...],"entities":[...]}}`

Device fields: device_id, name, area_id, area_name, entity_count.
Entity fields: entity_id, name, domain, device_id, device_name, area_id, area_name, registry_managed, disabled, state_available, unavailable.
Excluded: state value, attributes, context, auth data, registry unique IDs, secrets.
Discovery: registry (device/entity/area) + state-machine merge; deduplicated; sorted.
No mutation; no default view creation; no permission grant.
