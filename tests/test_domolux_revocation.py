"""T4.2/T4.3 — ordered revocation routine and audit trail tests."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles.audit import DomoluxAuditLog
from custom_components.domolux_roles.revocation import (
    DomoluxRevocationError,
    DomoluxRevocationOrchestrator,
    get_revocation_orchestrator,
    is_permission_reduction,
    reduced_targets,
)

CHILD = "22222222-2222-4222-8222-222222222222"


class FakeStore:
    def __init__(self, fail_save=False):
        self.fail_save = fail_save
        self.calls = []
        self.revisions = {"profile": 0, "registry": 0, "catalog": 0}

    def bump_revisions(self, *, profile=True, registry=False, catalog=False):
        self.calls.append("bump")
        if profile:
            self.revisions["profile"] += 1
        if registry:
            self.revisions["registry"] += 1
        if catalog:
            self.revisions["catalog"] += 1
        return dict(self.revisions)

    def flush_security_reduction(self, profile, registry, catalog):
        self.calls.append(("flush", profile, registry, catalog))

    async def async_save(self):
        self.calls.append("save")
        if self.fail_save:
            raise OSError("disk full")


class FakeRegistry:
    def __init__(self):
        self.calls = []
        self.closed = 0
        self.refreshed = 0

    def refresh_user_subscriptions(self, user_id, reason=""):
        self.calls.append(("refresh", user_id, reason))
        return self.refreshed

    async def async_close_user_connections(self, user_id, reason=""):
        self.calls.append(("close", user_id, reason))
        return self.closed


def _orchestrator(store=None, registry=None, audit=None, adapter=None, hass=None):
    hass = hass or MagicMock()
    return DomoluxRevocationOrchestrator(
        hass,
        store or FakeStore(),
        registry=registry,
        adapter=adapter,
        audit=audit if audit is not None else DomoluxAuditLog(hass),
    )


async def test_ordered_steps_and_audit():
    store = FakeStore()
    registry = FakeRegistry()
    registry.refreshed = 2
    audit = DomoluxAuditLog(MagicMock())
    orch = _orchestrator(store=store, registry=registry, audit=audit)
    mutated = []

    result = await orch.async_apply(
        CHILD,
        "permission.reduced",
        mutate=lambda: mutated.append(1),
        actor_id="father",
    )

    assert mutated == [1]
    assert store.calls[0] == "bump"
    assert store.calls[1][0] == "flush"
    assert store.calls[2] == "save"
    assert registry.calls == [("refresh", CHILD, "permission.reduced")]
    assert result.subscriptions_refreshed == 2
    entry = audit.entries()[-1]
    assert entry["action"] == "security.revoke"
    assert entry["outcome"] == "allowed"
    assert entry["target_user_id"] == CHILD
    assert entry["id"] == result.audit_id


async def test_persist_failure_is_fail_closed_and_audited():
    store = FakeStore(fail_save=True)
    audit = DomoluxAuditLog(MagicMock())
    orch = _orchestrator(store=store, registry=FakeRegistry(), audit=audit)

    with pytest.raises(DomoluxRevocationError):
        await orch.async_apply(CHILD, "permission.reduced")

    assert audit.entries()[-1]["outcome"] == "failed"
    # No success result was produced and no later step ran.
    assert store.calls[-1] == "save"


async def test_hard_close_terminates_connections_instead_of_refreshing():
    registry = FakeRegistry()
    registry.closed = 3
    orch = _orchestrator(registry=registry)

    result = await orch.async_apply(
        CHILD, "family.deleted", hard_close=True
    )

    assert registry.calls == [("close", CHILD, "family.deleted")]
    assert result.connections_closed == 3
    assert result.subscriptions_refreshed == 0


async def test_token_revocation_requires_a_revoker():
    orch = _orchestrator(adapter=None)

    with pytest.raises(DomoluxRevocationError):
        await orch.async_apply(CHILD, "father.revoked", revoke_tokens=True)


async def test_token_revoker_is_used():
    calls = []

    async def revoker(user_id):
        calls.append(user_id)
        return 4

    orch = _orchestrator()
    result = await orch.async_apply(
        CHILD, "father.revoked", revoke_tokens=True, token_revoker=revoker
    )

    assert calls == [CHILD]
    assert result.tokens_revoked == 4


async def test_disable_user_uses_supported_api():
    hass = MagicMock()
    user = MagicMock()
    hass.auth.async_get_user = AsyncMock(return_value=user)
    hass.auth.async_update_user = AsyncMock()
    orch = _orchestrator(hass=hass)

    result = await orch.async_apply(CHILD, "family.disabled", disable_user=True)

    assert result.user_disabled is True
    hass.auth.async_update_user.assert_awaited_once_with(user, is_active=False)


async def test_disable_user_fails_when_user_missing():
    hass = MagicMock()
    hass.auth.async_get_user = AsyncMock(return_value=None)
    orch = _orchestrator(hass=hass)

    with pytest.raises(DomoluxRevocationError):
        await orch.async_apply(CHILD, "family.disabled", disable_user=True)


def test_is_permission_reduction_matrix():
    base = {
        "default_access_level": "control",
        "entity_rules": {
            "r1": {"rule_id": "r1", "target_type": "entity", "target_id": "light.a", "access_level": "control"},
            "r2": {"rule_id": "r2", "target_type": "entity", "target_id": "light.b", "access_level": "read"},
        },
        "view_rules": {"dashboard/a": {"view_path": "dashboard/a", "effect": "allow"}},
    }

    lowered_default = dict(base, default_access_level="read")
    assert is_permission_reduction(base, lowered_default) is True

    lowered_rule = {
        **base,
        "entity_rules": {
            "r1": dict(base["entity_rules"]["r1"], access_level="read"),
            "r2": base["entity_rules"]["r2"],
        },
    }
    assert is_permission_reduction(base, lowered_rule) is True

    removed_rule = {**base, "entity_rules": {"r2": base["entity_rules"]["r2"]}}
    assert is_permission_reduction(base, removed_rule) is True

    removed_view = {**base, "view_rules": {}}
    assert is_permission_reduction(base, removed_view) is True

    increased = {
        **base,
        "entity_rules": {
            **base["entity_rules"],
            "r3": {"rule_id": "r3", "target_type": "entity", "target_id": "light.c", "access_level": "control"},
        },
    }
    assert is_permission_reduction(base, increased) is False

    unchanged = dict(base)
    assert is_permission_reduction(base, unchanged) is False


def test_audit_redacts_credentials_and_is_bounded():
    audit = DomoluxAuditLog(MagicMock(), max_entries=3)
    audit.record(
        "command.denied",
        actor_id=CHILD,
        outcome="denied",
        details={"password": "hunter2", "nested": {"refresh_token": "abc"}},
    )
    for _ in range(5):
        audit.record("command.denied", actor_id=CHILD, outcome="denied")

    entries = audit.entries()
    assert len(entries) == 3
    assert entries[0]["details"] == {}
    assert len(audit.denied()) == 3

    audit.clear()
    assert audit.entries() == []


def test_audit_redaction_keeps_safe_fields():
    audit = DomoluxAuditLog(MagicMock())
    entry = audit.record(
        "security.revoke",
        details={"reason": "test", "password": "x", "count": 2},
    )
    assert entry["details"] == {"reason": "test", "password": "***redacted***", "count": 2}


def test_get_orchestrator_from_hass_data():
    hass = MagicMock()
    orch = MagicMock()
    hass.data = {"domolux_roles": {"entry": {"revocation": orch}}}
    assert get_revocation_orchestrator(hass) is orch

    hass.data = {"domolux_roles": {"entry": {}}}
    assert get_revocation_orchestrator(hass) is None


async def test_soft_revoke_fires_removal_payload_synchronously():
    """T4.3: the Child learns about the removal in the same call (< 1 s)."""
    hass = MagicMock()
    fired = []
    hass.bus.async_fire = MagicMock(
        side_effect=lambda event, data: fired.append((event, data))
    )
    registry = FakeRegistry()
    orch = _orchestrator(registry=registry, hass=hass)

    removed = [
        {"target_type": "entity", "target_id": "light.living_room"}
    ]
    await orch.async_apply(
        CHILD,
        "permission.reduced",
        removed_targets=removed,
    )

    # Emitted synchronously; no polling or sleep involved.
    permission_events = [item for item in fired if item[0] == "domolux_permissions_updated"]
    assert len(permission_events) == 1
    event, data = permission_events[0]
    assert event == "domolux_permissions_updated"
    assert data["user_id"] == CHILD
    assert data["removed_targets"] == removed
    assert data["revision"] == 1
    # Soft revocation never closes the connection.
    assert registry.calls == [("refresh", CHILD, "permission.reduced")]


async def test_hard_close_does_not_emit_soft_payload():
    hass = MagicMock()
    hass.bus.async_fire = MagicMock()
    registry = FakeRegistry()
    orch = _orchestrator(registry=registry, hass=hass)

    await orch.async_apply(CHILD, "family.deleted", hard_close=True)

    fired_events = [call.args[0] for call in hass.bus.async_fire.call_args_list]
    assert "domolux_permissions_updated" not in fired_events
    assert "domolux_audit" in fired_events


def test_reduced_targets_reports_entity_and_view_removals():
    old = {
        "default_access_level": "none",
        "entity_rules": {
            "r1": {"rule_id": "r1", "target_type": "entity", "target_id": "light.a", "access_level": "control"},
            "r2": {"rule_id": "r2", "target_type": "area", "target_id": "living_room", "access_level": "read"},
        },
        "view_rules": {"dashboard/a": {"view_path": "dashboard/a", "effect": "allow"}},
    }
    new = {
        "default_access_level": "none",
        "entity_rules": {
            "r1": {"rule_id": "r1", "target_type": "entity", "target_id": "light.a", "access_level": "read"},
        },
        "view_rules": {},
    }

    assert reduced_targets(old, new) == [
        {"target_type": "entity", "target_id": "light.a"},
        {"target_type": "area", "target_id": "living_room"},
        {"target_type": "view", "target_id": "dashboard/a"},
    ]


def test_reduced_targets_empty_for_increase():
    old = {"default_access_level": "none", "entity_rules": {}, "view_rules": {}}
    new = {
        "default_access_level": "none",
        "entity_rules": {
            "r1": {"rule_id": "r1", "target_type": "entity", "target_id": "light.a", "access_level": "control"}
        },
        "view_rules": {},
    }
    assert reduced_targets(old, new) == []


async def test_permission_reduction_denies_then_regrant_allows():
    """T4.3 end-to-end at the evaluator boundary."""
    from custom_components.domolux_roles.const import (
        ACCESS_LEVEL_CONTROL,
        DOMAIN,
    )
    from custom_components.domolux_roles.models import (
        EntityPermissionRule,
        UserPermissionSet,
    )
    from custom_components.domolux_roles.permission_evaluator import (
        DomoluxPermissionEvaluator,
    )
    from custom_components.domolux_roles.store import DomoluxRoleStore

    hass = MagicMock()
    store = DomoluxRoleStore(hass)
    store._store = None
    grant = UserPermissionSet(
        user_id=CHILD,
        default_access_level="none",
        entity_rules={
            "r1": EntityPermissionRule(
                rule_id="r1",
                target_type="entity",
                target_id="light.living_room",
                access_level=ACCESS_LEVEL_CONTROL,
            )
        },
    )
    store.set_user_permissions(grant)
    evaluator = DomoluxPermissionEvaluator(hass, store)
    assert (
        await evaluator.evaluate_entity_access(
            CHILD, "light.living_room", required_level=ACCESS_LEVEL_CONTROL
        )
    ).granted is True

    old_dict = grant.to_dict()
    reduced = UserPermissionSet(user_id=CHILD, default_access_level="none")
    registry = FakeRegistry()
    orch = _orchestrator(store=store, registry=registry, hass=hass)

    removed = reduced_targets(old_dict, reduced.to_dict())
    await orch.async_apply(
        CHILD,
        "permission.reduced",
        mutate=lambda: store.set_user_permissions(reduced),
        removed_targets=removed,
    )

    assert removed == [
        {"target_type": "entity", "target_id": "light.living_room"}
    ]
    denied = await evaluator.evaluate_entity_access(
        CHILD, "light.living_room", required_level=ACCESS_LEVEL_CONTROL
    )
    assert denied.granted is False

    # Re-grant works and is a normal (non-reduction) update.
    await orch.async_apply(
        CHILD,
        "permission.updated",
        mutate=lambda: store.set_user_permissions(grant),
        reduction=False,
        removed_targets=[],
    )
    assert (
        await evaluator.evaluate_entity_access(
            CHILD, "light.living_room", required_level=ACCESS_LEVEL_CONTROL
        )
    ).granted is True


async def test_father_revoke_revokes_tokens_closes_socket_and_audits():
    """T4.2 father-removal path: old Father tokens die, socket closes, audited."""
    from custom_components.domolux_roles.api import ws_remove_father
    from custom_components.domolux_roles.const import DOMAIN
    from custom_components.domolux_roles.models import (
        FatherRoleAssignment,
        FatherRoleStatus,
    )
    from custom_components.domolux_roles.role_manager import DomoluxRoleManager
    from custom_components.domolux_roles.store import DomoluxRoleStore

    father_id = "33333333-3333-4333-8333-333333333333"
    hass = MagicMock()
    store = DomoluxRoleStore(hass)
    store._store = None
    manager = DomoluxRoleManager(hass, store)
    store.set_father(
        FatherRoleAssignment(
            user_id=father_id,
            assigned_at="2026-01-01T00:00:00+00:00",
            assigned_by="system",
            status=FatherRoleStatus.ACTIVE,
        )
    )

    token_one, token_two = MagicMock(), MagicMock()
    old_father = MagicMock()
    old_father.refresh_tokens = {"t1": token_one, "t2": token_two}
    hass.auth.async_get_user = AsyncMock(return_value=old_father)
    hass.auth.async_remove_refresh_token = AsyncMock()

    audit = DomoluxAuditLog(hass)
    registry = FakeRegistry()
    registry.closed = 1
    orch = DomoluxRevocationOrchestrator(
        hass, store, registry=registry, audit=audit
    )
    hass.data = {
        DOMAIN: {"entry": {"store": store, "manager": manager, "revocation": orch}}
    }

    admin = MagicMock()
    admin.id = "99999999-9999-4999-8999-999999999999"
    admin.is_admin = True
    admin.is_owner = False
    admin.is_disabled = False
    connection = MagicMock()
    connection.user = admin
    connection.send_result = MagicMock()
    connection.send_error = MagicMock()

    await ws_remove_father(hass, connection, {"id": 1})

    connection.send_error.assert_not_called()
    connection.send_result.assert_called_once()
    assert hass.auth.async_remove_refresh_token.await_count == 2
    assert registry.calls == [("close", father_id, "father.revoked")]
    entry = audit.entries()[-1]
    assert entry["action"] == "security.revoke"
    assert entry["target_user_id"] == father_id
    assert entry["outcome"] == "allowed"
    assert manager.get_father_assignment() is None
