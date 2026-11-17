"""Tests for Domolux Roles Catalog API (Phase 2)."""

import pytest
from unittest.mock import MagicMock, patch

from custom_components.domolux_roles.view_api import (
    ws_catalog,
    ERR_UNAUTHORIZED,
    ERR_ACCESS_DENIED,
)

FATHER_ID = "father_123"
CHILD_ID = "child_456"


@pytest.fixture
def mock_hass():
    hass = MagicMock()
    # Mock states
    hass.states.entity_ids = ["light.living_room", "sensor.unregistered"]
    s1 = MagicMock()
    s1.domain = "light"
    s1.state = "on"
    s2 = MagicMock()
    s2.domain = "sensor"
    s2.state = "unavailable"
    hass.states.get.side_effect = lambda eid: s1 if eid == "light.living_room" else (s2 if eid == "sensor.unregistered" else None)
    return hass


@pytest.mark.asyncio
async def test_catalog_father_success(mock_hass):
    """Father retrieves catalog successfully."""
    conn = MagicMock()
    conn.user.id = FATHER_ID
    msg = {"id": 1, "type": "domolux/catalog"}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        
        evaluator = MagicMock()
        evaluator._is_father.return_value = True
        mock_eval.return_value = evaluator

        d_reg = MagicMock()
        d_reg.devices = {}
        mock_dr.return_value = d_reg

        e_reg = MagicMock()
        e_reg.entities = []
        mock_er.return_value = e_reg

        a_reg = MagicMock()
        mock_ar.return_value = a_reg

        await ws_catalog(mock_hass, conn, msg)

        conn.send_result.assert_called_once()
        res = conn.send_result.call_args[0][1]
        assert "catalog" in res
        assert "devices" in res["catalog"]
        assert "entities" in res["catalog"]


@pytest.mark.asyncio
async def test_catalog_child_rejected(mock_hass):
    """Child receives access denied."""
    conn = MagicMock()
    conn.user.id = CHILD_ID
    msg = {"id": 2, "type": "domolux/catalog"}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval:
        evaluator = MagicMock()
        evaluator._is_father.return_value = False
        mock_eval.return_value = evaluator

        await ws_catalog(mock_hass, conn, msg)

        conn.send_error.assert_called_once()
        assert conn.send_error.call_args[0][1] == ERR_ACCESS_DENIED


@pytest.mark.asyncio
async def test_catalog_unauthorized(mock_hass):
    """Unauthenticated connection rejected safely."""
    conn = MagicMock()
    conn.user = None
    msg = {"id": 3, "type": "domolux/catalog"}

    await ws_catalog(mock_hass, conn, msg)

    conn.send_error.assert_called_once()
    assert conn.send_error.call_args[0][1] == ERR_UNAUTHORIZED


@pytest.mark.asyncio
async def test_catalog_disabled_entity_included(mock_hass):
    """Disabled registered entities remain in catalog per documented policy."""
    conn = MagicMock()
    conn.user.id = FATHER_ID
    msg = {"id": 10, "type": "domolux/catalog"}
    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        evaluator = MagicMock(); evaluator._is_father.return_value = True; mock_eval.return_value = evaluator
        d_reg = MagicMock(); d_reg.devices = {}; mock_dr.return_value = d_reg
        entry = MagicMock(); entry.entity_id = "switch.x"; entry.domain = "switch"; entry.disabled_by = "user"; entry.device_id = None; entry.area_id = None; entry.name_by_user = None; entry.original_name = "X"
        e_reg = MagicMock(); e_reg.entities = [entry]; mock_er.return_value = e_reg
        mock_ar.return_value = MagicMock()
        await ws_catalog(mock_hass, conn, msg)
        conn.send_result.assert_called_once()
        ent = conn.send_result.call_args[0][1]["catalog"]["entities"][0]
        assert ent["disabled"] is True
        assert ent["entity_id"] == "switch.x"


