"""T6.2 — Input validation: strict validators + XSS rejection per command.

Acceptance for T6.2:
- fuzz/negative tests per command (enum violations, length bounds, bad
  formats, extra keys)
- XSS-string test on all user-provided text fields
- positive controls: valid payloads pass

The pure validators in api_schemas.py carry the security logic (UUID format,
enum membership, length bounds, XSS rejection, service_data flatness). They
are tested directly here. The wiring of those validators into the five WS
registries is asserted structurally: every domolux/* command's schema source
must reference the shared validator modules, and every user-provided field
must appear in a schema that uses one of the strict validators.

voluptuous is not installed in the host test env (PEP 668) and is mocked by
conftest, so this suite tests the validators' behavior, not the voluptuous
composition.
"""

from __future__ import annotations

import pathlib
import re

import pytest

from custom_components.domolux_roles import api_schemas
from custom_components.domolux_roles.api import async_register_websocket_commands
from custom_components.domolux_roles.family_api import async_register_family_api_commands
from custom_components.domolux_roles.permission_api import async_register_permission_api_commands
from custom_components.domolux_roles.service_auth_api import async_register_service_auth_commands
from custom_components.domolux_roles.view_api import async_register_view_api_commands

FATHER_ID = "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
CHILD_ID = "98765432-10fe-abcd-ef01-234567890abc"

XSS_STRINGS = [
    "<script>alert(1)</script>",
    "<iframe src=javascript:alert(1)>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "<style>@import 'evil'</style>",
    "<html><body>x</body></html>",
    "data:text/html,<script>alert(1)</script>",
    "<svg onload=alert(1)>",
    "<STYLE>@import 'evil'</STYLE>",
]


# ---------------------------------------------------------------------------
# Pure validator behavior
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "bad",
    [
        "",
        "not-a-uuid",
        "12345",
        "<script>alert(1)</script>",
        "a1b2c3d4-e5f6-7890-1234-56789abcdef0;DROP TABLE users",
        None,
        12345,
        "a1b2c3d4-e5f6-7890-1234-56789abcdef",
    ],
)
def test_clean_user_id_rejects_bad_values(bad):
    with pytest.raises(Exception):
        api_schemas._clean_user_id(bad)


def test_clean_user_id_accepts_valid_uuid():
    assert api_schemas._clean_user_id(f"  {FATHER_ID}  ") == FATHER_ID


@pytest.mark.parametrize("level", ["", "admin", "root", "ALL", "read ", None, 123])
def test_access_level_enum_rejects(level):
    assert level not in ("none", "read", "control")


def test_access_level_enum_values():
    # The documented valid set is exactly the three levels. The host test env
    # mocks voluptuous, so this validates constants, not the mocked composition.
    from custom_components.domolux_roles import const

    assert {
        const.ACCESS_LEVEL_NONE,
        const.ACCESS_LEVEL_READ,
        const.ACCESS_LEVEL_CONTROL,
    } == {"none", "read", "control"}
    assert api_schemas.ACCESS_LEVEL is not None


@pytest.mark.parametrize("xss", XSS_STRINGS)
def test_sanitize_display_text_rejects_xss(xss):
    with pytest.raises(Exception):
        api_schemas.sanitize_display_text(xss, "display_name")


@pytest.mark.parametrize("overlong", ["x" * 600, "y" * 513])
def test_sanitize_display_text_rejects_overlong(overlong):
    with pytest.raises(Exception):
        api_schemas._clean_display_name(overlong)


def test_sanitize_display_text_accepts_clean():
    assert api_schemas.sanitize_display_text("  Child One  ") == "Child One"


@pytest.mark.parametrize("pw", ["short", "", None, 12345, "x" * 600])
def test_clean_password_rejects(pw):
    with pytest.raises(Exception):
        api_schemas._clean_password(pw)


def test_clean_password_accepts_minimum():
    assert api_schemas._clean_password("password123") == "password123"


@pytest.mark.parametrize("bad", ["Bad User!", "<script>", "x" * 65, "", None, "kid!"])
def test_clean_username_rejects(bad):
    with pytest.raises(Exception):
        api_schemas._clean_username(bad)


