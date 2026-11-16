"""Tests for the live permission refresh (revocation watcher) frontend module.

Home Assistant keeps an entity in ``hass.states`` after a permission is
revoked, because it no longer receives state updates for it.  The watcher
module reloads the page when ``domolux_permissions_updated`` targets the
signed-in user, so revoked resources disappear without a manual cache reset.

These tests check that the module is registered with Home Assistant's frontend
and that the shipped JavaScript implements the expected behaviour.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from custom_components.domolux_roles import frontend as domolux_frontend
from custom_components.domolux_roles.const import DOMAIN

MODULE_PATH = (
    Path(domolux_frontend.__file__).parent
    / "frontend"
    / "domolux_revoke_watch.js"
)
MODULE_URL = f"/api/{DOMAIN}/frontend/domolux_revoke_watch.js"


def test_watcher_module_ships_with_the_integration() -> None:
    """The module must exist, otherwise the URL would 404 on every page."""
    assert MODULE_PATH.is_file(), f"missing frontend module {MODULE_PATH}"


def test_watcher_module_is_dependency_free() -> None:
    """The module is served without a build step, so it may not import."""
    source = MODULE_PATH.read_text(encoding="utf-8")
    assert "import " not in source
    assert "require(" not in source


def test_watcher_module_listens_to_the_permission_event() -> None:
    """The module must use the Domolux permission stream.

    Home Assistant refuses `subscribe_events` for custom event types from
    non-admin users, so the dedicated `domolux/permission/subscribe` command is
    the only channel a Child can use.
    """
    source = MODULE_PATH.read_text(encoding="utf-8")
    assert '"domolux/permission/subscribe"' in source
    assert "subscribeMessage" in source
    assert "subscribeEvents" not in source


def test_watcher_module_only_reloads_the_affected_user() -> None:
    """A Father editing a Child must not reload the Father's own page."""
    source = MODULE_PATH.read_text(encoding="utf-8")
    assert "data.user_id !== userId" in source
    assert "window.location.reload()" in source


def test_watcher_module_exposes_a_read_only_test_hook() -> None:
    """The browser suite proves the module loaded through this hook."""
    source = MODULE_PATH.read_text(encoding="utf-8")
    assert "window.__domoluxRevokeWatch" in source
    assert "__domoluxRevokeReloads" in source


async def test_register_revocation_watcher_registers_the_module_url() -> None:
    """Registration adds the module URL to the frontend extra modules."""
    hass = MagicMock()
    with patch.object(domolux_frontend, "add_extra_js_url") as add:
        await domolux_frontend.async_register_revocation_watcher(hass)
    add.assert_called_once_with(hass, MODULE_URL)


async def test_unregister_revocation_watcher_removes_the_module_url() -> None:
    """Unloading the integration removes the module URL again."""
    hass = MagicMock()
    with patch.object(domolux_frontend, "remove_extra_js_url") as remove:
        await domolux_frontend.async_unregister_revocation_watcher(hass)
    remove.assert_called_once_with(hass, MODULE_URL)
