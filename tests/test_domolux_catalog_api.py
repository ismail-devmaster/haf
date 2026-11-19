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


# ==============================================================================
# Realistic Home Assistant Registry Test Doubles (No MagicMock Runtime Leakage)
# ==============================================================================

from collections.abc import Mapping
from dataclasses import dataclass, field


@dataclass
class RealLikeRegistryEntry:
    entity_id: str
    device_id: str | None = None
    area_id: str | None = None
    name: str | None = None
    name_by_user: str | None = None
    original_name: str | None = None
    disabled_by: str | None = None
    platform: str = "test_integration"

    @property
    def domain(self) -> str:
        return self.entity_id.split(".")[0]


@dataclass
class RealLikeDeviceEntry:
    id: str
    name: str | None = None
    name_by_user: str | None = None
    model: str | None = None
    manufacturer: str | None = None
    area_id: str | None = None
    entry_type: str | None = None
    disabled_by: str | None = None


@dataclass
class RealLikeAreaEntry:
    id: str
    name: str


@dataclass
class RealLikeState:
    entity_id: str
    state: str
    attributes: dict[str, Any] = field(default_factory=dict)


class RealLikeEntityRegistryItems(Mapping):
    """Accurately models Home Assistant Core's EntityRegistryItems Mapping."""

    def __init__(self, entries: dict[str, RealLikeRegistryEntry]) -> None:
        self._data = dict(entries)

    def __getitem__(self, key: str) -> RealLikeRegistryEntry:
        return self._data[key]

    def __iter__(self):
        return iter(self._data)

    def __len__(self) -> int:
        return len(self._data)

    def values(self):
        return self._data.values()

    def get_entries_for_device_id(
        self, device_id: str, include_disabled_entities: bool = False
    ) -> list[RealLikeRegistryEntry]:
        return [
            entry
            for entry in self._data.values()
            if entry.device_id == device_id
            and (include_disabled_entities or not entry.disabled_by)
        ]


class RealLikeDeviceRegistryItems(Mapping):
    """Accurately models Home Assistant Core's DeviceRegistryItems Mapping."""

    def __init__(self, devices: dict[str, RealLikeDeviceEntry]) -> None:
        self._data = dict(devices)

    def __getitem__(self, key: str) -> RealLikeDeviceEntry:
        return self._data[key]

    def __iter__(self):
        return iter(self._data)

    def __len__(self) -> int:
        return len(self._data)

    def values(self):
        return self._data.values()

    def get(self, device_id: str) -> RealLikeDeviceEntry | None:
        return self._data.get(device_id)


class RealLikeEntityRegistry:
    def __init__(self, entries: dict[str, RealLikeRegistryEntry]) -> None:
        self.entities = RealLikeEntityRegistryItems(entries)


class RealLikeDeviceRegistry:
    def __init__(self, devices: dict[str, RealLikeDeviceEntry]) -> None:
        self.devices = RealLikeDeviceRegistryItems(devices)

    def async_get(self, device_id: str) -> RealLikeDeviceEntry | None:
        return self.devices.get(device_id)


class RealLikeAreaRegistry:
    def __init__(self, areas: dict[str, RealLikeAreaEntry]) -> None:
        self._areas = dict(areas)

    def async_get_area(self, area_id: str | None) -> RealLikeAreaEntry | None:
        if not area_id:
            return None
        return self._areas.get(area_id)


class RealLikeConnection:
    """Minimal realistic active connection without MagicMock side-effects."""

    def __init__(self, user_id: str | None = None) -> None:
        self.user = type("User", (), {"id": user_id})() if user_id else None
        self.results: list[dict[str, Any]] = []
        self.errors: list[tuple[int, str, str]] = []

    def send_result(self, msg_id: int, result: dict[str, Any]) -> None:
        self.results.append({"id": msg_id, "result": result})

    def send_error(self, msg_id: int, code: str, message: str) -> None:
        self.errors.append((msg_id, code, message))


class RealLikeHass:
    """Minimal realistic Home Assistant instance."""

    def __init__(
        self,
        states: dict[str, RealLikeState],
        data: dict[str, Any] | None = None,
    ) -> None:
        self._states = dict(states)
        self.data = data or {}

        class _States:
            def __init__(outer):
                outer._s = self._states

            def get(outer, eid: str) -> RealLikeState | None:
                return outer._s.get(eid)

            def async_entity_ids(outer) -> list[str]:
                return list(outer._s.keys())

        self.states = _States()


