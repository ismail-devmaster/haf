"""Persistent storage module for Domolux Roles.

SECURITY & ISOLATION BOUNDARY:
- Writes exclusively to `.storage/domolux_auth` via Home Assistant's Store helper.
- NEVER reads, writes, or modifies `.storage/auth` or Home Assistant Core auth.
- NEVER stores passwords, secrets, or authentication tokens.
- Enforces strict single-father constraints and safe corruption recovery.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Optional

from .const import STORAGE_KEY, STORAGE_VERSION
from .models import (
    DomoluxAuthState,
    DomoluxRoleValidationError,
    FatherRoleAssignment,
    FatherRoleStatus,
    validate_user_id,
)

_LOGGER = logging.getLogger(__name__)

FORBIDDEN_FIELDS = {"password", "token", "auth_token", "hash", "secret"}


class StorageCorruptionError(Exception):
    """Raised when stored role data is unparseable or corrupted."""


class DuplicateFatherError(Exception):
    """Raised when stored role data attempts to define multiple Father records."""


class DomoluxRoleStore:
    """Manages persistent storage for Domolux application roles."""

    def __init__(self, hass: Any) -> None:
        self.hass = hass
        self._store = self._init_store(hass)
        self._data: DomoluxAuthState = DomoluxAuthState()

    def _init_store(self, hass: Any) -> Any:
        """Initialize Home Assistant Store helper for domolux_auth key."""
        try:
            from homeassistant.helpers.storage import Store

            return Store(hass, STORAGE_VERSION, STORAGE_KEY)
        except ImportError:
            _LOGGER.debug(
                "homeassistant.helpers.storage.Store not found; using in-memory test storage mode."
            )
            return None

    @property
    def data(self) -> DomoluxAuthState:
        """Return current memory state of Domolux Auth State."""
        return self._data

    def get_father(self) -> Optional[FatherRoleAssignment]:
        """Return the Father assignment if valid and active, else None."""
        if (
            self._data.father
            and self._data.father.status == FatherRoleStatus.ACTIVE
        ):
            return self._data.father
        return None

    def set_father(
        self, father_assignment: Optional[FatherRoleAssignment]
    ) -> None:
        """Set or update the Father assignment in memory."""
        if father_assignment is not None:
            # Validate user_id format
            validate_user_id(father_assignment.user_id)
        self._data.father = father_assignment

    def remove_father(self) -> bool:
        """Safely remove the Father assignment, returning state to UNASSIGNED."""
        if self._data.father is None:
            return False
        self._data.father = None
        return True

    def validate(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Validate raw input structure, forbid secrets, enforce single-father rule.

        Security Checks:
        1. Ensure raw_data is a dict.
        2. Assert no forbidden fields (passwords, tokens, etc.) exist.
        3. Check for multiple Father entries (e.g. array/list format or duplicate keys).
        """
        if not isinstance(raw_data, dict):
            raise StorageCorruptionError(
                "Invalid storage structure: root element must be a dict."
            )

        # Security check: Forbid sensitive credential leaks
        self._assert_no_forbidden_fields(raw_data)

        father_raw = raw_data.get("father")
        if father_raw is not None:
            if isinstance(father_raw, list):
                if len(father_raw) > 1:
                    raise DuplicateFatherError(
                        "Phase 1 Invariant Violation: Multiple Father records detected in storage."
                    )
                father_raw = father_raw[0] if father_raw else None

            if father_raw and isinstance(father_raw, dict):
                user_id = father_raw.get("user_id")
                if not user_id or not isinstance(user_id, str):
                    raise StorageCorruptionError(
                        "Father record missing valid user_id string."
                    )
                try:
                    validate_user_id(user_id)
                except DomoluxRoleValidationError as err:
                    raise StorageCorruptionError(
                        f"Father record contains invalid user UUID: {err}"
                    ) from err

        return raw_data

    def _assert_no_forbidden_fields(self, obj: Any) -> None:
        """Recursive check to prevent forbidden credentials/tokens from being stored."""
        if isinstance(obj, dict):
            for key, val in obj.items():
                if str(key).lower() in FORBIDDEN_FIELDS:
                    raise StorageCorruptionError(
                        f"Security Violation: Storage contains forbidden field '{key}'."
                    )
                self._assert_no_forbidden_fields(val)
        elif isinstance(obj, list):
            for item in obj:
                self._assert_no_forbidden_fields(item)

    def migrate(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Execute schema migrations for legacy or updated storage formats."""
        if not isinstance(raw_data, dict):
            return raw_data

        current_version = raw_data.get("version", 0)

        # Legacy Migration: Version 0 -> Version 1
        if current_version < 1:
            _LOGGER.info(
                "Migrating Domolux role storage from legacy version %s to version %s",
                current_version,
                STORAGE_VERSION,
            )
            raw_data["version"] = 1
            raw_data["minor_version"] = 0
            if "metadata" not in raw_data:
                raw_data["metadata"] = {
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                }

        return raw_data

    async def async_load(self) -> DomoluxAuthState:
        """Load, validate, migrate, and hydrate Domolux Auth State from disk."""
        if self._store is None:
            return self._data

        try:
            raw_data = await self._store.async_load()
            if raw_data is None:
                _LOGGER.info(
                    "No existing Domolux role storage file found. Initializing new unassigned store."
                )
                self._data = DomoluxAuthState()
                return self._data

            # 1. Migration Step
            migrated_data = self.migrate(raw_data)

            # 2. Validation Step
            validated_data = self.validate(migrated_data)

            # 3. Hydration Step
            self._data = DomoluxAuthState.from_dict(validated_data)

        except (
            StorageCorruptionError,
            DuplicateFatherError,
            DomoluxRoleValidationError,
        ) as err:
            _LOGGER.error(
                "Domolux role storage corruption or safety failure: %s. "
                "Failing safely: resetting state to UNASSIGNED without granting privileges.",
                err,
            )
            self._data = DomoluxAuthState()
        except Exception as err:
            _LOGGER.error(
                "Unexpected storage read error for key '%s': %s. "
                "Failing safely: resetting state to UNASSIGNED.",
                STORAGE_KEY,
                err,
            )
            self._data = DomoluxAuthState()

        return self._data

    async def async_save(self) -> None:
        """Persist current state atomically using HA Store helper."""
        self._data.metadata[
            "last_updated"
        ] = datetime.now(timezone.utc).isoformat()
        if self._store is not None:
            try:
                # Pre-save validation
                self.validate(self._data.to_dict())
                await self._store.async_save(self._data.to_dict())
            except Exception as err:
                _LOGGER.error(
                    "Failed to persist Domolux role state to disk: %s", err
                )
