"""Server-side service guard enforcement tests (D-001).

The Domolux service guard intercepts ``ServiceRegistry.async_call`` so that a
managed Child cannot execute a service that the Domolux policy does not
grant, regardless of the ingress channel (native WebSocket ``call_service``,
REST ``/api/services``, scripts, automations, scenes).

The tests exercise the real policy resolver (``resolver.resolve_entity_access``)
and the real store, and use a faithful stand-in for the Home Assistant target
expansion helper so that device / area / floor / label / group targets are
resolved exactly the way Home Assistant resolves them.
"""

import sys
import types
from unittest.mock import MagicMock

import pytest

from custom_components.domolux_roles import DOMAIN
from custom_components.domolux_roles import service_guard
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_READ,
    STATUS_ACTIVE,
    STATUS_SUSPENDED_DISABLED,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.resolver import resolve_entity_access
from custom_components.domolux_roles.service_guard import (
    REASON_ACCOUNT_NOT_ACTIVE,
    REASON_ALLOWED,
    REASON_DANGEROUS_DOMAIN,
    REASON_DOMAIN_NOT_ALLOWED,
    REASON_ENTITY_NOT_GRANTED,
    REASON_EVALUATION_ERROR,
    REASON_FATHER,
    REASON_NO_TARGET,
    REASON_NOT_MANAGED,
    REASON_SERVICE_NOT_ALLOWED,
    REASON_STORAGE_ERROR,
    REASON_TARGET_UNRESOLVED,
    REASON_WILDCARD_TARGET,
    async_authorize_service_call,
)
from custom_components.domolux_roles.store import DomoluxRoleStore

CHILD = "22222222-2222-4222-8222-222222222222"
OTHER_CHILD = "44444444-4444-4444-8444-444444444444"
FATHER = "33333333-3333-4333-8333-333333333333"


# --------------------------------------------------------------------------
# Faithful stand-in for homeassistant.helpers.target
# --------------------------------------------------------------------------
class _FakeSelectedEntities:
    """Mirror of Home Assistant's ``SelectedEntities``."""

    def __init__(self) -> None:
        self.referenced: set[str] = set()
        self.indirectly_referenced: set[str] = set()
        self.missing_devices: set[str] = set()
        self.missing_areas: set[str] = set()
        self.missing_floors: set[str] = set()
        self.missing_labels: set[str] = set()


def _as_set(value):
    if value is None:
        return set()
    if isinstance(value, (list, tuple, set)):
        return {str(item) for item in value}
    return {str(value)}


class _FakeTargetSelection:
    """Mirror of Home Assistant's ``TargetSelection``."""

    def __init__(self, config) -> None:
        config = config or {}
        self.entity_ids = _as_set(config.get("entity_id"))
        self.device_ids = _as_set(config.get("device_id"))
        self.area_ids = _as_set(config.get("area_id"))
        self.floor_ids = _as_set(config.get("floor_id"))
        self.label_ids = _as_set(config.get("label_id"))

    @property
    def has_any_target(self) -> bool:
        return bool(
            self.entity_ids
            or self.device_ids
            or self.area_ids
            or self.floor_ids
            or self.label_ids
        )


def _fake_extract_referenced_entity_ids(hass, selection, expand_group=True):
    registry = hass.data.get("_fake_target_registry", {})
    devices = registry.get("devices", {})
    areas = registry.get("areas", {})
    floors = registry.get("floors", {})
    labels = registry.get("labels", {})
    groups = registry.get("groups", {})

    selected = _FakeSelectedEntities()

    entity_ids = set(selection.entity_ids)
    if expand_group:
        expanded: set[str] = set()
        for entity_id in entity_ids:
            if entity_id in groups:
                expanded.update(groups[entity_id])
            else:
                expanded.add(entity_id)
        entity_ids = expanded
    selected.referenced.update(entity_ids)

    for device_id in selection.device_ids:
        members = devices.get(device_id)
        if members is None:
            selected.missing_devices.add(device_id)
            continue
        selected.indirectly_referenced.update(members)

    for area_id in selection.area_ids:
        members = areas.get(area_id)
        if members is None:
            selected.missing_areas.add(area_id)
            continue
        selected.indirectly_referenced.update(members)

    for floor_id in selection.floor_ids:
        members = floors.get(floor_id)
        if members is None:
            selected.missing_floors.add(floor_id)
            continue
        selected.indirectly_referenced.update(members)

    for label_id in selection.label_ids:
        members = labels.get(label_id)
        if members is None:
            selected.missing_labels.add(label_id)
            continue
        selected.indirectly_referenced.update(members)

    return selected


