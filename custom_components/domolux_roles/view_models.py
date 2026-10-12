"""Typed data models and strict validation rules for Domolux Protected Views and Cards.

SECURITY & VALIDATION INVARIANTS:
1. View paths must be normalized alphanumeric strings with hyphens (^[a-z0-9-]+$).
2. Card types must be one of the supported Domolux card types.
3. Entity IDs must match Home Assistant standard entity ID format (domain.name).
4. No forbidden fields (passwords, tokens, secrets, hashes) in serialized content or options.
5. No executable HTML/script injection payload strings permitted in text attributes.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import re
from typing import Any, Optional
import uuid

from .const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_READ
from .models import UUID4_PATTERN, validate_user_id

VIEW_PATH_PATTERN = re.compile(r"^[a-z0-9-]+$")
ENTITY_ID_PATTERN = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
EXECUTABLE_CONTENT_PATTERN = re.compile(
    r"<script\b|<iframe\b|<style\b|javascript:|onload=|onerror=|<html\b|<body\b|data:text/html",
    re.IGNORECASE,
)

FORBIDDEN_FIELDS = {"password", "token", "auth_token", "hash", "secret"}


class DomoluxViewValidationError(Exception):
    """Raised when a Domolux View or Card schema validation fails."""


class DomoluxLayoutType(str, Enum):
    """Supported Domolux View layouts."""

    GRID = "grid"
    MASONRY = "masonry"
    SECTIONS = "sections"
    SINGLE_COLUMN = "single-column"


class DomoluxCardType(str, Enum):
    """Supported Domolux Card types."""

    ENTITY = "entity"
    ENTITIES = "entities"
    GLANCE = "glance"
    SENSOR_GRAPH = "sensor_graph"
    MEDIA_CONTROL = "media_control"
    ALARM_CONTROL = "alarm_control"
    MARKDOWN = "markdown"


def validate_view_path(view_path: str) -> str:
    """Validate and normalize view_path."""
    if not isinstance(view_path, str) or not view_path.strip():
        raise DomoluxViewValidationError("View path must be a non-empty string.")

    cleaned = view_path.strip().lower()
    if not VIEW_PATH_PATTERN.match(cleaned):
        raise DomoluxViewValidationError(
            f"Invalid view path '{cleaned}'. View path must consist of lowercase alphanumeric characters and hyphens."
        )
    return cleaned


def validate_entity_id(entity_id: str) -> str:
    """Validate Home Assistant entity_id format."""
    if not isinstance(entity_id, str) or not entity_id.strip():
        raise DomoluxViewValidationError("Entity ID must be a non-empty string.")

    cleaned = entity_id.strip().lower()
    if not ENTITY_ID_PATTERN.match(cleaned):
        raise DomoluxViewValidationError(
            f"Invalid entity ID '{cleaned}'. Must match format 'domain.entity_name'."
        )
    return cleaned


def sanitize_text(text: str, field_name: str = "text") -> str:
    """Check text field for executable HTML/script tags."""
    if not isinstance(text, str):
        return str(text)

    if EXECUTABLE_CONTENT_PATTERN.search(text):
        raise DomoluxViewValidationError(
            f"Security Violation: Executable HTML/script payload detected in field '{field_name}'."
        )
    return text


def assert_no_forbidden_fields(obj: Any, path: str = "root") -> None:
    """Recursively check object for forbidden credential/secret field names."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            k_str = str(k).lower()
            if k_str in FORBIDDEN_FIELDS:
                raise DomoluxViewValidationError(
                    f"Security Violation: Forbidden credential field '{k}' found at path '{path}'."
                )
            assert_no_forbidden_fields(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            assert_no_forbidden_fields(item, f"{path}[{idx}]")


@dataclass
class DomoluxEntityBinding:
    """Binding between a card and a Home Assistant entity."""

    entity_id: str
    name_override: Optional[str] = None
    icon_override: Optional[str] = None
    required_access: str = ACCESS_LEVEL_READ

    def __post_init__(self) -> None:
        self.entity_id = validate_entity_id(self.entity_id)
        if self.name_override:
            self.name_override = sanitize_text(self.name_override, "name_override")
        if self.icon_override:
            self.icon_override = sanitize_text(self.icon_override, "icon_override")

        if self.required_access not in (ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL):
            raise DomoluxViewValidationError(
                f"Invalid required_access '{self.required_access}'. Must be 'read' or 'control'."
            )

    def to_dict(self) -> dict[str, Any]:
        """Serialize entity binding to primitive dict."""
        res: dict[str, Any] = {
            "entity_id": self.entity_id,
            "required_access": self.required_access,
        }
        if self.name_override:
            res["name_override"] = self.name_override
        if self.icon_override:
            res["icon_override"] = self.icon_override
        return res

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DomoluxEntityBinding":
        """Instantiate entity binding safely from dict."""
        if not data or not isinstance(data, dict):
            raise DomoluxViewValidationError("Entity binding data must be a dictionary.")

        assert_no_forbidden_fields(data, "entity_binding")

        entity_id = data.get("entity_id")
        if not entity_id:
            raise DomoluxViewValidationError("Entity binding missing 'entity_id'.")

        return cls(
            entity_id=str(entity_id),
            name_override=str(data["name_override"]) if data.get("name_override") else None,
            icon_override=str(data["icon_override"]) if data.get("icon_override") else None,
            required_access=str(data.get("required_access", ACCESS_LEVEL_READ)),
        )


@dataclass
class DomoluxCardConfig:
    """Configuration schema for a card within a Domolux View."""

    card_id: str
    card_type: str
    title: Optional[str] = None
    entities: list[DomoluxEntityBinding] = field(default_factory=list)
    options: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        # Validate UUID
        if not isinstance(self.card_id, str) or not UUID4_PATTERN.match(self.card_id.strip()):
            raise DomoluxViewValidationError(
                f"Card ID '{self.card_id}' must be a valid UUID4 string."
            )
        self.card_id = self.card_id.strip()

        # Validate card_type
        valid_card_types = [t.value for t in DomoluxCardType]
        if self.card_type not in valid_card_types:
            raise DomoluxViewValidationError(
                f"Invalid card_type '{self.card_type}'. Supported card types are {valid_card_types}."
            )

        if self.title:
            self.title = sanitize_text(self.title, "card title")

        assert_no_forbidden_fields(self.options, "card options")

        # Type-specific validation rules
        self._validate_card_options()

    def _validate_card_options(self) -> None:
        """Enforce card-type specific options validation."""
        if self.card_type in (
            DomoluxCardType.ENTITY.value,
            DomoluxCardType.ENTITIES.value,
            DomoluxCardType.GLANCE.value,
            DomoluxCardType.SENSOR_GRAPH.value,
            DomoluxCardType.MEDIA_CONTROL.value,
            DomoluxCardType.ALARM_CONTROL.value,
        ):
            if not self.entities:
                raise DomoluxViewValidationError(
                    f"Card of type '{self.card_type}' requires at least one entity binding."
                )

        if self.card_type == DomoluxCardType.MARKDOWN.value:
            content = self.options.get("content", "")
            if not content or not isinstance(content, str):
                raise DomoluxViewValidationError(
                    "Markdown card options must contain non-empty string field 'content'."
                )
            sanitize_text(content, "markdown content")

    def to_dict(self) -> dict[str, Any]:
        """Serialize card config to primitive dict."""
        return {
            "card_id": self.card_id,
            "card_type": self.card_type,
            "title": self.title,
            "entities": [e.to_dict() for e in self.entities],
            "options": self.options,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DomoluxCardConfig":
        """Instantiate card config safely from dict."""
        if not data or not isinstance(data, dict):
            raise DomoluxViewValidationError("Card data must be a dictionary.")

        assert_no_forbidden_fields(data, "card_config")

        card_id = data.get("card_id")
        if not card_id:
            card_id = str(uuid.uuid4())

        card_type = data.get("card_type")
        if not card_type:
            raise DomoluxViewValidationError("Card config missing 'card_type'.")

        entities_raw = data.get("entities") or []
        if not isinstance(entities_raw, list):
            raise DomoluxViewValidationError("Card entities must be a list.")

        entities = [DomoluxEntityBinding.from_dict(e) for e in entities_raw]

        options = data.get("options") or {}
        if not isinstance(options, dict):
            raise DomoluxViewValidationError("Card options must be a dictionary.")

        title = str(data["title"]) if data.get("title") else None

        return cls(
            card_id=str(card_id),
            card_type=str(card_type),
            title=title,
            entities=entities,
            options=options,
        )


@dataclass
class DomoluxView:
    """Data model representing a protected Domolux View."""

    view_id: str
    view_path: str
    title: str
    created_by: str
    icon: str = "mdi:view-dashboard"
    layout: str = DomoluxLayoutType.GRID.value
    cards: list[DomoluxCardConfig] = field(default_factory=list)
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def __post_init__(self) -> None:
        # Validate immutable UUID
        if not isinstance(self.view_id, str) or not UUID4_PATTERN.match(self.view_id.strip()):
            raise DomoluxViewValidationError(
                f"View ID '{self.view_id}' must be a valid UUID4 string."
            )
        self.view_id = self.view_id.strip()

        # Validate view_path
        self.view_path = validate_view_path(self.view_path)

        # Validate title
        if not isinstance(self.title, str) or not self.title.strip():
            raise DomoluxViewValidationError("View title must be a non-empty string.")
        self.title = sanitize_text(self.title.strip(), "view title")

        # Validate created_by
        if self.created_by != "system":
            self.created_by = validate_user_id(self.created_by)

        # Validate icon
        if self.icon:
            self.icon = sanitize_text(self.icon.strip(), "view icon")

        # Validate layout
        valid_layouts = [l.value for l in DomoluxLayoutType]
        if self.layout not in valid_layouts:
            raise DomoluxViewValidationError(
                f"Invalid layout '{self.layout}'. Supported layouts are {valid_layouts}."
            )

    def to_dict(self) -> dict[str, Any]:
        """Serialize view to primitive dict."""
        return {
            "view_id": self.view_id,
            "view_path": self.view_path,
            "title": self.title,
            "icon": self.icon,
            "layout": self.layout,
            "cards": [c.to_dict() for c in self.cards],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "created_by": self.created_by,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DomoluxView":
        """Instantiate view safely from dict."""
        if not data or not isinstance(data, dict):
            raise DomoluxViewValidationError("View data must be a dictionary.")

        assert_no_forbidden_fields(data, "view")

        view_id = data.get("view_id")
        view_path = data.get("view_path")
        title = data.get("title")
        created_by = data.get("created_by", "system")

        if not view_id or not view_path or not title:
            raise DomoluxViewValidationError(
                "View dictionary missing required fields ('view_id', 'view_path', 'title')."
            )

        cards_raw = data.get("cards") or []
        if not isinstance(cards_raw, list):
            raise DomoluxViewValidationError("View cards must be a list.")

        cards = [DomoluxCardConfig.from_dict(c) for c in cards_raw]

        return cls(
            view_id=str(view_id),
            view_path=str(view_path),
            title=str(title),
            created_by=str(created_by),
            icon=str(data.get("icon", "mdi:view-dashboard")),
            layout=str(data.get("layout", DomoluxLayoutType.GRID.value)),
            cards=cards,
            created_at=str(data.get("created_at", datetime.now(timezone.utc).isoformat())),
            updated_at=str(data.get("updated_at", datetime.now(timezone.utc).isoformat())),
        )
