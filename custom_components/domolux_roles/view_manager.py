"""View Manager service for Domolux Protected Views and Cards.

SECURITY HARDENING & INVARIANTS:
1. Server-Side Father Authorization: ALL view mutations (create, update, delete) enforce authentic Father role server-side.
2. Non-Father Denial: Non-Father users (including HA Admins and Owners who are not Father) are denied mutation operations.
3. Thread-Safe State Mutations: All mutations synchronized using an asyncio.Lock().
4. Data Integrity: Enforces view_path uniqueness, schema validity, script sanitization, and credential field exclusion.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Optional
import uuid

from .models import DomoluxRole, validate_user_id
from .role_manager import DomoluxRoleManager
from .view_models import (
    DomoluxCardConfig,
    DomoluxLayoutType,
    DomoluxView,
    DomoluxViewValidationError,
)
from .view_store import DuplicateViewPathError, DomoluxViewStore

_LOGGER = logging.getLogger(__name__)


class DomoluxFatherRequiredError(Exception):
    """Raised when a non-Father user attempts a View mutation operation."""


class DomoluxViewNotFoundError(Exception):
    """Raised when a requested View ID does not exist."""


class DomoluxViewManager:
    """Manages thread-safe CRUD operations for Domolux Views and Cards."""

    def __init__(
        self,
        hass: Any,
        view_store: DomoluxViewStore,
        role_manager: DomoluxRoleManager,
    ) -> None:
        self.hass = hass
        self.view_store = view_store
        self.role_manager = role_manager
        self._lock = asyncio.Lock()

    async def async_initialize(self) -> None:
        """Load stored views from disk atomically."""
        async with self._lock:
            await self.view_store.async_load()

    def _assert_father_role(self, caller_user_id: str) -> None:
        """Enforce server-side Father role validation."""
        valid_id = validate_user_id(caller_user_id)
        role = self.role_manager.get_user_role(valid_id)
        if role != DomoluxRole.FATHER:
            raise DomoluxFatherRequiredError(
                f"Security Violation: User '{caller_user_id}' does not possess the Father role. "
                "View mutation operations require active Father privileges."
            )

    def get_view(self, view_id: str) -> Optional[DomoluxView]:
        """Read-only fetch of a view by view_id."""
        return self.view_store.get_view(view_id)

    def get_view_by_path(self, view_path: str) -> Optional[DomoluxView]:
        """Read-only fetch of a view by normalized view_path."""
        return self.view_store.get_view_by_path(view_path)

    def list_views(self) -> list[DomoluxView]:
        """Read-only listing of all stored views."""
        return self.view_store.list_views()

    async def async_create_view(
        self,
        caller_user_id: str,
        title: str,
        view_path: str,
        icon: str = "mdi:view-dashboard",
        layout: str = DomoluxLayoutType.GRID.value,
        cards: Optional[list[dict[str, Any]]] = None,
    ) -> DomoluxView:
        """Create a new protected Domolux View (Father-only)."""
        async with self._lock:
            self._assert_father_role(caller_user_id)

            view_id = str(uuid.uuid4())
            parsed_cards = (
                [DomoluxCardConfig.from_dict(c) for c in cards] if cards else []
            )

            now_iso = datetime.now(timezone.utc).isoformat()
            view = DomoluxView(
                view_id=view_id,
                view_path=view_path,
                title=title,
                created_by=caller_user_id,
                icon=icon,
                layout=layout,
                cards=parsed_cards,
                created_at=now_iso,
                updated_at=now_iso,
            )

            self.view_store.add_view(view)
            await self.view_store.async_save()

            _LOGGER.info(
                "Created Domolux View '%s' (path: %s, ID: %s) by Father user %s",
                title,
                view.view_path,
                view_id,
                caller_user_id,
            )
            return view

    async def async_update_view(
        self,
        caller_user_id: str,
        view_id: str,
        updates: dict[str, Any],
    ) -> DomoluxView:
        """Update an existing protected Domolux View (Father-only)."""
        async with self._lock:
            self._assert_father_role(caller_user_id)

            existing = self.view_store.get_view(view_id)
            if existing is None:
                raise DomoluxViewNotFoundError(f"View with ID '{view_id}' not found.")

            # Prevent updating immutable fields
            if "view_id" in updates and updates["view_id"] != view_id:
                raise DomoluxViewValidationError("View ID is immutable and cannot be changed.")

            current_dict = existing.to_dict()
            # Merge non-None update fields
            for key, val in updates.items():
                if key not in ("view_id", "created_at", "created_by") and val is not None:
                    current_dict[key] = val

            current_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

            updated_view = DomoluxView.from_dict(current_dict)
            self.view_store.add_view(updated_view)
            await self.view_store.async_save()

            _LOGGER.info(
                "Updated Domolux View ID %s by Father user %s",
                view_id,
                caller_user_id,
            )
            return updated_view

    async def async_delete_view(self, caller_user_id: str, view_id: str) -> bool:
        """Delete an existing protected Domolux View (Father-only)."""
        async with self._lock:
            self._assert_father_role(caller_user_id)

            existing = self.view_store.get_view(view_id)
            if existing is None:
                raise DomoluxViewNotFoundError(f"View with ID '{view_id}' not found.")

            removed = self.view_store.remove_view(view_id)
            if removed:
                await self.view_store.async_save()
                _LOGGER.info(
                    "Deleted Domolux View ID %s by Father user %s",
                    view_id,
                    caller_user_id,
                )
            return removed

    async def async_add_card_to_view(
        self,
        caller_user_id: str,
        view_id: str,
        card_data: dict[str, Any],
    ) -> DomoluxCardConfig:
        """Add a new card to a view (Father-only)."""
        async with self._lock:
            self._assert_father_role(caller_user_id)

            existing = self.view_store.get_view(view_id)
            if existing is None:
                raise DomoluxViewNotFoundError(f"View with ID '{view_id}' not found.")

            card = DomoluxCardConfig.from_dict(card_data)
            existing.cards.append(card)
            existing.updated_at = datetime.now(timezone.utc).isoformat()

            await self.view_store.async_save()
            return card

    async def async_remove_card_from_view(
        self,
        caller_user_id: str,
        view_id: str,
        card_id: str,
    ) -> bool:
        """Remove a card from a view by card_id (Father-only)."""
        async with self._lock:
            self._assert_father_role(caller_user_id)

            existing = self.view_store.get_view(view_id)
            if existing is None:
                raise DomoluxViewNotFoundError(f"View with ID '{view_id}' not found.")

            original_len = len(existing.cards)
            existing.cards = [c for c in existing.cards if c.card_id != card_id]

            if len(existing.cards) < original_len:
                existing.updated_at = datetime.now(timezone.utc).isoformat()
                await self.view_store.async_save()
                return True
            return False
