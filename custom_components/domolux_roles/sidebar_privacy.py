"""Sidebar privacy for managed Children (finding F-4).

The Father-only console panels (``domolux-family`` / ``domolux-manage``) are
registered with ``require_admin=False`` because the Father is a non-admin
account.  Home Assistant has no per-user panel visibility flag, so a Child
would still see the panel names in the sidebar even though the panel itself
renders "Access Denied" and every data endpoint is Father-only.

Home Assistant's supported per-user mechanism for sidebar visibility is the
frontend user-data key ``sidebar.hiddenPanels``.  ``ha-sidebar`` reads it
through ``subscribeFrontendUserData(connection, "sidebar", ...)`` and skips
every panel listed there.  This module writes that key for managed Children.

Security note
-------------
This is a **presentation** control only.  Access control is enforced in the
backend (``family_api`` / ``permission_api``): the panel route still resolves,
the component still renders Access Denied, and no family data is returned to a
non-Father caller.  A Child who edits their own user data to re-show the
entry gains nothing but an empty, denying page.
"""

from __future__ import annotations

import logging
from typing import Any, Iterable

_LOGGER = logging.getLogger(__name__)

# Panels that must never appear in a Child's sidebar.
FATHER_ONLY_PANELS: tuple[str, ...] = ("domolux-family", "domolux-manage")

SIDEBAR_KEY = "sidebar"


async def _user_store(hass: Any, user_id: str) -> Any:
    """Return the frontend user-data store for ``user_id``.

    Uses the public ``frontend.storage`` helper when present and falls back to
    the documented storage key on older Home Assistant versions.
    """
    try:
        from homeassistant.components.frontend.storage import async_user_store

        return await async_user_store(hass, user_id)
    except Exception:
        pass

    from homeassistant.helpers.storage import Store

    store = Store(hass, 1, f"frontend.user_data_{user_id}")
    loaded = await store.async_load() or {}
    return _FallbackUserStore(store, loaded)


class _FallbackUserStore:
    """Minimal stand-in for ``frontend.storage.UserStore``."""

    def __init__(self, store: Any, data: dict[str, Any]) -> None:
        self._store = store
        self.data = data

    async def async_set_item(self, key: str, value: Any) -> None:
        self.data[key] = value
        await self._store.async_save(self.data)


async def async_hide_father_only_panels(hass: Any, user_id: str) -> bool:
    """Add the Father-only panels to a Child's hidden sidebar entries.

    Returns True when the stored value changed.  Best effort: a failure is
    logged and never blocks user creation or reconciliation.
    """
    if not user_id:
        return False
    try:
        store = await _user_store(hass, user_id)
        sidebar = store.data.get(SIDEBAR_KEY)
        if not isinstance(sidebar, dict):
            sidebar = {}
            store.data[SIDEBAR_KEY] = sidebar

        hidden = sidebar.get("hiddenPanels")
        if hidden is None:
            hidden = []
        elif not isinstance(hidden, list):
            hidden = list(hidden)

        missing = [panel for panel in FATHER_ONLY_PANELS if panel not in hidden]
        if not missing:
            return False

        sidebar["hiddenPanels"] = [*hidden, *missing]
        await store.async_set_item(SIDEBAR_KEY, sidebar)
        _LOGGER.info(
            "Hid Father-only sidebar panels for managed user %s: %s",
            user_id,
            ", ".join(missing),
        )
        return True
    except Exception as err:  # pragma: no cover - defensive
        _LOGGER.warning(
            "Could not hide Father-only sidebar panels for %s: %s", user_id, err
        )
        return False


async def async_apply_sidebar_privacy(
    hass: Any, user_ids: Iterable[str] | None = None
) -> int:
    """Apply the hidden sidebar entries to every managed Child.

    ``user_ids`` defaults to the managed family members from the Domolux store.
    Returns the number of users whose stored value changed.
    """
    if user_ids is None:
        user_ids = _managed_user_ids(hass)

    changed = 0
    for user_id in list(user_ids):
        if await async_hide_father_only_panels(hass, user_id):
            changed += 1
    return changed


def _managed_user_ids(hass: Any) -> list[str]:
    from .const import DOMAIN

    container = getattr(hass, "data", {}).get(DOMAIN)
    if not isinstance(container, dict):
        return []
    for value in container.values():
        if isinstance(value, dict) and "store" in value:
            store = value["store"]
            try:
                return [member.user_id for member in store.list_family_members()]
            except Exception:
                return []
    return []