@pytest.mark.asyncio
async def test_catalog_realistic_registry_objects_with_empty_device_no_magicmock_error():
    """Exact reproduction of production failure condition with realistic HA 2026.8.3 objects.

    Includes:
    - Real-like EntityRegistryItems mapping and DeviceRegistryItems mapping.
    - Device with multiple controllable entities.
    - Device with NO entities (the exact trigger that threw NameError: MagicMock in prod).
    - Service entry type device (properly excluded).
    - Non-household keyword device (properly excluded).
    - Standalone registry entity without a device.
    - State-machine-only entity not in registry.
    - Custom Lovelace dashboard with views and card dependencies.
    - Verifies Father gets full catalog without any NameError or exceptions.
    """
    areas = {
        "living_room": RealLikeAreaEntry(id="living_room", name="Living Room"),
        "kitchen": RealLikeAreaEntry(id="kitchen", name="Kitchen"),
    }
    area_reg = RealLikeAreaRegistry(areas)

    devices = {
        # Normal controllable household device
        "dev_living_light": RealLikeDeviceEntry(
            id="dev_living_light",
            name_by_user="Living Room Main Lights",
            name="Hue Ceiling",
            area_id="living_room",
        ),
        # Empty device with NO entities (triggers empty raw_entries fallback)
        "dev_empty_hub": RealLikeDeviceEntry(
            id="dev_empty_hub",
            name="Zigbee Coordinator Hub",
            area_id="living_room",
        ),
        # Service device (must be excluded)
        "dev_backup_service": RealLikeDeviceEntry(
            id="dev_backup_service",
            name="Backup Manager Service",
            entry_type="service",
        ),
        # Non-household name device (must be excluded)
        "dev_tailscale": RealLikeDeviceEntry(
            id="dev_tailscale",
            name="Tailscale VPN Gateway",
        ),
    }
    dev_reg = RealLikeDeviceRegistry(devices)

    entities = {
        "light.living_ceiling_1": RealLikeRegistryEntry(
            entity_id="light.living_ceiling_1",
            device_id="dev_living_light",
            area_id="living_room",
            name_by_user="Spot 1",
            original_name="Spot 1",
        ),
        "light.living_ceiling_2": RealLikeRegistryEntry(
            entity_id="light.living_ceiling_2",
            device_id="dev_living_light",
            area_id="living_room",
            name_by_user="Spot 2",
            original_name="Spot 2",
        ),
        # Standalone entity without device_id
        "switch.kitchen_fan": RealLikeRegistryEntry(
            entity_id="switch.kitchen_fan",
            device_id=None,
            area_id="kitchen",
            name_by_user="Kitchen Exhaust",
        ),
    }
    ent_reg = RealLikeEntityRegistry(entities)

    states = {
        "light.living_ceiling_1": RealLikeState(
            entity_id="light.living_ceiling_1",
            state="on",
            attributes={"friendly_name": "Living Ceiling Spot 1"},
        ),
        "light.living_ceiling_2": RealLikeState(
            entity_id="light.living_ceiling_2",
            state="off",
            attributes={"friendly_name": "Living Ceiling Spot 2"},
        ),
        "switch.kitchen_fan": RealLikeState(
            entity_id="switch.kitchen_fan",
            state="off",
            attributes={"friendly_name": "Kitchen Exhaust Fan"},
        ),
        # Unregistered entity in state machine
        "sensor.outdoor_temperature": RealLikeState(
            entity_id="sensor.outdoor_temperature",
            state="21.5",
            attributes={"friendly_name": "Outdoor Temperature"},
        ),
        # Non-household entity in state machine
        "sensor.samba_status": RealLikeState(
            entity_id="sensor.samba_status",
            state="connected",
            attributes={"friendly_name": "Samba Share Status"},
        ),
    }

    # Custom Lovelace dashboard
    class RealLikeDashboard:
        def __init__(self, config: dict[str, Any]) -> None:
            self._config = config

        async def async_load(self, force: bool = False) -> dict[str, Any]:
            return self._config

    dash_user = RealLikeDashboard({
        "title": "Family User Dashboard",
        "views": [
            {
                "path": "living",
                "title": "Living Area",
                "cards": [
                    {"type": "entities", "entities": ["light.living_ceiling_1"]},
                ],
            },
            {
                "path": "climate",
                "title": "Climate Controls",
                "cards": [
                    {"type": "button", "entity": "switch.kitchen_fan"},
                ],
            },
        ],
    })

    lovelace_data = type("LovelaceData", (), {
        "dashboards": {
            None: RealLikeDashboard({"title": "Home", "views": []}),
            "dashboard-user": dash_user,
        }
    })()

    hass = RealLikeHass(states=states, data={"lovelace": lovelace_data})
    conn = RealLikeConnection(user_id=FATHER_ID)
    msg = {"id": 1, "type": "domolux/catalog"}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get", return_value=dev_reg), \
         patch("homeassistant.helpers.entity_registry.async_get", return_value=ent_reg), \
         patch("homeassistant.helpers.area_registry.async_get", return_value=area_reg):
        evaluator = MagicMock()
        evaluator._is_father.return_value = True
        mock_eval.return_value = evaluator

        # Execute ws_catalog — must NOT throw NameError: MagicMock is not defined
        await ws_catalog(hass, conn, msg)

    assert len(conn.errors) == 0, f"Unexpected error: {conn.errors}"
    assert len(conn.results) == 1
    catalog = conn.results[0]["result"]["catalog"]

    # 1. Device discovery verification
    devices_result = catalog["devices"]
    device_ids = [d["device_id"] for d in devices_result]
    device_names = [d["name"] for d in devices_result]

    # Controllable household device with 2 channels
    assert "dev_living_light" in device_ids
    living_dev = next(d for d in devices_result if d["device_id"] == "dev_living_light")
    assert living_dev["name"] == "Living Room Main Lights"
    assert living_dev["area_name"] == "Living Room"
    assert living_dev["is_multi_entity"] is True
    assert len(living_dev["channels"]) == 2
    assert living_dev["capabilities"] == ["read", "control"]
    assert "light.living_ceiling_1" in living_dev["entities"]
    assert "light.living_ceiling_2" in living_dev["entities"]

    # Empty device (0 entities) handled gracefully without failure
    assert "dev_empty_hub" in device_ids
    empty_dev = next(d for d in devices_result if d["device_id"] == "dev_empty_hub")
    assert empty_dev["entity_count"] == 0
    assert empty_dev["channels"] == []

    # Excluded devices
    assert "dev_backup_service" not in device_ids
    assert "dev_tailscale" not in device_ids
    assert not any("tailscale" in name.lower() for name in device_names)
    assert not any("backup manager" in name.lower() for name in device_names)

    # Standalone entity discovery
    assert "entity:switch.kitchen_fan" in device_ids
    standalone_dev = next(d for d in devices_result if d["device_id"] == "entity:switch.kitchen_fan")
    assert standalone_dev["target_type"] == "entity"
    assert standalone_dev["target_id"] == "switch.kitchen_fan"
    assert standalone_dev["name"] == "Kitchen Exhaust"
    assert standalone_dev["area_name"] == "Kitchen"
    assert standalone_dev["capabilities"] == ["read", "control"]

    # State-only entity discovery
    assert "entity:sensor.outdoor_temperature" in device_ids
    outdoor_dev = next(d for d in devices_result if d["device_id"] == "entity:sensor.outdoor_temperature")
    assert outdoor_dev["target_type"] == "entity"
    assert outdoor_dev["capabilities"] == ["read"]

    # Non-household state entity excluded
    assert "entity:sensor.samba_status" not in device_ids

    # 2. Dashboard and view discovery
    dashboards = catalog["dashboards"]
    dash_ids = [db["dashboard_id"] for db in dashboards]
    assert "lovelace" in dash_ids
    assert "dashboard-user" in dash_ids

    user_dash = next(db for db in dashboards if db["dashboard_id"] == "dashboard-user")
    assert len(user_dash["views"]) == 2
    assert user_dash["views"][0]["view_path"] == "living"
    assert user_dash["views"][0]["title"] == "Living Area"
    assert "light.living_ceiling_1" in user_dash["views"][0]["entities"]
    assert user_dash["views"][1]["view_path"] == "climate"
    assert "switch.kitchen_fan" in user_dash["views"][1]["entities"]


