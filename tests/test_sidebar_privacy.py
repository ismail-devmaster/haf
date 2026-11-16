"""Unit tests for sidebar privacy mechanism (F-4)."""

from unittest.mock import AsyncMock, MagicMock
import pytest

from custom_components.domolux_roles.sidebar_privacy import (
    FATHER_ONLY_PANELS,
    SIDEBAR_KEY,
    _FallbackUserStore,
    async_hide_father_only_panels,
)

CHILD_ID = "55555555-5555-4555-8555-555555555555"


@pytest.mark.asyncio
async def test_sidebar_privacy_hides_panels():
    """Verify Father-only panels are added to sidebar.hiddenPanels."""
    hass = MagicMock()
    mock_store = MagicMock()
    mock_store.async_load = AsyncMock(return_value={})
    mock_store.async_save = AsyncMock()

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(
            "homeassistant.helpers.storage.Store",
            lambda _h, _v, _k: mock_store,
        )

        # 1. First run: panels missing -> added
        changed = await async_hide_father_only_panels(hass, CHILD_ID)
        assert changed is True
        assert mock_store.async_save.called
        saved_data = mock_store.async_save.call_args[0][0]
        assert SIDEBAR_KEY in saved_data
        for p in FATHER_ONLY_PANELS:
            assert p in saved_data[SIDEBAR_KEY]["hiddenPanels"]

        # 2. Second run: panels already present -> no change (idempotent)
        mock_store.async_load = AsyncMock(return_value=saved_data)
        mock_store.async_save.reset_mock()
        changed_again = await async_hide_father_only_panels(hass, CHILD_ID)
        assert changed_again is False
        assert not mock_store.async_save.called


@pytest.mark.asyncio
async def test_sidebar_privacy_handles_empty_or_invalid():
    """Verify empty user_id returns False without raising."""
    hass = MagicMock()
    assert await async_hide_father_only_panels(hass, "") is False
    assert await async_hide_father_only_panels(hass, None) is False
