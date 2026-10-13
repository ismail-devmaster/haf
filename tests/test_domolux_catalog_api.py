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
