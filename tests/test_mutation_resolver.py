"""Mutation testing framework for pure permission resolver (resolver.py).

Verifies that the resolver decision logic is completely tested and that
every deliberate defect / mutation in the authorization rules causes an
immediate test failure (100% mutant kill rate).
"""

import copy
import inspect
from typing import Any, Callable, Dict, List, Tuple
import pytest

from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    UserPermissionSet,
    ViewPermissionRule,
)
from custom_components.domolux_roles import resolver


# -----------------------------------------------------------------------------
# Base Test Suite that exercises resolver behaviour
# -----------------------------------------------------------------------------

def run_resolver_test_suite(resolve_fn: Callable) -> None:
    """Run full matrix of permission checks against a resolver implementation."""
    user_id = "test_child"
    grants = UserPermissionSet(
        user_id=user_id,
        default_access_level=ACCESS_LEVEL_NONE,
        entity_rules={
            "e1": EntityPermissionRule(
                rule_id="e1",
                target_type=TARGET_ENTITY,
                target_id="light.desk",
                access_level=ACCESS_LEVEL_CONTROL,
            ),
            "e2": EntityPermissionRule(
                rule_id="e2",
                target_type=TARGET_ENTITY,
                target_id="light.reading",
                access_level=ACCESS_LEVEL_READ,
            ),
            "d1": EntityPermissionRule(
                rule_id="d1",
                target_type=TARGET_DEVICE,
                target_id="device_bedroom",
                access_level=ACCESS_LEVEL_READ,
            ),
            "a1": EntityPermissionRule(
                rule_id="a1",
                target_type=TARGET_AREA,
                target_id="area_kitchen",
                access_level=ACCESS_LEVEL_CONTROL,
            ),
            # Area grant with READ access for conflicting precedence test
            "a2": EntityPermissionRule(
                rule_id="a2",
                target_type=TARGET_AREA,
                target_id="area_bedroom",
                access_level=ACCESS_LEVEL_NONE,
            ),
        },
        view_rules={
            "dashboard_main": ViewPermissionRule(
                view_path="dashboard_main",
                effect=EFFECT_ALLOW,
            ),
            "dashboard_secret": ViewPermissionRule(
                view_path="dashboard_secret",
                effect=EFFECT_DENY,
            ),
        },
    )

    snapshot = {
        "light.desk": ("device_desk", "area_office"),
        "light.reading": ("device_lamp", "area_living"),
        # device_bedroom is in area_bedroom (device rule READ must override area rule NONE)
        "light.bedroom_ceiling": ("device_bedroom", "area_bedroom"),
        "light.kitchen_strip": ("device_kitchen_strip", "area_kitchen"),
        "light.hallway": (None, None),
    }

    # 1. Father override
    res = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_CONTROL, "light.hallway", is_father=True)
    assert res.granted is True
    assert res.matching_rule_type == "father_override"

    # 2. Admin override
    res = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_CONTROL, "light.hallway", is_admin=True)
    assert res.granted is True
    assert res.matching_rule_type == "admin_override"

    # 3. Explicit entity control
    res = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_CONTROL, "light.desk")
    assert res.granted is True
    assert res.matching_rule_type == TARGET_ENTITY

    # 4. Explicit entity read (cannot control)
    res_ctrl = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_CONTROL, "light.reading")
    assert res_ctrl.granted is False
    res_read = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_READ, "light.reading")
    assert res_read.granted is True

    # 5. Device rule overrides area rule
    res_dev = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_READ, "light.bedroom_ceiling")
    assert res_dev.granted is True
    assert res_dev.matching_rule_type == TARGET_DEVICE

    # 6. Area rule applies when no entity or device rule matches
    res_area = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_CONTROL, "light.kitchen_strip")
    assert res_area.granted is True
    assert res_area.matching_rule_type == TARGET_AREA

    # 7. Default deny applies when no rule matches
    res_def = resolve_fn(grants, snapshot, user_id, ACCESS_LEVEL_READ, "light.hallway")
    assert res_def.granted is False
    assert res_def.matching_rule_type == "default"

    # 8. View rules
    v_main = resolve_fn(grants, snapshot, user_id, "view", "dashboard_main")
    assert v_main.allowed is True
    assert v_main.effect == EFFECT_ALLOW

    v_sec = resolve_fn(grants, snapshot, user_id, "view", "dashboard_secret")
    assert v_sec.allowed is False
    assert v_sec.effect == EFFECT_DENY

    v_def = resolve_fn(grants, snapshot, user_id, "view", "dashboard_unconfigured")
    assert v_def.allowed is False
    assert v_def.effect == EFFECT_DENY


def test_baseline_resolver_passes():
    """Verify standard resolver satisfies all test requirements."""
    run_resolver_test_suite(resolver.resolve)


# -----------------------------------------------------------------------------
# Mutants: Each mutant introduces a realistic defect in permission resolution
# -----------------------------------------------------------------------------

