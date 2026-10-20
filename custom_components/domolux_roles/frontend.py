"""Frontend asset serving with correct MIME types for domolux_roles.
SECURITY: resolves inside frontend_dir only; rejects traversal.
"""
import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_remove_panel

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PANEL_ID = "domolux-roles"
PANEL_FAMILY_ID = "domolux-family"
PANEL_DASHBOARD_ID = "domolux-dashboard"
PANEL_MANAGE_ID = "domolux-manage"

# MIME map for chunk/asset files served under /api/domolux_roles/frontend
_MIME_MAP = {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".map": "application/json",
    ".css": "text/css",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def _content_type(path: Path) -> str:
    ext = path.suffix.lower()
    return _MIME_MAP.get(ext, "application/octet-stream")


async def async_register_frontend(hass: HomeAssistant) -> None:
    frontend_dir = Path(__file__).parent / "frontend"
    frontend_dir.mkdir(parents=True, exist_ok=True)

    js_url_path = f"/api/{DOMAIN}/frontend"
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=js_url_path,
            path=str(frontend_dir),
            cache_headers=False,
        )
    ])

    # Brand assets reference /static/images/domolux.png — confirm they exist
    # in build / source, or copy minimal references into served dir.
    # Here we ensure the served directory can hold them; actual files come from build.
    for asset in ("domolux.png", "domolux_dark.png", "favicon.ico"):
        src = Path(__file__).parent / "frontend" / asset
        # If missing, log; do NOT create fake assets; they are build outputs.
        if not src.exists():
            _LOGGER.info("Branding asset %s not yet in frontend dir (expected from build)", asset)

    frontend_panels = hass.data.get("frontend_panels", {})
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

    _LOGGER.info("Domolux Roles frontend registered at %s", js_url_path)


async def async_unregister_frontend(hass: HomeAssistant) -> None:
    async_remove_panel(hass, PANEL_ID, warn_if_unknown=False)
    async_remove_panel(hass, PANEL_FAMILY_ID, warn_if_unknown=False)
    async_remove_panel(hass, PANEL_DASHBOARD_ID, warn_if_unknown=False)
    _LOGGER.info("Domolux Roles frontend unregistered.")


# Explicit content-type helper used when serving via direct handler (if needed)
# Guard against traversal: resolve path, assert under frontend_dir.
async def serve_chunk_safe(request_path: str, frontend_dir: Path) -> tuple[str, str, bytes]:
    target = (frontend_dir / request_path.lstrip("/")).resolve()
    # Path traversal guard
    try:
        target.relative_to(frontend_dir.resolve())
    except ValueError:
        raise ValueError("Traversal blocked")
    data = target.read_bytes()
    return _content_type(target), data
