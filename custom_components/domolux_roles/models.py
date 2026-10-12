"""Typed internal models and validation rules for Domolux Roles."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import re
from typing import Any, Optional

from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
    ROLE_FATHER,
    ROLE_USER,
    STATUS_ACTIVE,
    STATUS_CORRUPTED,
    STATUS_ORPHANED_DELETED,
    STATUS_SUSPENDED_ADMIN,
    STATUS_SUSPENDED_DISABLED,
    STATUS_UNASSIGNED,
)

UUID4_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|"
    r"^[0-9a-f]{32}$",
    re.IGNORECASE,
)


class DomoluxRole(str, Enum):
    """Domolux application roles."""

    FATHER = ROLE_FATHER
    USER = ROLE_USER


class FatherRoleStatus(str, Enum):
    """Lifecycle status of the Father role assignment."""

    UNASSIGNED = STATUS_UNASSIGNED
    ACTIVE = STATUS_ACTIVE
    SUSPENDED_ADMIN = STATUS_SUSPENDED_ADMIN
    SUSPENDED_DISABLED = STATUS_SUSPENDED_DISABLED
    ORPHANED_DELETED = STATUS_ORPHANED_DELETED
    CORRUPTED = STATUS_CORRUPTED


class PermissionAccessLevel(str, Enum):
    """Permission access levels."""
    NONE = ACCESS_LEVEL_NONE
    READ = ACCESS_LEVEL_READ
    CONTROL = ACCESS_LEVEL_CONTROL


class PermissionEffect(str, Enum):
    """Permission effects."""
    ALLOW = EFFECT_ALLOW
    DENY = EFFECT_DENY


class TargetType(str, Enum):
    """Target types for permission rules."""
    ENTITY = TARGET_ENTITY
    DEVICE = TARGET_DEVICE
    AREA = TARGET_AREA


@dataclass
class EntityPermissionRule:
    """Explicit permission rule for an entity, device, or area."""

    rule_id: str
    target_type: str
    target_id: str
    access_level: str
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "access_level": self.access_level,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Optional["EntityPermissionRule"]:
        if not data or not isinstance(data, dict):
            return None
        rule_id = data.get("rule_id")
        target_type = data.get("target_type")
        target_id = data.get("target_id")
        access_level = data.get("access_level")
        if not all([rule_id, target_type, target_id, access_level]):
            return None
        return cls(
            rule_id=str(rule_id),
            target_type=str(target_type),
            target_id=str(target_id),
            access_level=str(access_level),
            created_at=str(data.get("created_at", datetime.now(timezone.utc).isoformat())),
            updated_at=str(data.get("updated_at", datetime.now(timezone.utc).isoformat())),
        )


@dataclass
class ViewPermissionRule:
    """Explicit permission rule for a Lovelace view."""

    view_path: str
    effect: str
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "view_path": self.view_path,
            "effect": self.effect,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Optional["ViewPermissionRule"]:
        if not data or not isinstance(data, dict):
            return None
        view_path = data.get("view_path")
        effect = data.get("effect")
        if not view_path or not effect:
            return None
        return cls(
            view_path=str(view_path),
            effect=str(effect),
            created_at=str(data.get("created_at", datetime.now(timezone.utc).isoformat())),
            updated_at=str(data.get("updated_at", datetime.now(timezone.utc).isoformat())),
        )


@dataclass
class UserPermissionSet:
    """Complete set of permissions for a user."""

    user_id: str
    default_access_level: str = ACCESS_LEVEL_NONE
    entity_rules: dict[str, EntityPermissionRule] = field(default_factory=dict)
    view_rules: dict[str, ViewPermissionRule] = field(default_factory=dict)
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "default_access_level": self.default_access_level,
            "entity_rules": {k: v.to_dict() for k, v in self.entity_rules.items()},
            "view_rules": {k: v.to_dict() for k, v in self.view_rules.items()},
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Optional["UserPermissionSet"]:
        if not data or not isinstance(data, dict):
            return None
        user_id = data.get("user_id")
        if not user_id:
            return None
        entity_rules = {}
        for k, v in (data.get("entity_rules") or {}).items():
            if isinstance(v, dict):
                parsed = EntityPermissionRule.from_dict(v)
                if parsed:
                    entity_rules[k] = parsed

        view_rules = {}
        for k, v in (data.get("view_rules") or {}).items():
            if isinstance(v, dict):
                parsed = ViewPermissionRule.from_dict(v)
                if parsed:
                    view_rules[k] = parsed

        return cls(
            user_id=str(user_id),
            default_access_level=str(data.get("default_access_level", ACCESS_LEVEL_NONE)),
            entity_rules=entity_rules,
            view_rules=view_rules,
            updated_at=str(data.get("updated_at", datetime.now(timezone.utc).isoformat())),
        )

class DomoluxRoleValidationError(Exception):
    """Raised when a role assignment or validation fails."""


# SECURITY BOUNDARY:
# Validation helpers strictly enforce invariants.
# - Father must be identified by stable HA User UUID (never username/display name).
# - Father must NOT be a HA Administrator (is_admin=False) or Owner (is_owner=False).
def validate_user_id(user_id: str) -> str:
    """Validate that user_id is a valid non-empty UUID string."""
    if not isinstance(user_id, str) or not user_id.strip():
        raise DomoluxRoleValidationError("User ID must be a non-empty string.")

    cleaned_id = user_id.strip()
    if not UUID4_PATTERN.match(cleaned_id):
        raise DomoluxRoleValidationError(
            "User ID must be a valid Home Assistant user UUID."
        )
    return cleaned_id


def validate_non_admin_user(is_admin: bool, is_owner: bool) -> None:
    """Ensure target user is neither a Home Assistant Administrator nor Owner.

    SECURITY INVARIANT:
    Domolux 'father' is an application role and MUST NOT overlap with HA Core
    Administrator or Owner status.
    """
    if is_admin or is_owner:
        raise DomoluxRoleValidationError(
            "Security Violation: Father role cannot be assigned to Home Assistant Administrator or Owner users."
        )


@dataclass
class FamilyMemberRecord:
    """Representation of a managed family member record in Domolux."""

    user_id: str
    display_name: str
    username: str
    managed_group_id: str
    status: str = STATUS_ACTIVE
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    permissions_metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.user_id = validate_user_id(self.user_id)

    def to_dict(self) -> dict[str, Any]:
        """Serialize record to primitive dictionary for JSON storage."""
        return {
            "user_id": self.user_id,
            "display_name": self.display_name,
            "username": self.username,
            "managed_group_id": self.managed_group_id,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "permissions_metadata": self.permissions_metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Optional["FamilyMemberRecord"]:
        """Instantiate from primitive dictionary with safe validation."""
        if not data or not isinstance(data, dict):
            return None

        user_id = data.get("user_id")
        display_name = data.get("display_name")
        username = data.get("username")
        managed_group_id = data.get("managed_group_id")

        if not user_id or not display_name or not username or not managed_group_id:
            return None

        try:
            return cls(
                user_id=str(user_id),
                display_name=str(display_name),
                username=str(username),
                managed_group_id=str(managed_group_id),
                status=str(data.get("status", STATUS_ACTIVE)),
                created_at=str(
                    data.get("created_at", datetime.now(timezone.utc).isoformat())
                ),
                updated_at=str(
                    data.get("updated_at", datetime.now(timezone.utc).isoformat())
                ),
                permissions_metadata=data.get("permissions_metadata", {})
                if isinstance(data.get("permissions_metadata"), dict)
                else {},
            )
        except (DomoluxRoleValidationError, ValueError):
            return None


@dataclass
class FatherRoleAssignment:
    """Representation of the single Father role assignment."""

    user_id: str
    assigned_at: str
    assigned_by: str
    status: FatherRoleStatus = FatherRoleStatus.ACTIVE

    def __post_init__(self) -> None:
        self.user_id = validate_user_id(self.user_id)
        if isinstance(self.status, str):
            self.status = FatherRoleStatus(self.status)

    def to_dict(self) -> dict[str, Any]:
        """Serialize assignment to primitive dictionary for JSON storage."""
        return {
            "user_id": self.user_id,
            "assigned_at": self.assigned_at,
            "assigned_by": self.assigned_by,
            "status": self.status.value,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Optional["FatherRoleAssignment"]:
        """Instantiate from primitive dictionary with safe validation."""
        if not data or not isinstance(data, dict):
            return None

        user_id = data.get("user_id")
        if not user_id:
            return None

        try:
            return cls(
                user_id=str(user_id),
                assigned_at=str(
                    data.get(
                        "assigned_at",
                        datetime.now(timezone.utc).isoformat(),
                    )
                ),
                assigned_by=str(data.get("assigned_by", "system")),
                status=FatherRoleStatus(
                    data.get("status", FatherRoleStatus.ACTIVE.value)
                ),
            )
        except (DomoluxRoleValidationError, ValueError):
            return None


@dataclass
class DomoluxAuthState:
    """Root state representation for Domolux Roles persistent storage."""

    version: int = 2
    minor_version: int = 0
    father: Optional[FatherRoleAssignment] = None
    family_members: dict[str, FamilyMemberRecord] = field(default_factory=dict)
    permissions: dict[str, UserPermissionSet] = field(default_factory=dict)
    metadata: dict[str, Any] = field(
        default_factory=lambda: {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
    )

    def to_dict(self) -> dict[str, Any]:
        """Serialize root auth state for persistent storage."""
        return {
            "version": self.version,
            "minor_version": self.minor_version,
            "father": self.father.to_dict() if self.father else None,
            "family_members": {
                k: v.to_dict() for k, v in self.family_members.items()
            },
            "permissions": {
                k: v.to_dict() for k, v in self.permissions.items()
            },
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DomoluxAuthState":
        """Deserialize root state safely with schema validation."""
        if not isinstance(data, dict):
            return cls()

        father_raw = data.get("father")
        father_obj = (
            FatherRoleAssignment.from_dict(father_raw)
            if isinstance(father_raw, dict)
            else None
        )

        family_members_raw = data.get("family_members")
        family_members: dict[str, FamilyMemberRecord] = {}
        if isinstance(family_members_raw, dict):
            for k, v in family_members_raw.items():
                if isinstance(v, dict):
                    rec = FamilyMemberRecord.from_dict(v)
                    if rec:
                        family_members[rec.user_id] = rec

        permissions_raw = data.get("permissions")
        permissions: dict[str, UserPermissionSet] = {}
        if isinstance(permissions_raw, dict):
            for k, v in permissions_raw.items():
                if isinstance(v, dict):
                    rec = UserPermissionSet.from_dict(v)
                    if rec:
                        permissions[rec.user_id] = rec

        metadata = (
            data.get("metadata")
            if isinstance(data.get("metadata"), dict)
            else {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }
        )

        return cls(
            version=int(data.get("version", 2)),
            minor_version=int(data.get("minor_version", 0)),
            father=father_obj,
            family_members=family_members,
            permissions=permissions,
            metadata=metadata,
        )