def mutant_bypass_father(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 1: Disables father override check."""
    return resolver.resolve(grants, snapshot, subject, action, data, is_father=False, is_admin=is_admin)


def mutant_bypass_admin(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 2: Disables admin override check."""
    return resolver.resolve(grants, snapshot, subject, action, data, is_father=is_father, is_admin=False)


def mutant_strict_greater_than_level(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 3: Requires level > required rather than >= required."""
    res = resolver.resolve(grants, snapshot, subject, action, data, is_father=is_father, is_admin=is_admin)
    if action != "view" and not is_father and not is_admin:
        order = {ACCESS_LEVEL_NONE: 0, ACCESS_LEVEL_READ: 1, ACCESS_LEVEL_CONTROL: 2}
        granted = order.get(res.access_level, 0) > order.get(action or ACCESS_LEVEL_READ, 1)
        return resolver.EvaluationResult(
            user_id=res.user_id,
            target_id=res.target_id,
            access_level=res.access_level,
            granted=granted,
            matching_rule_type=res.matching_rule_type,
            matching_rule_id=res.matching_rule_id,
        )
    return res


def mutant_invert_device_area_precedence(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 4: Evaluates Area rules before Device rules."""
    if action == "view" or is_father or is_admin:
        return resolver.resolve(grants, snapshot, subject, action, data, is_father=is_father, is_admin=is_admin)

    user_id = str(subject)
    entity_id = str(data)
    device_id, area_id = (snapshot or {}).get(entity_id, (None, None))

    # Inverted: check area first
    if area_id:
        for rule in grants.entity_rules.values():
            if rule.target_type == TARGET_AREA and rule.target_id == area_id:
                order = {ACCESS_LEVEL_NONE: 0, ACCESS_LEVEL_READ: 1, ACCESS_LEVEL_CONTROL: 2}
                granted = order.get(rule.access_level, 0) >= order.get(action or ACCESS_LEVEL_READ, 1)
                return resolver.EvaluationResult(
                    user_id=user_id,
                    target_id=entity_id,
                    access_level=rule.access_level,
                    granted=granted,
                    matching_rule_type=TARGET_AREA,
                    matching_rule_id=rule.rule_id,
                )

    return resolver.resolve(grants, snapshot, subject, action, data, is_father=is_father, is_admin=is_admin)


def mutant_ignore_entity_rules(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 5: Completely ignores specific entity rules."""
    mutated_grants = copy.deepcopy(grants)
    mutated_grants.entity_rules = {
        k: v for k, v in mutated_grants.entity_rules.items() if v.target_type != TARGET_ENTITY
    }
    return resolver.resolve(mutated_grants, snapshot, subject, action, data, is_father=is_father, is_admin=is_admin)


def mutant_allow_all_views_by_default(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 6: Allows unconfigured views instead of default-denying."""
    res = resolver.resolve(grants, snapshot, subject, action, data, is_father=is_father, is_admin=is_admin)
    if action == "view" and res.matching_rule_type == "default":
        return resolver.ViewEvaluationResult(
            user_id=res.user_id,
            view_path=res.view_path,
            effect=EFFECT_ALLOW,
            allowed=True,
            matching_rule_type="default",
        )
    return res


def mutant_invert_view_rule_effect(grants, snapshot, subject, action, data, *, is_father=False, is_admin=False):
    """Mutant 7: Inverts view rule effects (allow becomes deny, deny becomes allow)."""
    res = resolver.resolve(grants, snapshot, subject, action, data, is_father=is_father, is_admin=is_admin)
    if action == "view" and res.matching_rule_type == "view_rule":
        inverted_allowed = not res.allowed
        inverted_effect = EFFECT_DENY if res.effect == EFFECT_ALLOW else EFFECT_ALLOW
        return resolver.ViewEvaluationResult(
            user_id=res.user_id,
            view_path=res.view_path,
            effect=inverted_effect,
            allowed=inverted_allowed,
            matching_rule_type="view_rule",
        )
    return res


@pytest.mark.parametrize(
    "mutant_fn,mutant_name",
    [
        (mutant_bypass_father, "mutant_bypass_father"),
        (mutant_bypass_admin, "mutant_bypass_admin"),
        (mutant_strict_greater_than_level, "mutant_strict_greater_than_level"),
        (mutant_invert_device_area_precedence, "mutant_invert_device_area_precedence"),
        (mutant_ignore_entity_rules, "mutant_ignore_entity_rules"),
        (mutant_allow_all_views_by_default, "mutant_allow_all_views_by_default"),
        (mutant_invert_view_rule_effect, "mutant_invert_view_rule_effect"),
    ],
)
def test_all_mutants_are_killed(mutant_fn, mutant_name):
    """Assert that every mutant fails the test suite (100% mutation kill rate)."""
    with pytest.raises((AssertionError, Exception)):
        run_resolver_test_suite(mutant_fn)