@pytest.mark.asyncio
async def test_catalog_forged_user_id_cannot_bypass(mock_hass):
    """Client msg user_id ignored; connection.user.id is authoritative."""
    conn = MagicMock()
    conn.user.id = CHILD_ID  # actual auth is child
    msg = {"id": 99, "type": "domolux/catalog", "user_id": FATHER_ID}  # forged
    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        evaluator = MagicMock(); evaluator._is_father.side_effect = lambda uid: uid == FATHER_ID; mock_eval.return_value = evaluator
        mock_dr.return_value = MagicMock(); d_reg = MagicMock(); d_reg.devices = {}; mock_dr.return_value = d_reg
        mock_er.return_value = MagicMock(); mock_ar.return_value = MagicMock()
        await ws_catalog(mock_hass, conn, msg)
        conn.send_error.assert_called_once()
        # Forged father id in msg is not used; child auth rejected
        assert conn.send_error.call_args[0][1] == ERR_ACCESS_DENIED


@pytest.mark.asyncio
async def test_catalog_no_mutation_no_state_values(mock_hass):
    """Catalog is read-only; response does not contain entity state values."""
    conn = MagicMock()
    conn.user.id = FATHER_ID
    msg = {"id": 42, "type": "domolux/catalog"}
    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        evaluator = MagicMock(); evaluator._is_father.return_value = True; mock_eval.return_value = evaluator
        mock_dr.return_value = MagicMock(); d_reg = MagicMock(); d_reg.devices = {}; mock_dr.return_value = d_reg
        mock_er.return_value = MagicMock(); mock_ar.return_value = MagicMock()
        await ws_catalog(mock_hass, conn, msg)
        res = conn.send_result.call_args[0][1]["catalog"]["entities"]
        # Ensure none of the entries contain raw state value keys
        for entry in res:
            assert "state" not in entry
            assert "attributes" not in entry
            assert "last_updated" not in entry


@pytest.mark.asyncio
async def test_catalog_mapping_entities_and_device_discovery(mock_hass):
    """Real HA EntityRegistryItems is a Mapping: iterating it yields keys, values() yields entries."""
    conn = MagicMock()
    conn.user.id = FATHER_ID
    msg = {"id": 100, "type": "domolux/catalog"}

    # Mock device
    dev = MagicMock()
    dev.id = "dev_kitchen"
    dev.name_by_user = "Kitchen Light Fixture"
    dev.name = "Kitchen Light"
    dev.area_id = "area_kitchen"
    dev.entry_type = None

    # Mock entries belonging to device
    e1 = MagicMock()
    e1.entity_id = "light.kitchen"
    e1.domain = "light"
    e1.disabled_by = None
    e1.device_id = "dev_kitchen"
    e1.area_id = "area_kitchen"
    e1.name_by_user = "Kitchen Main"
    e1.original_name = "Kitchen"

    # Mapping simulating EntityRegistryItems
    entity_mapping = {"light.kitchen": e1}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        evaluator = MagicMock()
        evaluator._is_father.return_value = True
        mock_eval.return_value = evaluator

        d_reg = MagicMock()
        d_reg.devices = {"dev_kitchen": dev}
        mock_dr.return_value = d_reg

        e_reg = MagicMock()
        e_reg.entities = entity_mapping
        mock_er.return_value = e_reg

        a_reg = MagicMock()
        area_obj = MagicMock()
        area_obj.name = "Kitchen"
        a_reg.async_get_area.return_value = area_obj
        mock_ar.return_value = a_reg

        await ws_catalog(mock_hass, conn, msg)

        conn.send_result.assert_called_once()
        catalog = conn.send_result.call_args[0][1]["catalog"]

        assert len(catalog["devices"]) >= 1
        d = next(d for d in catalog["devices"] if d["device_id"] == "dev_kitchen")
        assert d["name"] == "Kitchen Light Fixture"
        assert d["area_name"] == "Kitchen"
        assert d["channels"][0]["entity_id"] == "light.kitchen"
        assert d["channels"][0]["name"] == "Kitchen Main"