@pytest.fixture(autouse=True)
def _fake_target_helper(monkeypatch):
    """Install the Home Assistant target-helper stand-in for every test."""
    module = types.ModuleType("homeassistant.helpers.target")
    module.TargetSelection = _FakeTargetSelection
    module.SelectedEntities = _FakeSelectedEntities
    module.async_extract_referenced_entity_ids = _fake_extract_referenced_entity_ids
    monkeypatch.setitem(sys.modules, "homeassistant.helpers.target", module)
    yield module


@pytest.fixture(autouse=True)
def _clean_guard_state():
    """Ensure the process wide guard is never left installed."""
    yield
    service_guard.uninstall_service_guard()


# --------------------------------------------------------------------------
# Fixtures / helpers
# --------------------------------------------------------------------------
class _FakeEvaluator:
    """Evaluator backed by the real pure resolver."""

    def __init__(self, store, registry):
        self.store = store
        self.registry = registry

    async def evaluate_entity_access(
        self, user_id, entity_id, required_level=ACCESS_LEVEL_READ
    ):
        grants = self.store.get_user_permissions(user_id)
        return resolve_entity_access(
            grants, self.registry, user_id, entity_id, required_level
        )


def _build_hass(
    child_rules=None,
    default_level="none",
    child_status=STATUS_ACTIVE,
    include_father=True,
    registry=None,
):
    """Build a fake hass with a Domolux store, evaluator and target registry."""
    hass = MagicMock()
    hass.data = {}
    store = DomoluxRoleStore(hass)
    store._store = None

    if include_father:
        store.set_father(
            FatherRoleAssignment(
                user_id=FATHER,
                assigned_at="2026-01-01T00:00:00+00:00",
                assigned_by=FATHER,
                status=FatherRoleStatus.ACTIVE,
            )
        )

    store.add_family_member(
        FamilyMemberRecord(
            user_id=CHILD,
            display_name="Child A",
            username="child_a",
            managed_group_id="group_child_a",
            status=child_status,
        )
    )

    store.set_user_permissions(
        UserPermissionSet(
            user_id=CHILD,
            default_access_level=default_level,
            entity_rules={
                rule_id: EntityPermissionRule(
                    rule_id=rule_id,
                    target_type="entity",
                    target_id=target_id,
                    access_level=level,
                )
                for rule_id, (target_id, level) in (child_rules or {}).items()
            },
        )
    )

    entity_registry = registry or {}
    evaluator = _FakeEvaluator(store, entity_registry)

    hass.data[DOMAIN] = {
        "entry": {"store": store, "evaluator": evaluator},
    }
    hass.data["_fake_target_registry"] = {
        "devices": {"dev_curtain": ["cover.curtain"]},
        "areas": {"living_room": ["light.lamp", "cover.curtain"]},
        "floors": {"ground": ["light.lamp"]},
        "labels": {"kids": ["light.lamp"]},
        "groups": {"group.all_lights": ["light.lamp", "light.hidden"]},
    }
    return hass, store, evaluator


async def _authorize(hass, user_id=CHILD, domain="light", service="turn_on",
                     service_data=None, target=None):
    return await async_authorize_service_call(
        hass, user_id, domain, service, service_data, target
    )


