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

from .api import async_register_websocket_commands, async_register_subscription_command
from .audit import get_audit_log
from .family_api import async_register_family_api_commands
from .family_user_service import DomoluxFamilyUserService
from .frontend import (
    async_register_frontend,
    async_register_revocation_watcher,
    async_unregister_frontend,
    async_unregister_revocation_watcher,
)
from .ha_auth_adapter import DomoluxHAAuthAdapter
from .const import DOMAIN
from .role_manager import DomoluxRoleManager
from .permission_api import async_register_permission_api_commands
from .preview_manager import async_register_preview_commands
from .permission_evaluator import DomoluxPermissionEvaluator
from .read_channel_guard import install_read_channel_guard, uninstall_read_channel_guard
from .registry_guard import install_registry_guard, uninstall_registry_guard
from .revocation import DomoluxRevocationOrchestrator
from .session_registry import (
    DomoluxSessionRegistry,
    async_register_session_registry,
)
from .store import DomoluxRoleStore
from .service_auth_api import async_register_service_auth_commands
from .service_guard import install_service_guard, uninstall_service_guard
from .view_api import async_register_view_api_commands, async_register_catalog_commands
from .view_manager import DomoluxViewManager
from .view_store import DomoluxViewStore

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Domolux Roles integration domain state."""
    hass.data.setdefault(DOMAIN, {})
    async_register_websocket_commands(hass)
    async_register_family_api_commands(hass)
    async_register_permission_api_commands(hass)
    await async_register_view_api_commands(hass)
    async_register_catalog_commands(hass)
    async_register_service_auth_commands(hass)
    async_register_preview_commands(hass)
    async_register_subscription_command(hass)
    await async_register_frontend(hass)
    await async_register_revocation_watcher(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Domolux Roles from a config entry."""
    _LOGGER.info("Initializing Domolux Roles integration (Phase 1 Foundation & Phase 2 Family API)")

    store = DomoluxRoleStore(hass)
    adapter = DomoluxHAAuthAdapter(hass)
    manager = DomoluxRoleManager(hass, store, adapter=adapter)
    family_service = DomoluxFamilyUserService(hass, adapter, store)
    evaluator = DomoluxPermissionEvaluator(hass, store)
    view_store = DomoluxViewStore(hass)
    view_manager = DomoluxViewManager(hass, view_store, manager)
    session_registry = DomoluxSessionRegistry()
    audit_log = get_audit_log(hass)
    revocation = DomoluxRevocationOrchestrator(
        hass,
        store,
        registry=session_registry,
        adapter=adapter,
        audit=audit_log,
    )

    await manager.async_initialize()
    await view_manager.async_initialize()
    await manager.async_reconcile()
    unregister_stop = async_register_session_registry(hass, session_registry)
    bus = getattr(hass, "bus", None)
    if bus is not None and hasattr(bus, "async_listen"):
        async def _on_started(_event):
            # Registry commands may be registered after this integration sets
            # up (they belong to default_config).  Re-wrapping at startup is
            # idempotent and makes the guard independent of load order.
            install_registry_guard(hass)
            await manager.async_reconcile()
        bus.async_listen("homeassistant_started", _on_started)

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "store": store,
        "manager": manager,
        "adapter": adapter,
        "family_service": family_service,
        "evaluator": evaluator,
        "view_store": view_store,
        "view_manager": view_manager,
        "session_registry": session_registry,
        "audit_log": audit_log,
        "revocation": revocation,
        "unregister_stop": unregister_stop,
    }

    install_service_guard(hass)
    install_read_channel_guard(hass)
    install_registry_guard(hass)
    _LOGGER.info("Domolux Roles integration setup completed successfully.")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Domolux Roles config entry cleanly."""
    _LOGGER.info("Unloading Domolux Roles integration")

    if DOMAIN in hass.data and entry.entry_id in hass.data[DOMAIN]:
        data = hass.data[DOMAIN].pop(entry.entry_id)
        store: DomoluxRoleStore = data["store"]
        registry: DomoluxSessionRegistry | None = data.get("session_registry")
        if registry is not None:
            registry.clear()
        unregister_stop = data.get("unregister_stop")
        if callable(unregister_stop):
            unregister_stop()
        # Save any pending role state on unload
        await store.async_save()

    uninstall_read_channel_guard()
    uninstall_registry_guard(hass)
    uninstall_service_guard()
    await async_unregister_revocation_watcher(hass)
    await async_unregister_frontend(hass)

    return True
