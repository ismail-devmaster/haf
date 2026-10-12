"""Persistent storage module for Domolux Protected Views and Cards.

SECURITY & ISOLATION BOUNDARY:
- Writes exclusively to `.storage/domolux_views_data` via Home Assistant's Store helper.
- NEVER reads, writes, or modifies Home Assistant Core dashboards or Lovelace files.
- NEVER stores passwords, secrets, or authentication tokens.
- Enforces strict view_path uniqueness and safe corruption recovery.
"""

from datetime import datetime, timezone
import inspect
import logging
from typing import Any, Optional

from .const import VIEWS_STORAGE_KEY, VIEWS_STORAGE_VERSION
from .view_models import (
    DomoluxView,
    DomoluxViewValidationError,
    assert_no_forbidden_fields,
)

_LOGGER = logging.getLogger(__name__)


class ViewStorageCorruptionError(Exception):
    """Raised when stored Domolux View data is corrupted or unparseable."""


class DuplicateViewPathError(Exception):
    """Raised when multiple views share the same view_path."""


class DomoluxViewStore:
    """Manages persistent storage for Domolux Views and Cards."""

    def __init__(self, hass: Any) -> None:
        self.hass = hass
        self._store = self._init_store(hass)
        self._views: dict[str, DomoluxView] = {}
        self._metadata: dict[str, Any] = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "version": VIEWS_STORAGE_VERSION,
        }

    def _init_store(self, hass: Any) -> Any:
        """Initialize Home Assistant Store helper for domolux_views_data key."""
        try:
            from homeassistant.helpers.storage import Store

            return Store(hass, VIEWS_STORAGE_VERSION, VIEWS_STORAGE_KEY)
        except ImportError:
            _LOGGER.debug(
                "homeassistant.helpers.storage.Store not found; using in-memory test storage mode."
            )
            return None

    @property
    def views(self) -> dict[str, DomoluxView]:
        """Return in-memory dict of view_id -> DomoluxView."""
        return self._views

    def get_view(self, view_id: str) -> Optional[DomoluxView]:
        """Get a view by view_id."""
        return self._views.get(view_id)

    def get_view_by_path(self, view_path: str) -> Optional[DomoluxView]:
        """Get a view by normalized view_path."""
        cleaned_path = view_path.strip().lower()
        for view in self._views.values():
            if view.view_path == cleaned_path:
                return view
        return None

    def add_view(self, view: DomoluxView) -> None:
        """Add or update a view in memory, checking for view_path collisions."""
        cleaned_path = view.view_path.strip().lower()
        for existing_id, existing_view in self._views.items():
            if existing_id != view.view_id and existing_view.view_path == cleaned_path:
                raise DuplicateViewPathError(
                    f"A view with view_path '{cleaned_path}' already exists (ID: {existing_id})."
                )
        self._views[view.view_id] = view

    def remove_view(self, view_id: str) -> bool:
        """Remove a view from memory by view_id."""
        if view_id in self._views:
            del self._views[view_id]
            return True
        return False

    def list_views(self) -> list[DomoluxView]:
        """Return all views stored in memory."""
        return list(self._views.values())

    def validate(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Validate raw input structure, forbid secrets, enforce view_path uniqueness."""
        if not isinstance(raw_data, dict):
            raise ViewStorageCorruptionError(
                "Invalid storage structure: root element must be a dict."
            )

        # Security check: Forbid sensitive credential leaks
        try:
            assert_no_forbidden_fields(raw_data, "views_storage")
        except DomoluxViewValidationError as err:
            raise ViewStorageCorruptionError(f"Security check failed: {err}") from err

        views_raw = raw_data.get("views")
        if views_raw is not None:
            if not isinstance(views_raw, (dict, list)):
                raise ViewStorageCorruptionError("'views' field must be a dictionary or list.")

            seen_paths: set[str] = set()
            views_iterable = views_raw.values() if isinstance(views_raw, dict) else views_raw

            for view_item in views_iterable:
                if not isinstance(view_item, dict):
                    raise ViewStorageCorruptionError("Each view item must be a dictionary.")

                path = view_item.get("view_path")
                if not path or not isinstance(path, str):
                    raise ViewStorageCorruptionError("View item missing valid 'view_path'.")

                norm_path = path.strip().lower()
                if norm_path in seen_paths:
                    raise DuplicateViewPathError(
                        f"Duplicate view_path '{norm_path}' detected in storage payload."
                    )
                seen_paths.add(norm_path)

        return raw_data

    def migrate(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Execute schema migrations for view storage."""
        if not isinstance(raw_data, dict):
            return raw_data

        current_version = raw_data.get("version", 0)
        if current_version < 1:
            _LOGGER.info(
                "Migrating Domolux View storage from version %s to version %s",
                current_version,
                VIEWS_STORAGE_VERSION,
            )
            raw_data["version"] = VIEWS_STORAGE_VERSION
            if "views" not in raw_data or not isinstance(raw_data["views"], (dict, list)):
                raw_data["views"] = {}
            if "metadata" not in raw_data:
                raw_data["metadata"] = {
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                }

        return raw_data

    def to_dict(self) -> dict[str, Any]:
        """Serialize store data to dict format."""
        return {
            "version": VIEWS_STORAGE_VERSION,
            "metadata": self._metadata,
            "views": {v_id: v.to_dict() for v_id, v in self._views.items()},
        }

    async def async_load(self) -> dict[str, DomoluxView]:
        """Load, validate, migrate, and hydrate Domolux Views from disk."""
        if self._store is None:
            return self._views

        try:
            raw_data = await self._store.async_load()
            if raw_data is None:
                _LOGGER.info(
                    "No existing Domolux View storage file found. Initializing new empty store."
                )
                self._views = {}
                return self._views

            # 1. Migration Step
            migrated_data = self.migrate(raw_data)

            # 2. Validation Step
            validated_data = self.validate(migrated_data)

            # 3. Hydration Step
            views_raw = validated_data.get("views") or {}
            self._views = {}

            if isinstance(views_raw, dict):
                for v_id, v_data in views_raw.items():
                    v_obj = DomoluxView.from_dict(v_data)
                    self._views[v_obj.view_id] = v_obj
            elif isinstance(views_raw, list):
                for v_data in views_raw:
                    v_obj = DomoluxView.from_dict(v_data)
                    self._views[v_obj.view_id] = v_obj

            if "metadata" in validated_data and isinstance(validated_data["metadata"], dict):
                self._metadata = validated_data["metadata"]

        except (
            ViewStorageCorruptionError,
            DuplicateViewPathError,
            DomoluxViewValidationError,
        ) as err:
            _LOGGER.error(
                "Domolux View storage corruption or safety failure: %s. "
                "Failing safely: resetting View store to empty.",
                err,
            )
            self._views = {}
        except Exception as err:
            _LOGGER.error(
                "Unexpected View storage read error for key '%s': %s. "
                "Failing safely: resetting View store to empty.",
                VIEWS_STORAGE_KEY,
                err,
            )
            self._views = {}

        return self._views

    async def async_save(self) -> None:
        """Persist current view store state atomically using HA Store helper."""
        self._metadata["last_updated"] = datetime.now(timezone.utc).isoformat()
        if self._store is not None:
            payload = self.to_dict()
            try:
                # Pre-save validation
                self.validate(payload)
                res = self._store.async_save(payload)
                if inspect.isawaitable(res):
                    await res
            except Exception as err:
                _LOGGER.error("Failed to persist Domolux View state to disk: %s", err)
                raise
