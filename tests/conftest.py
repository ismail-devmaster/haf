"""Pytest configuration and mocks for isolated unit testing of Domolux Roles."""

import sys
from unittest.mock import MagicMock

# Mock voluptuous if not installed in host test env
if "voluptuous" not in sys.modules:
    vol_mock = MagicMock()
    vol_mock.Required = lambda k: k
    vol_mock.Optional = lambda k: k
    vol_mock.Schema = lambda s: s
    sys.modules["voluptuous"] = vol_mock

if "homeassistant" not in sys.modules:
    ha_mock = MagicMock()
    sys.modules["homeassistant"] = ha_mock
    sys.modules["homeassistant.config_entries"] = ha_mock.config_entries
    sys.modules["homeassistant.core"] = ha_mock.core
    sys.modules["homeassistant.data_entry_flow"] = ha_mock.data_entry_flow
    sys.modules["homeassistant.helpers"] = ha_mock.helpers
    sys.modules["homeassistant.helpers.storage"] = ha_mock.helpers.storage
    sys.modules["homeassistant.helpers.typing"] = ha_mock.helpers.typing

    # Mock components & websocket_api
    components_mock = MagicMock()
    ws_mock = MagicMock()
    ws_mock.ERR_UNAUTHORIZED = "unauthorized"
    ws_mock.ERR_INVALID_FORMAT = "invalid_format"
    ws_mock.ERR_UNKNOWN_ERROR = "unknown_error"

    class MockUnauthorized(Exception):
        pass

    ws_mock.Unauthorized = MockUnauthorized

    def mock_websocket_command(schema):
        def decorator(func):
            func._ws_schema = schema
            return func

        return decorator

    def mock_async_response(func):
        return func

    ws_mock.websocket_command = mock_websocket_command
    ws_mock.async_response = mock_async_response

    components_mock.websocket_api = ws_mock
    components_mock.frontend = MagicMock()
    components_mock.panel_custom = MagicMock()
    components_mock.http = MagicMock()
    sys.modules["homeassistant.components"] = components_mock
    sys.modules["homeassistant.components.websocket_api"] = ws_mock
    sys.modules["homeassistant.components.frontend"] = components_mock.frontend
    sys.modules["homeassistant.components.panel_custom"] = components_mock.panel_custom
    sys.modules["homeassistant.components.http"] = components_mock.http

    # Mock ConfigFlow base class
    class MockConfigFlow:
        def __init_subclass__(cls, **kwargs):
            super().__init_subclass__()

        async def _async_set_unique_id(self, unique_id):
            pass

        def _abort_if_unique_id_configured(self):
            pass

        def async_create_entry(self, title, data):
            return {"type": "create_entry", "title": title, "data": data}

        def async_show_form(self, step_id, data_schema):
            return {"type": "form", "step_id": step_id}

    ha_mock.config_entries.ConfigFlow = MockConfigFlow
