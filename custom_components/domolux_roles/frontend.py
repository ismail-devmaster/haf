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


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register the Domolux Roles frontend panel."""
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

    # Register the panel using Home Assistant's custom panel approach if not already registered
    if PANEL_ID not in hass.data.get("frontend_panels", {}):
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_ID,
            webcomponent_name="ha-config-domolux-roles",
            sidebar_title="Domolux Roles",
            sidebar_icon="mdi:account-cog",
            js_url=f"{js_url_path}/entrypoint.js",
            embed_iframe=False,
            trust_external=False,
            require_admin=True,
            config_panel_domain=DOMAIN,
        )

    _LOGGER.info("Domolux Roles frontend panel registered at %s", js_url_path)


async def async_unregister_frontend(hass: HomeAssistant) -> None:
    """Unregister the Domolux Roles frontend panel."""
    async_remove_panel(hass, PANEL_ID, warn_if_unknown=False)
    _LOGGER.info("Domolux Roles frontend panel unregistered.")
