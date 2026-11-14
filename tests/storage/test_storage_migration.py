"""T5.2 — Storage migration and golden-file tests for Domolux Role storage.

Validates migrate()/validate() against golden fixtures for v0, v1, v2 and
unknown-future versions.  No privilege amplification is permitted by any
migration step.
"""

import json
import pathlib
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles.store import (
    DomoluxRoleStore,
    StorageCorruptionError,
)

FIXTURES = pathlib.Path(__file__).resolve().parent.parent / "fixtures" / "storage"
VALID_FATHER = "a1b2c3d4-e5f6-7890-1234-56789abcdef0"


def _load(name):
    with open(FIXTURES / name, encoding="utf-8") as handle:
        return json.load(handle)


def _new_store():
    store = DomoluxRoleStore(MagicMock())
    store._store = None
    return store


@pytest.mark.parametrize(
    "fixture, expected_version",
    [
        ("golden_v0.json", 2),
        ("golden_v1.json", 2),
        ("golden_v2.json", 2),
    ],
)
def test_migration_golden_round_trip(fixture, expected_version):
    raw = _load(fixture)
    store = _new_store()
    migrated = store.migrate(raw)
    validated = store.validate(migrated)
    assert validated["version"] == expected_version
    assert validated["father"]["user_id"] == VALID_FATHER


def test_v1_to_v2_adds_permissions_key():
    raw = _load("golden_v1.json")
    store = _new_store()
    migrated = store.migrate(raw)
    assert migrated["version"] == 2
    assert "permissions" in migrated
    assert isinstance(migrated["permissions"], dict)


def test_v2_payload_validates_cleanly():
    raw = _load("golden_v2.json")
    store = _new_store()
    validated = store.validate(store.migrate(raw))
    assert validated["version"] == 2
    assert validated["father"]["user_id"] == VALID_FATHER
    assert validated["permissions"] == {}


def test_future_version_refused():
    raw = _load("golden_v2.json")
    raw["version"] = 99
    store = _new_store()
    with pytest.raises(StorageCorruptionError):
        store.migrate(raw)


@pytest.mark.asyncio
async def test_future_version_load_fails_safe():
    raw = _load("golden_v2.json")
    raw["version"] = 99
    mock_store = MagicMock()
    mock_store.async_load = AsyncMock(return_value=raw)
    store = DomoluxRoleStore(MagicMock())
    store._store = mock_store
    data = await store.async_load()
    assert data.version == 2
    assert data.father is None


def test_no_privilege_amplification_on_migration():
    raw = _load("golden_v0.json")
    store = _new_store()
    migrated = store.validate(store.migrate(raw))
    assert migrated["father"]["user_id"] == VALID_FATHER
    assert migrated["permissions"] == {}
    assert "is_admin" not in migrated
    assert "is_owner" not in migrated
    assert "policy" not in migrated