# --------------------------------------------------------------------------
# Allow path
# --------------------------------------------------------------------------
async def test_child_with_control_grant_may_control_entity():
    """A Child that holds a control grant may operate exactly that entity."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, service_data={"entity_id": "light.lamp"})
    assert decision.allowed is True
    assert decision.reason == REASON_ALLOWED
    assert decision.entity_ids == ("light.lamp",)


async def test_control_grant_implies_read():
    """CONTROL is strictly stronger than READ (documented hierarchy)."""
    hass, _store, evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    control = await evaluator.evaluate_entity_access(
        CHILD, "light.lamp", required_level=ACCESS_LEVEL_CONTROL
    )
    read = await evaluator.evaluate_entity_access(
        CHILD, "light.lamp", required_level=ACCESS_LEVEL_READ
    )
    assert control.granted is True
    assert read.granted is True
    assert read.access_level == ACCESS_LEVEL_CONTROL


# --------------------------------------------------------------------------
# Deny path
# --------------------------------------------------------------------------
async def test_child_without_grant_is_denied():
    """An entity that is not granted is denied."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, service_data={"entity_id": "cover.curtain"})
    assert decision.allowed is False
    assert decision.reason == REASON_ENTITY_NOT_GRANTED


async def test_read_only_grant_denies_control():
    """READ is not sufficient for CONTROL."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("climate.hall", ACCESS_LEVEL_READ)}
    )
    decision = await _authorize(hass, service_data={"entity_id": "climate.hall"})
    assert decision.allowed is False
    assert decision.reason == REASON_ENTITY_NOT_GRANTED


async def test_missing_policy_defaults_to_deny():
    """Absent policy never grants control."""
    hass, _store, _evaluator = _build_hass(child_rules=None, default_level="none")
    decision = await _authorize(hass, service_data={"entity_id": "light.lamp"})
    assert decision.allowed is False


async def test_dangerous_domain_is_denied():
    """Scripts, scenes and shell access are never available to a Child."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    for domain in ("script", "scene", "shell_command", "automation", "homeassistant"):
        decision = await _authorize(
            hass, domain=domain, service="turn_on", service_data={"entity_id": "light.lamp"}
        )
        assert decision.allowed is False, domain
        assert decision.reason == REASON_DANGEROUS_DOMAIN, domain


async def test_domain_outside_allowlist_is_denied():
    """Domains outside the control allowlist are denied."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(
        hass, domain="vacuum", service="start", service_data={"entity_id": "vacuum.x"}
    )
    assert decision.allowed is False
    assert decision.reason == REASON_DOMAIN_NOT_ALLOWED


async def test_service_outside_allowlist_is_denied():
    """Services outside the control allowlist are denied."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(
        hass, service="explode", service_data={"entity_id": "light.lamp"}
    )
    assert decision.allowed is False
    assert decision.reason == REASON_SERVICE_NOT_ALLOWED


async def test_wildcard_entity_target_is_denied():
    """``entity_id: all`` reaches every entity of the domain and is denied."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, service_data={"entity_id": "all"})
    assert decision.allowed is False
    assert decision.reason == REASON_WILDCARD_TARGET


async def test_wildcard_entity_target_in_list_is_denied():
    """A wildcard hidden inside a target list is denied as well."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(
        hass, service_data={"entity_id": ["light.lamp", "all"]}
    )
    assert decision.allowed is False
    assert decision.reason == REASON_WILDCARD_TARGET


async def test_device_target_is_expanded_and_authorised():
    """A device target expands to its entities; a forbidden member denies it."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    denied = await _authorize(hass, target={"device_id": "dev_curtain"})
    assert denied.allowed is False
    assert denied.reason == REASON_ENTITY_NOT_GRANTED


async def test_device_target_with_only_granted_entities_is_allowed():
    """A device whose entities are all granted may be controlled."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)},
        registry={"light.lamp": (None, None)},
    )
    hass.data["_fake_target_registry"]["devices"]["dev_lamp"] = ["light.lamp"]
    decision = await _authorize(hass, target={"device_id": "dev_lamp"})
    assert decision.allowed is True
    assert decision.entity_ids == ("light.lamp",)


