"""Shared strict input schemas for Domolux Roles WebSocket commands.

T6.2 — every domolux/* command validates its payload at the boundary with a
strict voluptuous schema: enum membership, length bounds, UUID/entity-id
formats, list/dict size caps, and rejection of unknown/extra keys. Display
text fields are sanitized against executable HTML/script payloads.

Fail closed: any validation error surfaces as InvalidInput to the caller and
the command never executes.
"""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
    STORAGE_MAX_DISPLAY_NAME_LEN,
    STORAGE_MAX_STRING_LEN,
    STORAGE_MAX_USERNAME_LEN,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from .models import UUID4_PATTERN

# ---------------------------------------------------------------------------
# Shared validators
# ---------------------------------------------------------------------------

_EXECUTABLE_CONTENT_PATTERN = re.compile(
    r"<script\b|<iframe\b|<style\b|javascript:|onload=|onerror=|<html\b|<body\b|data:text/html",
    re.IGNORECASE,
)
_ENTITY_ID_PATTERN = re.compile(r"^[a-z0-9_]+\.[a-z0-9_]+$")
_SIMPLE_NAME_PATTERN = re.compile(r"^[a-z0-9_]+$")
_VIEW_PATH_PATTERN = re.compile(r"^[a-z0-9-]+$")
_USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]+$")


def sanitize_display_text(text: Any, field_name: str = "text") -> str:
    """Reject executable HTML/script payloads in display text.

    Display text (child display names, dashboard/view titles, card titles) is
    rendered in UIs; a stored payload like <script> or javascript: would be
    executed when rendered. Reject at ingestion instead of escaping at render.
    """
    if not isinstance(text, str):
        raise vol.Invalid(f"{field_name} must be a string.")
    cleaned = text.strip()
    if not cleaned:
        raise vol.Invalid(f"{field_name} must be a non-empty string.")
    if _EXECUTABLE_CONTENT_PATTERN.search(cleaned):
        raise vol.Invalid(
            f"Security Violation: Executable HTML/script payload detected in field "
            f"'{field_name}'."
        )
    return cleaned


def _clean_display_name(value: Any) -> str:
    cleaned = sanitize_display_text(value, "display_name")
    if len(cleaned) > STORAGE_MAX_DISPLAY_NAME_LEN:
        raise vol.Invalid(
            f"display_name must be at most {STORAGE_MAX_DISPLAY_NAME_LEN} characters long."
        )
    return cleaned


def _clean_username(value: Any) -> str:
    if not isinstance(value, str):
        raise vol.Invalid("username must be a string.")
    cleaned = value.strip().lower()
    if not cleaned:
        raise vol.Invalid("username must be a non-empty string.")
    if len(cleaned) > STORAGE_MAX_USERNAME_LEN:
        raise vol.Invalid(
            f"username must be at most {STORAGE_MAX_USERNAME_LEN} characters long."
        )
    if not _USERNAME_PATTERN.match(cleaned):
        raise vol.Invalid(
            "username may only contain lowercase alphanumeric characters, dots, underscores, and hyphens."
        )
    return cleaned


def _clean_password(value: Any) -> str:
    if not isinstance(value, str):
        raise vol.Invalid("password must be a string.")
    if len(value) < 8:
        raise vol.Invalid("password must be at least 8 characters long.")
    if len(value) > STORAGE_MAX_STRING_LEN:
        raise vol.Invalid(
            f"password must be at most {STORAGE_MAX_STRING_LEN} characters long."
        )
    return value


def _clean_user_id(value: Any) -> str:
    """Validate a Domolux user_id field: non-empty UUID string, stripped."""
    if not isinstance(value, str):
        raise vol.Invalid("user_id must be a string.")
    cleaned = value.strip()
    if not UUID4_PATTERN.match(cleaned):
        raise vol.Invalid(
            "User ID must be a valid Home Assistant user UUID."
        )
    return cleaned


def entity_id_validator(value: Any) -> str:
    """Validate a Home Assistant entity_id string (domain.object_id)."""
    if not isinstance(value, str):
        raise vol.Invalid("entity_id must be a string.")
    cleaned = value.strip().lower()
    if not _ENTITY_ID_PATTERN.match(cleaned):
        raise vol.Invalid(
            f"Invalid entity ID '{value}'. Must match format 'domain.entity_name'."
        )
    if len(cleaned) > STORAGE_MAX_STRING_LEN:
        raise vol.Invalid("entity_id exceeds maximum length.")
    return cleaned


def bounded_entity_list(value: Any) -> list[str]:
    """A bounded list of entity ids (max 64 entries, no empty strings)."""
    if not isinstance(value, list):
        raise vol.Invalid("entity_id list must be a list.")
    if len(value) > 64:
        raise vol.Invalid("Too many entity_id entries (max 64).")
    return [entity_id_validator(v) for v in value]


def _coerce_entity_ids(value: Any) -> Any:
    if isinstance(value, str):
        return [value]
    return value


