"""Typed internal models and validation rules for Domolux Roles."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import re
from typing import Any, Optional

from .const import (
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

    version: int = 1
    minor_version: int = 0
    father: Optional[FatherRoleAssignment] = None
    family_members: dict[str, FamilyMemberRecord] = field(default_factory=dict)
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

        metadata = (
            data.get("metadata")
            if isinstance(data.get("metadata"), dict)
            else {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }
        )

        return cls(
            version=int(data.get("version", 1)),
            minor_version=int(data.get("minor_version", 0)),
            father=father_obj,
            family_members=family_members,
            metadata=metadata,
        )
