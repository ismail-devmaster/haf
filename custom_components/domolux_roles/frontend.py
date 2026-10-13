"""Frontend panel registration for Domolux Roles."""

import logging
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PANEL_ID = "domolux-roles"
PANEL_FAMILY_ID = "domolux-family"
PANEL_DASHBOARD_ID = "domolux-dashboard"
PANEL_MANAGE_ID = "domolux-manage"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register the Domolux Roles, Family Manager, and Dashboard frontend panels."""
    # Define where the compiled JS will reside
    frontend_dir = Path(__file__).parent / "frontend"
    frontend_dir.mkdir(parents=True, exist_ok=True)

    # Register the static path so HA serves the files
    js_url_path = f"/api/{DOMAIN}/frontend"
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=js_url_path,
            path=str(frontend_dir),
            cache_headers=False,
        )
    ])

    frontend_panels = hass.data.get("frontend_panels", {})

    # 1. Register Admin Domolux Roles Config Panel (require_admin=True)
    if PANEL_ID not in frontend_panels:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_ID,
            webcomponent_name="ha-config-domolux-roles",
            sidebar_title="Domolux Roles",
            sidebar_icon="mdi:account-cog",
            js_url=f"{js_url_path}/entrypoint.js",
            embed_iframe=True,
            trust_external=False,
            require_admin=True,
            config_panel_domain=DOMAIN,
        )

    # 2. Register Father Family Manager Panel (require_admin=False)
    if PANEL_FAMILY_ID not in frontend_panels:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_FAMILY_ID,
            webcomponent_name="ha-domolux-family-manager",
            sidebar_title="Family Manager / إدارة العائلة",
            sidebar_icon="mdi:account-group",
            js_url=f"{js_url_path}/entrypoint.js",
            embed_iframe=True,
            trust_external=False,
            require_admin=False,
            config_panel_domain=DOMAIN,
        )

    # 3. Register Domolux Dashboard Container Panel (require_admin=False)
    if PANEL_DASHBOARD_ID not in frontend_panels:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_DASHBOARD_ID,
            webcomponent_name="ha-domolux-dashboard",
            sidebar_title="Domolux Dashboard",
            sidebar_icon="mdi:shield-home",
            js_url=f"{js_url_path}/entrypoint.js",
            embed_iframe=True,
            trust_external=False,
            require_admin=False,
            config_panel_domain=DOMAIN,
        )

    # 4. Parent Management Console (route /domolux-manage — standalone panel)
    if PANEL_MANAGE_ID not in frontend_panels:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_MANAGE_ID,
            webcomponent_name="ha-domolux-family-manager",
            sidebar_title="Parent Console / إدارة الوالدين",
            sidebar_icon="mdi:shield-account",
            js_url=f"{js_url_path}/entrypoint.js",
            embed_iframe=True,
            trust_external=False,
            require_admin=False,
            config_panel_domain=DOMAIN,
        )

    _LOGGER.info("Domolux Roles, Family Manager & Dashboard frontend panels registered at %s", js_url_path)


async def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Unregister the Domolux Roles, Family Manager & Dashboard frontend panels."""
    async_remove_panel(hass, PANEL_ID, warn_if_unknown=False)
    async_remove_panel(hass, PANEL_FAMILY_ID, warn_if_unknown=False)
    async_remove_panel(hass, PANEL_DASHBOARD_ID, warn_if_unknown=False)
    _LOGGER.info("Domolux Roles, Family Manager & Dashboard frontend panels unregistered.")