def _clean_service_name(value: Any) -> str:
    if not isinstance(value, str):
        raise vol.Invalid("service name must be a string.")
    cleaned = value.strip().lower()
    if not _SIMPLE_NAME_PATTERN.match(cleaned):
        raise vol.Invalid(
            f"Invalid service name '{value}'. Must be lowercase alphanumeric/underscore."
        )
    return cleaned


def _clean_domain_name(value: Any) -> str:
    if not isinstance(value, str):
        raise vol.Invalid("domain must be a string.")
    cleaned = value.strip().lower()
    if not _SIMPLE_NAME_PATTERN.match(cleaned):
        raise vol.Invalid(
            f"Invalid domain '{value}'. Must be lowercase alphanumeric/underscore."
        )
    return cleaned


def view_path_validator(value: Any) -> str:
    """Validate a lovelace view path: lowercase alnum + hyphens, bounded."""
    if not isinstance(value, str):
        raise vol.Invalid("view_path must be a string.")
    cleaned = value.strip().lower()
    if not _VIEW_PATH_PATTERN.match(cleaned):
        raise vol.Invalid(
            f"Invalid view path '{value}'. Must be lowercase alphanumeric and hyphens."
        )
    if len(cleaned) > STORAGE_MAX_STRING_LEN:
        raise vol.Invalid("view_path exceeds maximum length.")
    return cleaned


def bounded_service_data(value: Any) -> dict[str, Any]:
    """Service data: flat dict of primitives, bounded key count and sizes."""
    if not isinstance(value, dict):
        raise vol.Invalid("service_data must be a dictionary.")
    if len(value) > 32:
        raise vol.Invalid("service_data is limited to 32 keys.")
    for k, v in value.items():
        if not isinstance(k, str) or len(k) > 128:
            raise vol.Invalid("service_data keys must be bounded strings.")
        if isinstance(v, str) and len(v) > STORAGE_MAX_STRING_LEN:
            raise vol.Invalid(f"service_data value for '{k}' exceeds maximum length.")
        if isinstance(v, (list, dict)):
            # Structured service data is rejected; control commands take only
            # primitives. Lists/dicts would allow smuggling target keys.
            raise vol.Invalid(
                f"service_data value for '{k}' must be a primitive (str/int/float/bool/None)."
            )
    return dict(value)


def bounded_metadata(value: Any) -> dict[str, Any]:
    """Metadata dict: bounded number of keys, bounded string values."""
    if not isinstance(value, dict):
        raise vol.Invalid("metadata must be a dictionary.")
    if len(value) > 32:
        raise vol.Invalid("metadata is limited to 32 keys.")
    for k, v in value.items():
        if not isinstance(k, str) or len(k) > 128:
            raise vol.Invalid("metadata keys must be bounded strings.")
        if isinstance(v, str) and len(v) > STORAGE_MAX_STRING_LEN:
            raise vol.Invalid(f"metadata value for '{k}' exceeds maximum length.")
        if isinstance(v, (list, dict)):
            raise vol.Invalid(
                f"metadata value for '{k}' must be a primitive (str/int/float/bool/None)."
            )
    return dict(value)


# ---------------------------------------------------------------------------
# Field schemas
# ---------------------------------------------------------------------------

USER_ID_SCHEMA = vol.All(str, _clean_user_id)

DISPLAY_NAME = vol.All(str, _clean_display_name)
USERNAME_STRICT = vol.All(str, _clean_username)
SANITIZED_DISPLAY_NAME = DISPLAY_NAME
SANITIZED_PASSWORD = vol.All(str, _clean_password)

BOUNDED_STR = vol.All(str, vol.Length(max=STORAGE_MAX_STRING_LEN))
RULE_ID = vol.All(str, vol.Length(min=1, max=STORAGE_MAX_STRING_LEN))

ACCESS_LEVEL = vol.In([ACCESS_LEVEL_NONE, ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL])
TARGET_TYPE = vol.In([TARGET_ENTITY, TARGET_DEVICE, TARGET_AREA])
EVALUATE_TARGET_TYPE = vol.In([TARGET_ENTITY, TARGET_DEVICE, TARGET_AREA, "view"])
EFFECT = vol.In([EFFECT_ALLOW, EFFECT_DENY])

ENTITY_ID_SCHEMA = vol.All(str, entity_id_validator)
ENTITY_ID_LIST_SCHEMA = vol.All(_coerce_entity_ids, bounded_entity_list)
DOMAIN_SCHEMA = vol.All(str, _clean_domain_name)
SERVICE_SCHEMA = vol.All(str, _clean_service_name)
SERVICE_DATA_SCHEMA = vol.All(dict, bounded_service_data)

VIEW_PATH_SCHEMA = vol.All(str, view_path_validator)

VIEW_UUID_SCHEMA = USER_ID_SCHEMA  # view ids are server-generated UUID4

METADATA_SCHEMA = vol.All(dict, bounded_metadata)