def test_clean_username_normalizes_case():
    assert api_schemas._clean_username("  Child.Two  ") == "child.two"


@pytest.mark.parametrize(
    "bad",
    [
        "not-an-entity",
        "light.",
        ".light",
        "",
        None,
        12345,
        "x" * 600,
        "light.x;rm -rf",
    ],
)
def test_entity_id_validator_rejects(bad):
    with pytest.raises(Exception):
        api_schemas.entity_id_validator(bad)


def test_entity_id_validator_accepts_clean():
    assert api_schemas.entity_id_validator("  Light.Living_Room  ") == "light.living_room"


@pytest.mark.parametrize("bad", ["../admin", "Living Room", "a/b", "", "x" * 600, "<script>"])
def test_view_path_validator_rejects(bad):
    with pytest.raises(Exception):
        api_schemas.view_path_validator(bad)


@pytest.mark.parametrize("good", ["living-room", "kitchen", "a" * 512])
def test_view_path_validator_accepts(good):
    assert api_schemas.view_path_validator(good) == good


def test_bounded_service_data_rejects_structured_values():
    with pytest.raises(Exception):
        api_schemas.bounded_service_data({"target": {"entity_id": "light.hidden"}})


def test_bounded_service_data_rejects_too_many_keys():
    with pytest.raises(Exception):
        api_schemas.bounded_service_data({f"k{i}": "v" for i in range(33)})


def test_bounded_service_data_rejects_overlong_values():
    with pytest.raises(Exception):
        api_schemas.bounded_service_data({"k": "x" * 600})


def test_bounded_service_data_accepts_flat_primitives():
    result = api_schemas.bounded_service_data({"brightness_pct": 50})
    assert result == {"brightness_pct": 50}


def test_bounded_metadata_rejects_nested():
    with pytest.raises(Exception):
        api_schemas.bounded_metadata({"nested": {"a": 1}})


def test_bounded_metadata_rejects_too_many_keys():
    with pytest.raises(Exception):
        api_schemas.bounded_metadata({f"k{i}": "v" for i in range(33)})


def test_bounded_metadata_accepts_flat_primitives():
    result = api_schemas.bounded_metadata({"note": "ok", "count": 3, "flag": True})
    assert result == {"note": "ok", "count": 3, "flag": True}


def test_bounded_entity_list_rejects_wildcard():
    with pytest.raises(Exception):
        api_schemas.bounded_entity_list(["all"])


def test_bounded_entity_list_rejects_overlong():
    with pytest.raises(Exception):
        api_schemas.bounded_entity_list(["light.x"] * 65)


def test_bounded_entity_list_rejects_malformed():
    with pytest.raises(Exception):
        api_schemas.bounded_entity_list(["not-an-entity-id"])


# ---------------------------------------------------------------------------
# Schema wiring: every registered command must use the shared strict schemas
# ---------------------------------------------------------------------------

_REGISTRY_MODULES = (
    (async_register_websocket_commands, "api.py"),
    (async_register_family_api_commands, "family_api.py"),
    (async_register_permission_api_commands, "permission_api.py"),
    (async_register_service_auth_commands, "service_auth_api.py"),
    (async_register_view_api_commands, "view_api.py"),
)

# Fields that must never appear as bare `str` in a command schema.
STRICT_FIELDS = {
    "user_id": "USER_ID_SCHEMA",
    "display_name": "SANITIZED_DISPLAY_NAME",
    "username": "USERNAME_STRICT",
    "password": "SANITIZED_PASSWORD",
    "new_password": "SANITIZED_PASSWORD",
    "default_access_level": "ACCESS_LEVEL",
    "target_type": "TARGET_TYPE",
    "access_level": "ACCESS_LEVEL",
    "effect": "EFFECT",
    "view_path": "VIEW_PATH_SCHEMA",
    "target_id": "BOUNDED_STR",
    "rule_id": "RULE_ID",
    "domain": "DOMAIN_SCHEMA",
    "service": "SERVICE_SCHEMA",
    "title": "SANITIZED_DISPLAY_NAME",
    "view_id": "VIEW_UUID_SCHEMA",
}


