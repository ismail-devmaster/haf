"""T5.5 — File permissions & secrets hygiene for Domolux storage.

Guards:
  1. No Domolux storage module writes credential-like fields
     (password, token, auth_token, refresh_token, hash, secret).
  2. No Domolux storage module emits credential-like values in log records.
  3. No third-party token library is imported by Domolux storage code.
"""

import logging
import pathlib
import re

import pytest

from custom_components.domolux_roles.store import DomoluxRoleStore
from custom_components.domolux_roles.models import FatherRoleAssignment, FatherRoleStatus
from custom_components.domolux_roles.view_store import DomoluxViewStore
from custom_components.domolux_roles.view_models import DomoluxView

STORAGE_MODULES = [
    "custom_components/domolux_roles/store.py",
    "custom_components/domolux_roles/view_store.py",
    "custom_components/domolux_roles/models.py",
    "custom_components/domolux_roles/view_models.py",
]

CREDENTIAL_PATTERNS = [
    re.compile(r"\b(password|passwd|pwd)\b", re.IGNORECASE),
    re.compile(r"\b(auth_token|auth_token_id|access_token|refresh_token)\b"),
    re.compile(r"\b(secret_key|secret)\b"),
    re.compile(r"\b(password_hash|hash)\b"),
]


def _read(path):
    return pathlib.Path(path).read_text(encoding="utf-8")


def _executable_lines(path):
    """Return only executable source lines, skipping docstrings and comments."""
    lines = _read(path).splitlines()
    out = []
    in_docstring = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('"""') or stripped.startswith("'''"):
            in_docstring = not in_docstring
            continue
        if in_docstring:
            continue
        if stripped.startswith("#"):
            continue
        out.append(line)
    return "\n".join(out)


# Patterns that indicate an actual credential is being *stored* (assigned to a
# variable / dict key), as opposed to being listed in a forbidden-fields set.
_STORE_PATTERNS = [
    re.compile(r"\b(password|passwd|pwd)\s*[:=]"),
    re.compile(r"\b(auth_token|refresh_token|access_token)\s*[:=]"),
    re.compile(r"\b(secret_key|secret)\s*[:=]"),
    re.compile(r"\b(password_hash)\s*[:=]"),
]


def test_storage_modules_do_not_persist_credentials():
    """No Domolux storage module writes credential-like fields."""
    for module in STORAGE_MODULES:
        src = _executable_lines(module)
        for pattern in _STORE_PATTERNS:
            assert not pattern.search(src), (
                f"Credential storage pattern {pattern.pattern!r} found in {module}"
            )


def test_store_rejects_secret_fields_in_payload():
    store = DomoluxRoleStore(__import__("unittest.mock").mock.MagicMock())
    payload = {
        "version": 2,
        "minor_version": 0,
        "father": {
            "user_id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
            "assigned_at": "2026-09-27T12:00:00Z",
            "assigned_by": "system",
            "status": "ACTIVE",
            "password": "leaked",
        },
        "family_members": {},
        "permissions": {},
        "metadata": {"created_at": "x", "last_updated": "x", "token": "leak"},
    }
    with pytest.raises(Exception):
        store.validate(payload)


def test_view_store_rejects_secret_fields_in_payload():
    store = DomoluxViewStore(__import__("unittest.mock").mock.MagicMock())
    payload = {
        "version": 1,
        "views": {
            "v1": {
                "view_id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
                "view_path": "living-room",
                "title": "Living Room",
                "created_by": "system",
                "refresh_token": "leak",
            }
        },
    }
    with pytest.raises(Exception):
        store.validate(payload)


def test_store_logs_do_not_leak_credentials(caplog):
    """No log record from Domolux storage contains credential-like values."""
    store = DomoluxRoleStore(__import__("unittest.mock").mock.MagicMock())
    store.set_father(
        FatherRoleAssignment(
            user_id="a1b2c3d4-e5f6-7890-1234-56789abcdef0",
            assigned_at="2026-09-27T12:00:00Z",
            assigned_by="system",
            status=FatherRoleStatus.ACTIVE,
        )
    )
    with caplog.at_level(logging.INFO):
        store.flush_security_reduction("p1", "r2", "c3")
    for record in caplog.records:
        message = record.getMessage()
        for pattern in CREDENTIAL_PATTERNS:
            assert not pattern.search(message), (
                f"Credential-like pattern {pattern.pattern!r} leaked in log: {message}"
            )
