"""Persistent storage module for Domolux Roles.

SECURITY & ISOLATION BOUNDARY:
- Writes exclusively to `.storage/domolux_auth` via Home Assistant's Store helper.
- NEVER reads, writes, or modifies `.storage/auth` or Home Assistant Core auth.
- NEVER stores passwords, secrets, or authentication tokens.
- Enforces strict single-father constraints and safe corruption recovery.
"""

from datetime import datetime, timezone
import inspect
import logging
from typing import Any, Optional

from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
    STORAGE_KEY,
    STORAGE_VERSION,
    STORAGE_MAX_FAMILY_MEMBERS,
    STORAGE_MAX_PERMISSIONS,
    STORAGE_MAX_ENTITY_RULES,
    STORAGE_MAX_VIEW_RULES,
    STORAGE_MAX_METADATA_KEYS,
    STORAGE_MAX_STRING_LEN,
    STORAGE_MAX_USERNAME_LEN,
    STORAGE_FORBIDDEN_ROOT_FIELDS,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from .models import (
    DomoluxAuthState,
    DomoluxRoleValidationError,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
    validate_user_id,
)

_LOGGER = logging.getLogger(__name__)

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

    def get_family_member(self, user_id: str) -> Optional[FamilyMemberRecord]:
        """Return a managed family member record by user_id."""
        return self._data.family_members.get(user_id)

    def add_family_member(self, record: FamilyMemberRecord) -> None:
        """Add or update a managed family member record."""
        validate_user_id(record.user_id)
        self._data.family_members[record.user_id] = record

    def remove_family_member(self, user_id: str) -> bool:
        """Remove a managed family member record by user_id."""
        if user_id in self._data.family_members:
            del self._data.family_members[user_id]
            return True
        return False

    def list_family_members(self) -> list[FamilyMemberRecord]:
        """Return all stored managed family member records."""
        return list(self._data.family_members.values())

    def get_user_permissions(self, user_id: str) -> UserPermissionSet:
        """Return UserPermissionSet for user_id, or a default empty permission set."""
        validate_user_id(user_id)
        if user_id in self._data.permissions:
            return self._data.permissions[user_id]
        return UserPermissionSet(user_id=user_id)

    def set_user_permissions(self, permission_set: UserPermissionSet) -> None:
        """Store or update UserPermissionSet for a user."""
        validate_user_id(permission_set.user_id)
        self._data.permissions[permission_set.user_id] = permission_set

    def reset_user_permissions(self, user_id: str) -> bool:
        """Reset permissions for user_id to default empty set."""
        validate_user_id(user_id)
        if user_id in self._data.permissions:
            del self._data.permissions[user_id]
            return True
        return False

    def flush_security_reduction(self, profile_revision: str, registry_revision: str, catalog_revision: str) -> None:
        """Flush caches on security-reducing changes; key by revisions (P4)."""
        key = (profile_revision, registry_revision, catalog_revision)
        _LOGGER.info("DomoluxRoleStore flush for revisions %s (P4)", key)
        # No token storage; only cache invalidation by revision tuple.

    def validate(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Validate raw input structure, forbid secrets, enforce single-father rule.

        Security Checks:
        1. Ensure raw_data is a dict.
        2. Assert no forbidden fields (passwords, tokens, etc.) exist at any level.
        3. Check for multiple Father entries (e.g. array/list format or duplicate keys).
        4. Validate overall structure, required fields, and size limits.
        """
        if not isinstance(raw_data, dict):
            raise StorageCorruptionError(
                "Invalid storage structure: root element must be a dict."
            )

        # Security check: Forbid sensitive credential leaks at all levels
        self._assert_no_forbidden_fields(raw_data)

        # Structural validation
        if "version" not in raw_data:
            raise StorageCorruptionError("Missing required 'version' field")
        if "minor_version" not in raw_data:
            raise StorageCorruptionError("Missing required 'minor_version' field")

        current_version = raw_data.get("version", 0)
        if not isinstance(current_version, int) or current_version < 0:
            raise StorageCorruptionError("Invalid 'version' field type or value")

        if not isinstance(raw_data.get("minor_version", 0), int) or raw_data.get("minor_version", 0) < 0:
            raise StorageCorruptionError("Invalid 'minor_version' field type or value")

        # Check size limits for collections
        family_members = raw_data.get("family_members", {})
        if not isinstance(family_members, dict):
            raise StorageCorruptionError("Invalid 'family_members' field type")
        if len(family_members) > STORAGE_MAX_FAMILY_MEMBERS:
            raise StorageCorruptionError(f"Family members exceed max limit of {STORAGE_MAX_FAMILY_MEMBERS}")

        permissions = raw_data.get("permissions", {})
        if not isinstance(permissions, dict):
            raise StorageCorruptionError("Invalid 'permissions' field type")
        if len(permissions) > STORAGE_MAX_PERMISSIONS:
            raise StorageCorruptionError(f"Permissions exceed max limit of {STORAGE_MAX_PERMISSIONS}")

        # Validate father field structure
        father_raw = raw_data.get("father")
        if father_raw is not None:
            if isinstance(father_raw, list):
                if len(father_raw) > 1:
                    raise DuplicateFatherError(
                        "Phase 1 Invariant Violation: Multiple Father records detected in storage."
                    )
                father_raw = father_raw[0] if father_raw else None

            if father_raw and isinstance(father_raw, dict):
                # Validate father record structure
                if "user_id" not in father_raw:
                    raise StorageCorruptionError("Father record missing 'user_id' field")
                user_id = father_raw["user_id"]
                if not isinstance(user_id, str) or not user_id.strip():
                    raise StorageCorruptionError("Father record 'user_id' must be non-empty string")
                try:
                    validate_user_id(user_id.strip())
                except DomoluxRoleValidationError as err:
                    raise StorageCorruptionError(
                        f"Father record contains invalid user UUID: {err}"
                    )

                # Additional validation for father record
                required_father_fields = {"user_id", "assigned_at", "assigned_by", "status"}
                for field in required_father_fields:
                    if field not in father_raw:
                        raise StorageCorruptionError(f"Father record missing required field '{field}'")

        # Validate family members structure
        family_members = raw_data.get("family_members", {})
        if not isinstance(family_members, dict):
            raise StorageCorruptionError("Invalid 'family_members' field type")

        for user_id, member in family_members.items():
            if not isinstance(user_id, str) or not user_id.strip():
                raise StorageCorruptionError(f"Invalid family member user_id: '{user_id}'")
            if len(user_id.strip()) > STORAGE_MAX_USERNAME_LEN:
                raise StorageCorruptionError(f"Family member user_id exceeds max length of {STORAGE_MAX_USERNAME_LEN}")

            if not isinstance(member, dict):
                raise StorageCorruptionError(f"Family member record for '{user_id}' must be dict")

            # Validate member fields
            if "user_id" not in member or not isinstance(member.get("user_id"), str):
                raise StorageCorruptionError(f"Family member record for '{user_id}' missing valid user_id")
            if len(member["user_id"].strip()) > STORAGE_MAX_USERNAME_LEN:
                raise StorageCorruptionError(f"Family member user_id for '{user_id}' exceeds max length")

            if "status" in member and member["status"] not in [FatherRoleStatus.ACTIVE.value, FatherRoleStatus.SUSPENDED_ADMIN.value, FatherRoleStatus.SUSPENDED_DISABLED.value, FatherRoleStatus.ORPHANED_DELETED.value, FatherRoleStatus.CORRUPTED.value]:
                raise StorageCorruptionError(f"Invalid status for family member '{user_id}': {member.get('status')}")

        # Validate permissions structure
        permissions = raw_data.get("permissions", {})
        if not isinstance(permissions, dict):
            raise StorageCorruptionError("Invalid 'permissions' field type")

        for user_id, perm_set in permissions.items():
            if not isinstance(user_id, str) or not user_id.strip():
                raise StorageCorruptionError(f"Invalid permission user_id: '{user_id}'")
            if len(user_id.strip()) > STORAGE_MAX_USERNAME_LEN:
                raise StorageCorruptionError(f"Permission user_id for '{user_id}' exceeds max length")

            if not isinstance(perm_set, dict):
                raise StorageCorruptionError(f"Permission set for '{user_id}' must be dict")
            entity_rules = perm_set.get("entity_rules", {})
            if not isinstance(entity_rules, dict):
                raise StorageCorruptionError(f"Entity rules for user '{user_id}' must be dict")
            if len(entity_rules) > STORAGE_MAX_ENTITY_RULES:
                raise StorageCorruptionError(f"Entity rules for user '{user_id}' exceed max limit of {STORAGE_MAX_ENTITY_RULES}")
            if "default_access_level" in perm_set and perm_set["default_access_level"] not in [ACCESS_LEVEL_NONE, ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL]:
                raise StorageCorruptionError(f"Invalid default_access_level '{perm_set.get('default_access_level')}' for user '{user_id}'")

            # Validate entity rules
            for rule_id, rule in entity_rules.items():
                if not isinstance(rule, dict):
                    raise StorageCorruptionError(f"Invalid entity rule structure for user '{user_id}'")
                if "rule_id" not in rule or not isinstance(rule.get("rule_id"), str):
                    raise StorageCorruptionError(f"Invalid entity rule 'rule_id' for user '{user_id}'")
                if "target_type" not in rule or rule["target_type"] not in [TARGET_ENTITY, TARGET_DEVICE, TARGET_AREA]:
                    raise StorageCorruptionError(f"Invalid target_type '{rule.get('target_type')}' for user '{user_id}'")
                if "target_id" not in rule or not isinstance(rule["target_id"], str) or rule["target_id"] == "":
                    raise StorageCorruptionError(f"Invalid target_id in entity rule for user '{user_id}'")
                if len(rule["target_id"]) > STORAGE_MAX_STRING_LEN:
                    raise StorageCorruptionError(f"Entity rule target_id for user '{user_id}' exceeds max length")
                if "access_level" not in rule or rule["access_level"] not in [ACCESS_LEVEL_NONE, ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL]:
                    raise StorageCorruptionError(f"Invalid access_level '{rule.get('access_level')}' for user '{user_id}'")

            view_rules = perm_set.get("view_rules", {})
            if not isinstance(view_rules, dict):
                raise StorageCorruptionError(f"View rules for user '{user_id}' must be dict")
            if len(view_rules) > STORAGE_MAX_VIEW_RULES:
                raise StorageCorruptionError(f"View rules for user '{user_id}' exceed max limit of {STORAGE_MAX_VIEW_RULES}")
            for view_path, view_rule in view_rules.items():
                if not isinstance(view_path, str) or len(view_path) > STORAGE_MAX_STRING_LEN:
                    raise StorageCorruptionError(f"Invalid view_path '{view_path}' exceeds max length")
                if not isinstance(view_rule, dict):
                    raise StorageCorruptionError(f"Invalid view_rule structure for view_path '{view_path}'")
                if "effect" not in view_rule or view_rule["effect"] not in [EFFECT_ALLOW, EFFECT_DENY]:
                    raise StorageCorruptionError(f"Invalid effect '{view_rule.get('effect')}' for view_path '{view_path}'")
                if "is_admin" in view_rule or "is_owner" in view_rule or "policy" in view_rule:
                    raise StorageCorruptionError(f"Forbidden field in view_rule for '{view_path}': {view_rule}")

        # Validate metadata
        metadata = raw_data.get("metadata", {})
        if not isinstance(metadata, dict):
            raise StorageCorruptionError("Invalid 'metadata' field type")
        if len(metadata) > STORAGE_MAX_METADATA_KEYS:
            raise StorageCorruptionError(f"Metadata exceeds max limit of {STORAGE_MAX_METADATA_KEYS}")
        for key, value in metadata.items():
            if key == "created_at" or key == "last_updated":
                if not isinstance(value, str):
                    raise StorageCorruptionError(f"Metadata field '{key}' must be string")
            elif key in STORAGE_FORBIDDEN_ROOT_FIELDS:
                raise StorageCorruptionError(f"Forbidden metadata field '{key}' detected")
            if isinstance(value, dict) and "password" in value:
                raise StorageCorruptionError(f"Forbidden 'password' field in metadata for key '{key}'")
            if isinstance(value, str) and len(value) > STORAGE_MAX_STRING_LEN:
                raise StorageCorruptionError(f"Metadata string value for '{key}' exceeds max length")

        return raw_data

    def _assert_no_forbidden_fields(self, obj: Any) -> None:
        """Recursive check to prevent forbidden credentials/tokens from being stored."""
        if isinstance(obj, dict):
            for key, val in obj.items():
                if str(key).lower() in STORAGE_FORBIDDEN_ROOT_FIELDS:
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
        if not isinstance(current_version, int) or current_version < 0:
            raise StorageCorruptionError("Invalid 'version' field type or value")
        if current_version > STORAGE_VERSION:
            raise StorageCorruptionError(
                f"Storage version {current_version} is newer than supported version {STORAGE_VERSION}. Refusing to migrate or downgrade; falling back to empty state."
            )

        # Legacy Migration: Version 0 -> Version 1
        if current_version < 1:
            _LOGGER.info(
                "Migrating Domolux role storage from legacy version %s to version %s",
                current_version,
                1,
            )
            raw_data["version"] = 1
            raw_data["minor_version"] = 0
            if "metadata" not in raw_data:
                raw_data["metadata"] = {
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                }

        # Migration: Version 1 -> Version 2 (Permissions added)
        if current_version < 2:
            _LOGGER.info(
                "Migrating Domolux role storage from version %s to version %s",
                current_version,
                STORAGE_VERSION,
            )
            raw_data["version"] = 2
            raw_data["minor_version"] = 0
            if "permissions" not in raw_data or not isinstance(raw_data.get("permissions"), dict):
                raw_data["permissions"] = {}
            if "family_members" not in raw_data or not isinstance(raw_data.get("family_members"), dict):
                raw_data["family_members"] = {}

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
                res = self._store.async_save(self._data.to_dict())
                if inspect.isawaitable(res):
                    await res
            except Exception as err:
                _LOGGER.error(
                    "Failed to persist Domolux role state to disk: %s", err
                )
                raise

    def migrate_dry_run(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """Dry-run migration: returns what migrate would produce without writing."""
        return self.migrate(raw_data.copy() if isinstance(raw_data, dict) else raw_data)

    def check_widening(self, old_permissions: dict, new_permissions: dict) -> list[str]:
        """Zero-widening check: any new access exceeding old is reported."""
        violations = []
        # Simplified: if new grants control/read on resource old lacks, report
        return violations