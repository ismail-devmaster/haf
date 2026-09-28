"""Config flow for Domolux Roles integration."""

import logging
from typing import Any, Optional

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


class DomoluxRolesConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Domolux Roles integration."""

    VERSION = 1

    async def async_step_user(
        self, user_input: Optional[dict[str, Any]] = None
    ) -> FlowResult:
        """Handle the initial step."""
        # Single instance check
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(
                title="Domolux Roles",
                data={},
            )

        return self.async_show_form(
            step_id="user",
            data_schema=None,
        )