@pytest.mark.asyncio
async def test_catalog_dashboard_discovery_including_custom_dashboard_user(mock_hass):
    """Lovelace discovery discovers default Overview and custom dashboards such as dashboard-user with actual views."""
    conn = MagicMock()
    conn.user.id = FATHER_ID
    msg = {"id": 101, "type": "domolux/catalog"}

    # Mock Lovelace custom dashboard: dashboard-user
    dash_user = MagicMock()
    dash_user.config = {
        "title": "Family Dashboard",
        "url_path": "dashboard-user",
        "icon": "mdi:home-heart",
    }
    dash_user_views = {
        "views": [
            {
                "title": "Overview",
                "path": "overview",
                "cards": [
                    {
                        "type": "entities",
                        "entities": ["light.living_room", "switch.fan"],
                    }
                ],
            },
            {
                "title": "Kids Room",
                "path": "kids-room",
                "cards": [
                    {
                        "type": "light",
                        "entity": "light.kids_nightlight",
                    }
                ],
            },
        ]
    }
    dash_user.async_load = MagicMock(return_value=dash_user_views)

    # Mock default overview dashboard in auto-gen mode
    dash_default = MagicMock()
    dash_default.config = None
    dash_default.async_load = MagicMock(side_effect=Exception("auto-gen"))

    mock_lovelace = MagicMock()
    mock_lovelace.dashboards = {
        None: dash_default,
        "dashboard-user": dash_user,
    }
    mock_hass.data = {"lovelace": mock_lovelace}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        evaluator = MagicMock()
        evaluator._is_father.return_value = True
        mock_eval.return_value = evaluator

        d_reg = MagicMock()
        d_reg.devices = {}
        mock_dr.return_value = d_reg

        e_reg = MagicMock()
        e_reg.entities = {}
        mock_er.return_value = e_reg
        mock_ar.return_value = MagicMock()

        await ws_catalog(mock_hass, conn, msg)

        conn.send_result.assert_called_once()
        catalog = conn.send_result.call_args[0][1]["catalog"]
        dashboards = catalog["dashboards"]

        dash_ids = [db["dashboard_id"] for db in dashboards]
        assert "lovelace" in dash_ids
        assert "dashboard-user" in dash_ids

        user_db = next(db for db in dashboards if db["dashboard_id"] == "dashboard-user")
        assert user_db["title"] == "Family Dashboard"
        assert len(user_db["views"]) == 2

        v0 = user_db["views"][0]
        assert v0["view_path"] == "overview"
        assert v0["title"] == "Overview"
        assert "light.living_room" in v0["entities"]

        v1 = user_db["views"][1]
        assert v1["view_path"] == "kids-room"
        assert v1["title"] == "Kids Room"
        assert "light.kids_nightlight" in v1["entities"]


@pytest.mark.asyncio
async def test_catalog_standalone_entity_discovery_without_device_registry(mock_hass):
    """Entities without a valid device registry association are discovered as standalone devices."""
    conn = MagicMock()
    conn.user.id = FATHER_ID
    msg = {"id": 102, "type": "domolux/catalog"}

    # Mock helper/standalone switch
    e_standalone = MagicMock()
    e_standalone.entity_id = "switch.hallway_fan"
    e_standalone.domain = "switch"
    e_standalone.disabled_by = None
    e_standalone.device_id = None
    e_standalone.area_id = None
    e_standalone.name_by_user = "Hallway Fan"
    e_standalone.original_name = None

    entity_mapping = {"switch.hallway_fan": e_standalone}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get") as mock_dr, \
         patch("homeassistant.helpers.entity_registry.async_get") as mock_er, \
         patch("homeassistant.helpers.area_registry.async_get") as mock_ar:
        evaluator = MagicMock()
        evaluator._is_father.return_value = True
        mock_eval.return_value = evaluator

        d_reg = MagicMock()
        d_reg.devices = {}
        mock_dr.return_value = d_reg

        e_reg = MagicMock()
        e_reg.entities = entity_mapping
        mock_er.return_value = e_reg
        mock_ar.return_value = MagicMock()

        await ws_catalog(mock_hass, conn, msg)

        conn.send_result.assert_called_once()
        catalog = conn.send_result.call_args[0][1]["catalog"]

        dev = next(d for d in catalog["devices"] if d["target_id"] == "switch.hallway_fan")
        assert dev["target_type"] == "entity"
        assert dev["name"] == "Hallway Fan"
        assert dev["capabilities"] == ["read", "control"]
        assert dev["channels"][0]["entity_id"] == "switch.hallway_fan"