@pytest.mark.asyncio
async def test_catalog_realistic_registry_child_access_denied():
    """Child receives access denied with realistic registry and ActiveConnection."""
    ent_reg = RealLikeEntityRegistry({})
    dev_reg = RealLikeDeviceRegistry({})
    area_reg = RealLikeAreaRegistry({})
    hass = RealLikeHass(states={})
    conn = RealLikeConnection(user_id=CHILD_ID)
    msg = {"id": 10, "type": "domolux/catalog"}

    with patch("custom_components.domolux_roles.view_api._get_evaluator") as mock_eval, \
         patch("homeassistant.helpers.device_registry.async_get", return_value=dev_reg), \
         patch("homeassistant.helpers.entity_registry.async_get", return_value=ent_reg), \
         patch("homeassistant.helpers.area_registry.async_get", return_value=area_reg):
        evaluator = MagicMock()
        evaluator._is_father.return_value = False
        mock_eval.return_value = evaluator

        await ws_catalog(hass, conn, msg)

    assert len(conn.results) == 0
    assert len(conn.errors) == 1
    assert conn.errors[0][1] == ERR_ACCESS_DENIED
    assert conn.errors[0][2] == "Catalog access requires father role."


@pytest.mark.asyncio
async def test_catalog_realistic_registry_unauthorized_user():
    """Unauthenticated connection receives unauthorized error with realistic objects."""
    hass = RealLikeHass(states={})
    conn = RealLikeConnection(user_id=None)
    msg = {"id": 11, "type": "domolux/catalog"}

    await ws_catalog(hass, conn, msg)

    assert len(conn.results) == 0
    assert len(conn.errors) == 1
    assert conn.errors[0][1] == ERR_UNAUTHORIZED

