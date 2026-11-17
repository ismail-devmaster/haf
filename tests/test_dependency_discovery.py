"""Tests for Lovelace and Custom Card Entity Dependency Discovery."""

import pytest
from custom_components.domolux_roles.dependency_discovery import (
    extract_entities_from_card,
    extract_entities_from_view,
    extract_entities_from_dashboard,
    is_valid_entity_id,
)


def test_is_valid_entity_id():
    assert is_valid_entity_id("cover.zm108m") is True
    assert is_valid_entity_id("switch.pn16_l3") is True
    assert is_valid_entity_id("light.kitchen") is True
    assert is_valid_entity_id("climate.living_room_ac") is True
    assert is_valid_entity_id("not_an_entity") is False
    assert is_valid_entity_id("unknown_domain.xyz") is False
    assert is_valid_entity_id("") is False
    assert is_valid_entity_id(123) is False


def test_extract_domolux_roller_shade_card():
    """Verify discovery for Domolux roller shade cards using variables.devices[].entity."""
    card = {
        "type": "custom:button-card",
        "name": "Hallway Roller Shade",
        "variables": {
            "devices": [
                {"entity": "cover.zm108m", "name": "Hallway Shade"}
            ]
        },
    }
    entities = extract_entities_from_card(card)
    assert "cover.zm108m" in entities


def test_extract_domolux_light_card():
    """Verify discovery for Domolux light cards using variables.ents[].entity."""
    card = {
        "type": "custom:button-card",
        "name": "Working Space Lights",
        "variables": {
            "ents": [
                {"entity": "light.working_space_light_1"},
                {"entity": "light.working_space_light_2"},
            ]
        },
    }
    entities = extract_entities_from_card(card)
    assert "light.working_space_light_1" in entities
    assert "light.working_space_light_2" in entities


def test_extract_nested_stack_cards():
    """Verify discovery across vertical and horizontal stacks and grids."""
    card = {
        "type": "vertical-stack",
        "cards": [
            {
                "type": "horizontal-stack",
                "cards": [
                    {"type": "tile", "entity": "switch.pn16_l3"},
                    {
                        "type": "custom:button-card",
                        "tap_action": {
                            "action": "call-service",
                            "service": "cover.set_cover_position",
                            "target": {"entity_id": "cover.zm108m"},
                        },
                    },
                ],
            },
            {"type": "entities", "entities": ["climate.living_room_ac"]},
        ],
    }
    entities = extract_entities_from_card(card)
    assert entities == {
        "switch.pn16_l3",
        "cover.zm108m",
        "climate.living_room_ac",
    }


def test_extract_from_sections_view():
    """Verify discovery from modern sections view layout."""
    view = {
        "title": "Sections Overview",
        "path": "sections-view",
        "type": "sections",
        "badges": ["sensor.temperature"],
        "sections": [
            {
                "type": "grid",
                "cards": [
                    {"type": "tile", "entity": "light.office"},
                    {"type": "tile", "entity": "fan.ceiling"},
                ],
            }
        ],
    }
    entities = extract_entities_from_view(view)
    assert entities == {
        "sensor.temperature",
        "light.office",
        "fan.ceiling",
    }


def test_extract_from_complete_dashboard():
    """Verify extraction across multiple views in a dashboard."""
    dashboard = {
        "views": [
            {
                "title": "Home",
                "path": "home",
                "cards": [
                    {"type": "tile", "entity": "light.hallway"},
                ],
            },
            {
                "title": "Working Space",
                "path": "working-space",
                "cards": [
                    {
                        "type": "custom:roller-shade",
                        "variables": {
                            "devices": [{"entity": "cover.zm108m"}]
                        },
                    },
                    {"type": "tile", "entity": "switch.pn16_l3"},
                ],
            },
        ]
    }
    result = extract_entities_from_dashboard(dashboard)
    assert result["home"] == {"light.hallway"}
    assert result["working-space"] == {"cover.zm108m", "switch.pn16_l3"}
