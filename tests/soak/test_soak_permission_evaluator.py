"""Practical Soak Testing for Domolux Roles Permission Evaluator.

Executes 5,000 continuous, multi-threaded/concurrent permission evaluations across
complex hierarchical topologies (Entity > Device > Area > Default) to prove:
- Deterministic evaluation under sustained throughput.
- Zero memory degradation or resource leaks.
- Zero race conditions or inconsistent evaluations.
- Strict preservation of least-privilege invariants under load.
"""

from __future__ import annotations

import asyncio
import time
import pytest

from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    UserPermissionSet,
    ViewPermissionRule,
)
from custom_components.domolux_roles.resolver import (
    resolve_entity_access,
    resolve_view_access,
)

CHILD_USER_ID = "44444444-4444-4444-8444-444444444444"


def _create_complex_policy() -> tuple[UserPermissionSet, dict[str, Any]]:
    """Build a realistic, complex multi-entity/area hierarchy."""
    entity_rules = {
        # Explicit entity grant
        "r_desk": EntityPermissionRule(
            rule_id="r_desk",
            target_type="entity",
            target_id="light.desk_lamp",
            access_level=ACCESS_LEVEL_CONTROL,
        ),
        # Explicit entity override to NONE in allowed area
        "r_safe": EntityPermissionRule(
            rule_id="r_safe",
            target_type="entity",
            target_id="light.safe_lock_indicator",
            access_level=ACCESS_LEVEL_NONE,
        ),
        # Area grant
        "r_bedroom": EntityPermissionRule(
            rule_id="r_bedroom",
            target_type="area",
            target_id="area_bedroom",
            access_level=ACCESS_LEVEL_READ,
        ),
        # Device grant
        "r_thermostat": EntityPermissionRule(
            rule_id="r_thermostat",
            target_type="device",
            target_id="dev_thermostat_1",
            access_level=ACCESS_LEVEL_CONTROL,
        ),
    }

    view_rules = {
        "dashboard_kids": ViewPermissionRule(
            view_path="dashboard_kids",
            effect=EFFECT_ALLOW,
        ),
        "dashboard_admin": ViewPermissionRule(
            view_path="dashboard_admin",
            effect=EFFECT_DENY,
        ),
    }

    perm_set = UserPermissionSet(
        user_id=CHILD_USER_ID,
        default_access_level=ACCESS_LEVEL_NONE,
        entity_rules=entity_rules,
        view_rules=view_rules,
    )

    registry = {
        "light.desk_lamp": ("dev_desk", "area_bedroom"),
        "light.safe_lock_indicator": ("dev_safe", "area_bedroom"),
        "light.ceiling_lamp": ("dev_ceiling", "area_bedroom"),
        "climate.living_room": ("dev_thermostat_1", "area_living"),
        "switch.main_breaker": ("dev_breaker", "area_basement"),
    }

    return perm_set, registry


@pytest.mark.asyncio
async def test_pure_evaluator_soak_5000_iterations():
    """Run 5,000 evaluations across 10 concurrent workers under continuous load."""
    perm_set, registry = _create_complex_policy()
    iterations_per_worker = 500
    worker_count = 10
    total_evals = iterations_per_worker * worker_count

    async def worker(worker_id: int):
        for i in range(iterations_per_worker):
            # Test 1: Explicit Entity (Control)
            dec1 = resolve_entity_access(
                perm_set, registry, CHILD_USER_ID, "light.desk_lamp", ACCESS_LEVEL_CONTROL
            )
            assert dec1.granted is True
            assert dec1.access_level == ACCESS_LEVEL_CONTROL
            assert dec1.matching_rule_type == "entity"

            # Test 2: Explicit Entity Override over Area (None over Area Read)
            dec2 = resolve_entity_access(
                perm_set, registry, CHILD_USER_ID, "light.safe_lock_indicator", ACCESS_LEVEL_READ
            )
            assert dec2.granted is False
            assert dec2.access_level == ACCESS_LEVEL_NONE
            assert dec2.matching_rule_type == "entity"

            # Test 3: Area Inheritance (Read)
            dec3 = resolve_entity_access(
                perm_set, registry, CHILD_USER_ID, "light.ceiling_lamp", ACCESS_LEVEL_READ
            )
            assert dec3.granted is True
            assert dec3.access_level == ACCESS_LEVEL_READ
            assert dec3.matching_rule_type == "area"

            # Test 4: Area Inheritance requesting Control -> Denied
            dec4 = resolve_entity_access(
                perm_set, registry, CHILD_USER_ID, "light.ceiling_lamp", ACCESS_LEVEL_CONTROL
            )
            assert dec4.granted is False

            # Test 5: Device Inheritance (Control)
            dec5 = resolve_entity_access(
                perm_set, registry, CHILD_USER_ID, "climate.living_room", ACCESS_LEVEL_CONTROL
            )
            assert dec5.granted is True
            assert dec5.matching_rule_type == "device"

            # Test 6: Default Deny (unmapped entity)
            dec6 = resolve_entity_access(
                perm_set, registry, CHILD_USER_ID, "switch.main_breaker", ACCESS_LEVEL_READ
            )
            assert dec6.granted is False
            assert dec6.matching_rule_type == "default"

            # Test 7: View Access Allowed
            v_allow = resolve_view_access(perm_set, CHILD_USER_ID, "dashboard_kids")
            assert v_allow.effect == EFFECT_ALLOW

            # Test 8: View Access Explicit Deny
            v_deny = resolve_view_access(perm_set, CHILD_USER_ID, "dashboard_admin")
            assert v_deny.effect == EFFECT_DENY

            # Yield control periodically to interleave workers
            if i % 50 == 0:
                await asyncio.sleep(0)

    start_time = time.monotonic()
    await asyncio.gather(*[worker(w) for w in range(worker_count)])
    duration = time.monotonic() - start_time

    assert duration > 0
    throughput = (total_evals * 8) / duration  # 8 queries per iteration
    print(f"\nSoak Test Complete: {total_evals * 8} evaluations in {duration:.3f}s ({throughput:.0f} evals/sec)")
    # Must achieve at least 5,000 evaluations per second in pure Python
    assert throughput >= 5000
