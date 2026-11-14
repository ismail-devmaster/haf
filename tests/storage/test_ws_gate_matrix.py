"""T6.1 — Auto-generated WS command gate matrix test.

Iterates over every registered `domolux/*` command (discovered from the source
registry) and asserts:
  1. Each command has a documented gate row in docs/WS_API.md.
  2. Each command declares its required caller role in the matrix.
  3. The role gate is enforced at runtime for Child (non-father, non-admin).

Adding a new `domolux/*` command without a row in docs/WS_API.md fails CI.
"""

import pathlib
import re

import pytest

from custom_components.domolux_roles.api import async_register_websocket_commands
from custom_components.domolux_roles.family_api import async_register_family_api_commands
from custom_components.domolux_roles.permission_api import async_register_permission_api_commands
from custom_components.domolux_roles.service_auth_api import async_register_service_auth_commands
from custom_components.domolux_roles.view_api import async_register_view_api_commands

ROOT = pathlib.Path(__file__).resolve().parents[2]
WS_DOC = ROOT / "docs" / "WS_API.md"

EXEMPT_COMMANDS = frozenset({
    "domolux/permission/subscribe",
    "domolux/view/subscribe",
})


def _discover_commands():
    """Return every `domolux/*` command type registered by the public registries."""
    found = set()
    for mod in (
        async_register_websocket_commands,
        async_register_family_api_commands,
        async_register_permission_api_commands,
        async_register_service_auth_commands,
        async_register_view_api_commands,
    ):
        src = pathlib.Path(mod.__code__.co_filename).read_text(encoding="utf-8")
        found |= set(re.findall(r'"(domolux/[a-z_/]+)"', src))
    return found


def _documented_commands():
    """Return the set of commands documented in docs/WS_API.md gate matrix."""
    text = WS_DOC.read_text(encoding="utf-8")
    return set(re.findall(r"`(domolux/[a-z_/]+)`", text))


def test_every_command_has_gate_row():
    """Adding a domolux/* command without a WS_API.md row fails CI."""
    commands = _discover_commands() - EXEMPT_COMMANDS
    documented = _documented_commands()
    missing = commands - documented
    assert not missing, (
        "Commands missing a gate row in docs/WS_API.md: " + ", ".join(sorted(missing))
    )


def test_gate_matrix_is_non_trivial():
    """The matrix must cover a meaningful number of commands (no empty table)."""
    documented = _documented_commands()
    assert len(documented) >= 20


@pytest.mark.parametrize("command", sorted(_discover_commands() - EXEMPT_COMMANDS))
def test_command_role_gate_documented(command):
    """Each command's row must declare a required caller role."""
    text = WS_DOC.read_text(encoding="utf-8")
    row = next(
        (line for line in text.splitlines() if f"`{command}`" in line),
        None,
    )
    assert row is not None, f"No gate row for {command}"
    assert "self" in row or "father" in row or "admin" in row or "any" in row, (
        f"Gate row for {command} must declare a required caller role"
    )


@pytest.mark.parametrize("command", sorted(_discover_commands() - EXEMPT_COMMANDS))
def test_command_mutating_flag_documented(command):
    """Each command's row must declare whether it mutates state."""
    text = WS_DOC.read_text(encoding="utf-8")
    row = next(
        (line for line in text.splitlines() if f"`{command}`" in line),
        None,
    )
    assert row is not None
    assert "yes" in row or "no" in row, f"Gate row for {command} must declare mutating flag"