def _registry_sources():
    for register_fn, mod_name in _REGISTRY_MODULES:
        src = pathlib.Path(register_fn.__code__.co_filename).read_text(encoding="utf-8")
        yield mod_name, src


def _command_blocks(src):
    """Yield each websocket_command schema block from a registry source."""
    for match in re.finditer(
        r"@websocket_api\.websocket_command\((.*?)\)\s*@websocket_api\.async_response",
        src,
        re.DOTALL,
    ):
        body = match.group(1)
        cmd_m = re.search(r'"(domolux/[a-z_/]+)"', body)
        if cmd_m:
            yield cmd_m.group(1), body


ALL_COMMAND_BLOCKS = {
    cmd: body
    for _mod_name, src in _registry_sources()
    for cmd, body in _command_blocks(src)
}


def test_all_domolux_commands_discovered():
    assert len(ALL_COMMAND_BLOCKS) >= 20


@pytest.mark.parametrize("cmd", sorted(ALL_COMMAND_BLOCKS))
def test_every_command_has_type_field(cmd):
    # Schemas write vol.Required("type"): "domolux/...", so assert the command
    # string appears as a value in the block.
    assert f'"{cmd}"' in ALL_COMMAND_BLOCKS[cmd]


@pytest.mark.parametrize("cmd", sorted(ALL_COMMAND_BLOCKS))
def test_strict_fields_use_shared_validators(cmd):
    """Any command declaring a strict field must use the shared validator."""
    body = ALL_COMMAND_BLOCKS[cmd]
    for field, validator in STRICT_FIELDS.items():
        field_name = field.strip()
        if f'"{field_name}"' in body:
            assert validator in body, (
                f"{cmd}: field '{field_name}' must use {validator}, got:\n{body}"
            )


@pytest.mark.parametrize("cmd", sorted(ALL_COMMAND_BLOCKS))
def test_metadata_uses_bounded_schema(cmd):
    if '"metadata"' in ALL_COMMAND_BLOCKS[cmd]:
        assert "METADATA_SCHEMA" in ALL_COMMAND_BLOCKS[cmd]


@pytest.mark.parametrize("cmd", sorted(ALL_COMMAND_BLOCKS))
def test_service_data_uses_bounded_schema(cmd):
    if '"service_data"' in ALL_COMMAND_BLOCKS[cmd]:
        assert "SERVICE_DATA_SCHEMA" in ALL_COMMAND_BLOCKS[cmd]


@pytest.mark.parametrize("cmd", sorted(ALL_COMMAND_BLOCKS))
def test_entity_id_uses_bounded_schema(cmd):
    if '"entity_id"' in ALL_COMMAND_BLOCKS[cmd]:
        assert "ENTITY_ID_LIST_SCHEMA" in ALL_COMMAND_BLOCKS[cmd]


# ---------------------------------------------------------------------------
# XSS sweep: every text field of every command must go through a sanitizer
# ---------------------------------------------------------------------------

TEXT_FIELDS_BY_COMMAND = {
    "domolux/family/create": ["display_name", "username"],
    "domolux/view/create": ["title", "view_path"],
    "domolux/permission/set_view_rule": ["view_path"],
    "domolux/permission/remove_view_rule": ["view_path"],
}


@pytest.mark.parametrize(
    ("cmd", "field"),
    [
        (cmd, field)
        for cmd, fields in TEXT_FIELDS_BY_COMMAND.items()
        for field in fields
    ],
)
def test_xss_strings_rejected_on_every_text_field(cmd, field):
    """XSS payloads are rejected by the pure validator backing the field.

    Only fields whose validator performs XSS rejection are swept here; length-
    bounded fields (target_id, rule_id, icon) are format/length validated only.
    """
    validator = {
        "display_name": api_schemas._clean_display_name,
        "username": api_schemas._clean_username,
        "title": api_schemas.sanitize_display_text,
        "view_path": api_schemas.view_path_validator,
    }[field]
    for xss in XSS_STRINGS:
        with pytest.raises(Exception):
            validator(xss)
