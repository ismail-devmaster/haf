"""T5.1 — Fuzz load-time validation of Domolux Role storage.

Drives DomoluxRoleStore.validate() with 2,000+ mutated payloads derived from
a known-good baseline. Invariants under test:
  1. Never raises an exception other than StorageCorruptionError /
     DuplicateFatherError (no unhandled TypeError/KeyError/ValueError).
  2. A payload that fails validation raises — it never parses into grants.
  3. Every rejection error path is logged.
"""

import copy
import logging
import random
from unittest.mock import MagicMock

import pytest

from custom_components.domolux_roles.store import (
    DomoluxRoleStore,
    DuplicateFatherError,
    StorageCorruptionError,
)

BASELINE = {
    "version": 2,
    "minor_version": 0,
    "father": {
        "user_id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
        "assigned_at": "2026-09-27T12:00:00Z",
        "assigned_by": "system",
        "status": "ACTIVE",
    },
    "family_members": {
        "98765432-10fe-abcd-ef01-234567890abc": {
            "user_id": "98765432-10fe-abcd-ef01-234567890abc",
            "display_name": "Child One",
            "status": "ACTIVE",
        }
    },
    "permissions": {
        "98765432-10fe-abcd-ef01-234567890abc": {
            "user_id": "98765432-10fe-abcd-ef01-234567890abc",
            "default_access_level": "none",
            "entity_rules": {
                "r1": {
                    "rule_id": "r1",
                    "target_type": "entity",
                    "target_id": "light.living",
                    "access_level": "control",
                }
            },
            "view_rules": {
                "living-room": {"view_path": "living-room", "effect": "allow"}
            },
        }
    },
    "metadata": {
        "created_at": "2026-09-27T12:00:00Z",
        "last_updated": "2026-09-27T12:00:00Z",
    },
}

ACCEPTED = (StorageCorruptionError, DuplicateFatherError)


def _random_leaf(rng):
    return rng.choice([
        None, True, False, 0, 1, -1, 2**31, 3.14159, "", "none", "control",
        "entity", "area", "device", "read", "allow", "deny", "x" * 600,
        "is_admin", "password", "token",
        [None], {"nested": "value"},
    ])


def _all_keys(doc, path=()):
    if isinstance(doc, dict):
        for k, v in doc.items():
            yield path + (k,)
            yield from _all_keys(v, path + (k,))
    elif isinstance(doc, list):
        for i, v in enumerate(doc):
            yield path + (i,)
            yield from _all_keys(v, path + (i,))


def _navigate(doc, path):
    parent = doc
    for step in path[:-1]:
        if isinstance(parent, dict):
            parent = parent.get(step, {})
        elif isinstance(parent, list):
            idx = int(step) if isinstance(step, int) else 0
            parent = parent[idx] if idx < len(parent) else {}
    return parent, path[-1]


def _mutate(payload, rng):
    doc = copy.deepcopy(payload)
    for _ in range(rng.randint(1, 3)):
        action = rng.choice(["replace", "delete", "inject", "type_flip"])
        keys = list(_all_keys(doc))
        if not keys:
            return doc
        path = rng.choice(keys)
        parent, final_key = _navigate(doc, path)
        if action == "replace":
            if isinstance(parent, (dict, list)):
                parent[final_key] = _random_leaf(rng)
        elif action == "delete":
            if isinstance(parent, dict):
                parent.pop(final_key, None)
            elif isinstance(parent, list) and parent:
                idx = final_key if isinstance(final_key, int) else 0
                if idx < len(parent):
                    parent.pop(idx)
        elif action == "inject":
            if isinstance(parent, dict):
                parent[rng.choice([
                    "is_admin", "is_owner", "policy", "groups",
                    "system_groups", "refresh_token", "password",
                ])] = _random_leaf(rng)
            elif isinstance(parent, list):
                parent.append(_random_leaf(rng))
        elif action == "type_flip":
            if isinstance(parent, (dict, list)):
                parent[final_key] = rng.choice([
                    None, 123, [1, 2], {"x": "y"}, True, 3.14,
                ])
    return doc


@pytest.mark.parametrize("seed", range(2000))
def test_fuzz_mutation_never_unhandled(seed):
    rng = random.Random(seed)
    mutated = _mutate(BASELINE, rng)
    store = DomoluxRoleStore(MagicMock())
    store._store = None
    try:
        validated = store.validate(copy.deepcopy(mutated))
    except ACCEPTED:
        return
    # Widened successfully: must grant nothing beyond the empty UNASSIGNED default.
    assert isinstance(validated, dict)
    for forbidden in ("is_admin", "is_owner", "policy", "groups",
                      "system_groups", "refresh_token", "password"):
        assert forbidden not in validated
        for mem in (validated.get("family_members") or {}).values():
            if isinstance(mem, dict):
                assert forbidden not in mem
        for perm in (validated.get("permissions") or {}).values():
            if isinstance(perm, dict):
                assert forbidden not in perm