async def test_area_target_is_expanded_and_authorised():
    """An area target expands to every entity in the area."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, target={"area_id": "living_room"})
    assert decision.allowed is False
    assert decision.reason == REASON_ENTITY_NOT_GRANTED


async def test_group_target_is_expanded_and_authorised():
    """Entity groups expand to their members; a forbidden member denies it."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, service_data={"entity_id": "group.all_lights"})
    assert decision.allowed is False
    assert decision.reason == REASON_ENTITY_NOT_GRANTED


async def test_unknown_target_reference_is_denied():
    """A target that cannot be resolved fails closed."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, target={"device_id": "does_not_exist"})
    assert decision.allowed is False
    assert decision.reason == REASON_TARGET_UNRESOLVED


async def test_missing_target_is_denied():
    """A service call without any entity target is denied."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, service_data={})
    assert decision.allowed is False
    assert decision.reason == REASON_NO_TARGET


async def test_mixed_target_list_denies_the_whole_call():
    """One denied target denies the entire multi-target call (no partial exec)."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(
        hass, service_data={"entity_id": ["light.lamp", "cover.curtain"]}
    )
    assert decision.allowed is False
    assert decision.reason == REASON_ENTITY_NOT_GRANTED


# --------------------------------------------------------------------------
# Principal handling
# --------------------------------------------------------------------------
async def test_father_is_not_restricted():
    """The Father keeps full household control."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    decision = await _authorize(hass, user_id=FATHER, service_data={"entity_id": "cover.curtain"})
    assert decision.allowed is True
    assert decision.reason == REASON_FATHER


async def test_unmanaged_user_is_not_restricted():
    """Users outside the Domolux scope keep normal Home Assistant behaviour."""
    hass, _store, _evaluator = _build_hass()
    decision = await _authorize(hass, user_id=OTHER_CHILD, service_data={"entity_id": "cover.curtain"})
    assert decision.allowed is True
    assert decision.reason == REASON_NOT_MANAGED


async def test_disabled_child_is_denied_everything():
    """A suspended Child cannot control anything."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)},
        child_status=STATUS_SUSPENDED_DISABLED,
    )
    decision = await _authorize(hass, service_data={"entity_id": "light.lamp"})
    assert decision.allowed is False
    assert decision.reason == REASON_ACCOUNT_NOT_ACTIVE


async def test_evaluator_failure_fails_closed():
    """An evaluator exception denies the call."""
    hass, _store, evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )

    async def _boom(*args, **kwargs):
        raise RuntimeError("registry unavailable")

    evaluator.evaluate_entity_access = _boom
    decision = await _authorize(hass, service_data={"entity_id": "light.lamp"})
    assert decision.allowed is False
    assert decision.reason == REASON_EVALUATION_ERROR


async def test_policy_storage_failure_fails_closed():
    """A broken policy store denies the call instead of granting it."""
    hass, store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )

    def _boom():
        raise RuntimeError("storage unavailable")

    store.get_father = _boom
    decision = await _authorize(hass, service_data={"entity_id": "light.lamp"})
    assert decision.allowed is False
    assert decision.reason == REASON_STORAGE_ERROR


async def test_integration_not_loaded_leaves_home_assistant_untouched():
    """Without a loaded Domolux entry the guard does not restrict anybody."""
    hass = MagicMock()
    hass.data = {}
    decision = await _authorize(hass, service_data={"entity_id": "light.lamp"})
    assert decision.allowed is True
    assert decision.reason == REASON_NOT_MANAGED


# --------------------------------------------------------------------------
# Guard installation behaviour (the actual interception point)
# --------------------------------------------------------------------------
class _FakeServiceRegistry:
    """Stand-in for ``homeassistant.core.ServiceRegistry``."""

    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def async_call(
        self,
        domain,
        service,
        service_data=None,
        blocking=False,
        context=None,
        target=None,
        return_response=False,
    ):
        self.calls.append(
            {
                "domain": domain,
                "service": service,
                "service_data": service_data,
                "context": context,
                "target": target,
            }
        )
        return "executed"


def _make_fake_service_registry():
    """Return a *fresh* registry class.

    The guard patches the class attribute, so every test needs its own class
    to avoid one test's patch leaking into the next one.
    """

    class _Registry(_FakeServiceRegistry):
        pass

    return _Registry


def _context(user_id):
    return types.SimpleNamespace(user_id=user_id)


async def test_guard_blocks_native_service_call_and_never_executes(monkeypatch):
    """A forbidden native service call is blocked and produces no side effect."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    registry_cls = _make_fake_service_registry()
    monkeypatch.setattr(service_guard, "ServiceRegistry", registry_cls)
    service_guard.install_service_guard()

    registry = registry_cls()
    registry._hass = hass

    from homeassistant.exceptions import Unauthorized

    with pytest.raises(Unauthorized):
        await registry.async_call(
            "light",
            "turn_on",
            {"entity_id": "cover.curtain"},
            context=_context(CHILD),
        )

    assert registry.calls == [], "the denied call must never reach Home Assistant"


