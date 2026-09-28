"""Domolux Roles Home Assistant Custom Integration Foundation.

SECURITY BOUNDARIES & CORE ARCHITECTURE:
- Home Assistant Core handles authentication, passwords, tokens, and admin status.
- Domolux Roles manages application roles ('father', 'user').
- Stored exclusively in isolated key '.storage/domolux_auth'.
- NEVER modifies '.storage/auth' or HA Core authentication framework.
"""

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .api import async_register_websocket_commands
from .frontend import async_register_frontend, async_unregister_frontend
from .const import DOMAIN
from .role_manager import DomoluxRoleManager
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Domolux Roles integration domain state."""
    hass.data.setdefault(DOMAIN, {})
    async_register_websocket_commands(hass)
    await async_register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Domolux Roles from a config entry."""
    _LOGGER.info("Initializing Domolux Roles integration (Phase 1 Foundation)")

    store = DomoluxRoleStore(hass)
    manager = DomoluxRoleManager(hass, store)

    await manager.async_initialize()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "store": store,
        "manager": manager,
    }

    _LOGGER.info("Domolux Roles integration setup completed successfully.")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Domolux Roles config entry cleanly."""
    _LOGGER.info("Unloading Domolux Roles integration")

    if DOMAIN in hass.data and entry.entry_id in hass.data[DOMAIN]:
        data = hass.data[DOMAIN].pop(entry.entry_id)
        store: DomoluxRoleStore = data["store"]
        # Save any pending role state on unload
        await store.async_save()

    await async_unregister_frontend(hass)

    return True
