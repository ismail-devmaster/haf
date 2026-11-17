"""Lovelace Dashboard & Custom Card Entity Dependency Discovery.

Extracts all entity dependencies throughout complete Lovelace dashboard configurations,
including nested structures, custom cards, variables (e.g. variables.devices[].entity,
variables.ents[].entity), custom_fields, sections, badges, and action targets.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

# Standard Home Assistant entity format: domain.entity_name
ENTITY_ID_RE = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")

# Template entity extraction: states['...'], states("..."), states.<domain>.<name>
TEMPLATE_ENTITY_RE = re.compile(
    r"""states(?:\[['"]([a-z0-9_]+\.[a-z0-9_]+)['"]\]|\(['"]([a-z0-9_]+\.[a-z0-9_]+)['"]\))"""
)

# Known user-facing household & sensor domains in Home Assistant
VALID_DOMAINS = frozenset(
    {
        "light",
        "switch",
        "cover",
        "climate",
        "fan",
        "lock",
        "media_player",
        "vacuum",
        "camera",
        "humidifier",
        "water_heater",
        "valve",
        "sensor",
        "binary_sensor",
        "number",
        "select",
        "button",
        "input_boolean",
        "input_number",
        "input_select",
        "input_button",
        "input_datetime",
        "weather",
        "scene",
        "alarm_control_panel",
        "siren",
    }
)


def is_valid_entity_id(val: Any) -> bool:
    """Return True if val is a string matching standard HA entity format in a valid domain."""
    if not isinstance(val, str):
        return False
    val = val.strip().lower()
    if not ENTITY_ID_RE.match(val):
        return False
    domain = val.split(".", 1)[0]
    return domain in VALID_DOMAINS


# Standard keys that contain service calls or metadata rather than entities
IGNORE_KEYS = frozenset(
    {
        "service",
        "action",
        "type",
        "icon",
        "layout",
        "view_layout",
        "aspect_ratio",
        "theme",
        "font_family",
        "color",
    }
)


def extract_entities_from_card(card: Any) -> set[str]:
    """Recursively extract all referenced entity IDs from a card configuration.

    Supports:
    - Standard card `entity: string`
    - Standard card `entities: [string | {entity: string}]`
    - Domolux roller shade cards: `variables.devices[].entity`
    - Domolux light cards: `variables.ents[].entity`
    - Nested cards: `cards`, `card`, `sections`
    - Action targets: `tap_action.target.entity_id`, `service_data.entity_id`, etc.
    - Template expressions mentioning `states('...')` or `states['...']`
    """
    discovered: set[str] = set()

    def _walk(obj: Any, parent_key: str | None = None) -> None:
        if parent_key in IGNORE_KEYS:
            return

        if isinstance(obj, str):
            candidate = obj.strip().lower()
            if is_valid_entity_id(candidate):
                discovered.add(candidate)
            else:
                for match in TEMPLATE_ENTITY_RE.finditer(candidate):
                    for group in match.groups():
                        if group and is_valid_entity_id(group):
                            discovered.add(group.lower())
            return

        if isinstance(obj, list):
            for item in obj:
                _walk(item, parent_key)
            return

        if isinstance(obj, dict):
            # Check common entity-holding keys directly
            for key in ("entity", "entity_id", "camera_image"):
                val = obj.get(key)
                if isinstance(val, str) and is_valid_entity_id(val):
                    discovered.add(val.strip().lower())
                elif isinstance(val, list):
                    for v in val:
                        if isinstance(v, str) and is_valid_entity_id(v):
                            discovered.add(v.strip().lower())

            # Specific handling for Domolux custom card variables
            variables = obj.get("variables")
            if isinstance(variables, dict):
                # variables.devices[].entity (Roller shade card)
                devices = variables.get("devices")
                if isinstance(devices, list):
                    for d in devices:
                        if isinstance(d, dict) and "entity" in d:
                            e = d["entity"]
                            if isinstance(e, str) and is_valid_entity_id(e):
                                discovered.add(e.strip().lower())
                # variables.ents[].entity (Light card)
                ents = variables.get("ents")
                if isinstance(ents, list):
                    for e_obj in ents:
                        if isinstance(e_obj, dict) and "entity" in e_obj:
                            e = e_obj["entity"]
                            if isinstance(e, str) and is_valid_entity_id(e):
                                discovered.add(e.strip().lower())

            # Recurse through all dictionary values
            for k, v in obj.items():
                _walk(v, str(k).lower())

    _walk(card)
    return discovered


def extract_entities_from_view(view_config: dict[str, Any]) -> set[str]:
    """Extract all referenced entity IDs from a single Lovelace view configuration."""
    if not isinstance(view_config, dict):
        return set()

    entities: set[str] = set()

    # Cards in standard or masonry/grid views
    for card in view_config.get("cards", []):
        entities.update(extract_entities_from_card(card))

    # Badges
    for badge in view_config.get("badges", []):
        if isinstance(badge, str) and is_valid_entity_id(badge):
            entities.add(badge.strip().lower())
        elif isinstance(badge, dict):
            entities.update(extract_entities_from_card(badge))

    # Sections view (HA modern layout)
    for section in view_config.get("sections", []):
        if isinstance(section, dict):
            for card in section.get("cards", []):
                entities.update(extract_entities_from_card(card))

    return entities


def extract_entities_from_dashboard(
    dashboard_config: dict[str, Any]
) -> dict[str, set[str]]:
    """Extract entities grouped by view_path from a complete Lovelace dashboard configuration.

    Returns mapping: view_path -> set of entity IDs.
    """
    if not isinstance(dashboard_config, dict):
        return {}

    result: dict[str, set[str]] = {}
    views = dashboard_config.get("views", [])
    if not isinstance(views, list):
        return {}

    for idx, view in enumerate(views):
        if not isinstance(view, dict):
            continue
        # View path can be explicit or fallback to string index
        path = str(view.get("path") or idx).strip().lower()
        result[path] = extract_entities_from_view(view)

    return result