async def test_guard_allows_permitted_native_service_call(monkeypatch):
    """A permitted native service call reaches Home Assistant unchanged."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    registry_cls = _make_fake_service_registry()
    monkeypatch.setattr(service_guard, "ServiceRegistry", registry_cls)
    service_guard.install_service_guard()

    registry = registry_cls()
    registry._hass = hass

    result = await registry.async_call(
        "light",
        "turn_on",
        {"entity_id": "light.lamp"},
        context=_context(CHILD),
    )

    assert result == "executed"
    assert len(registry.calls) == 1
    assert registry.calls[0]["service_data"] == {"entity_id": "light.lamp"}


async def test_guard_ignores_system_calls_without_user_context(monkeypatch):
    """Internal/Home Assistant calls without a user context are untouched."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    registry_cls = _make_fake_service_registry()
    monkeypatch.setattr(service_guard, "ServiceRegistry", registry_cls)
    service_guard.install_service_guard()

    registry = registry_cls()
    registry._hass = hass

    result = await registry.async_call("light", "turn_on", {"entity_id": "cover.curtain"})

    assert result == "executed"
    assert len(registry.calls) == 1


async def test_guard_denial_is_audited(monkeypatch):
    """Denied service calls are recorded in the audit trail."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    registry_cls = _make_fake_service_registry()
    monkeypatch.setattr(service_guard, "ServiceRegistry", registry_cls)
    service_guard.install_service_guard()

    registry = registry_cls()
    registry._hass = hass

    from homeassistant.exceptions import Unauthorized

    with pytest.raises(Unauthorized):
        await registry.async_call(
            "light",
            "turn_on",
            {"entity_id": "cover.curtain"},
            context=_context(CHILD),
        )

    from custom_components.domolux_roles.audit import get_audit_log

    denied = get_audit_log(hass).denied()
    assert len(denied) == 1
    assert denied[0]["action"] == "service.call.denied"
    assert denied[0]["actor_id"] == CHILD
    assert denied[0]["reason"] == REASON_ENTITY_NOT_GRANTED


async def test_uninstall_restores_the_original_service_registry(monkeypatch):
    """Unloading the integration restores normal Home Assistant behaviour."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    registry_cls = _make_fake_service_registry()
    monkeypatch.setattr(service_guard, "ServiceRegistry", registry_cls)
    original = registry_cls.async_call

    service_guard.install_service_guard()
    assert registry_cls.async_call is not original

    service_guard.uninstall_service_guard()
    assert registry_cls.async_call is original
    assert service_guard.is_installed() is False


async def test_guard_is_inert_for_other_households(monkeypatch):
    """A second Home Assistant instance is unaffected by the guard."""
    hass, _store, _evaluator = _build_hass(
        child_rules={"r1": ("light.lamp", ACCESS_LEVEL_CONTROL)}
    )
    registry_cls = _make_fake_service_registry()
    monkeypatch.setattr(service_guard, "ServiceRegistry", registry_cls)
    service_guard.install_service_guard()

    other_hass = MagicMock()
    other_hass.data = {}
    registry = registry_cls()
    registry._hass = other_hass

    result = await registry.async_call(
        "light", "turn_on", {"entity_id": "cover.curtain"}, context=_context(CHILD)
    )
    assert result == "executed"
