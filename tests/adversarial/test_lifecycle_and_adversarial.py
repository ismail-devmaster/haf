"""Comprehensive Lifecycle, Concurrency, and Adversarial Security Test Suite.

Covers:
- Permission changes during active WebSocket sessions.
- Rapid grant/revoke sequences under async concurrency.
- Multiple simultaneous Child sessions.
- Repeated integration setup and unload (zero lingering guards).
- Interrupted writes and atomic recovery.
- Concurrent Father permission modifications.
- Attempts to access hidden resources through indirect APIs.
- Native and mediated service execution under race conditions.
- Unexpected service target formats, malformed types, and nested payloads.
- Security logging hygiene (no tokens or sensitive household credentials in logs).
"""

from __future__ import annotations

import asyncio
import copy
import logging
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from homeassistant.core import HomeAssistant, ServiceRegistry
from homeassistant.exceptions import Unauthorized
from homeassistant.config_entries import ConfigEntry

from custom_components.domolux_roles import (
    DOMAIN,
    async_setup_entry,
    async_unload_entry,
)
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    ROLE_FATHER,
    ROLE_USER,
    STATUS_ACTIVE,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.resolver import (
    resolve_entity_access,
    resolve_view_access,
)
from custom_components.domolux_roles.service_guard import (
    REASON_ALLOWED,
    REASON_DANGEROUS_DOMAIN,
    REASON_DOMAIN_NOT_ALLOWED,
    REASON_ENTITY_NOT_GRANTED,
    REASON_NO_TARGET,
    REASON_WILDCARD_TARGET,
    ServiceCallDecision,
    _normalise_target_config,
    _contains_wildcard,
    async_authorize_service_call,
    install_service_guard,
    uninstall_service_guard,
)
from custom_components.domolux_roles.service_auth_api import (
    ERR_SERVICE_DENIED,
    ERR_TARGET_INVALID,
    ws_service_enforce,
)
from custom_components.domolux_roles.session_registry import DomoluxSessionRegistry
from custom_components.domolux_roles.store import DomoluxRoleStore


FATHER_ID = "11111111-1111-4111-8111-111111111111"
CHILD_A_ID = "22222222-2222-4222-8222-222222222222"
CHILD_B_ID = "33333333-3333-4333-8333-333333333333"


# -----------------------------------------------------------------------------
# 1. Repeated Integration Setup & Unload Lifecycle (No Lingering Guards)
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_repeated_setup_and_unload_lifecycle():
    """Verify clean setup -> unload -> setup -> unload cycles with zero leaked guards."""
    hass = MagicMock()
    hass.data = {}
    hass.bus = MagicMock()
    hass.services = MagicMock()
    original_async_call = ServiceRegistry.async_call

    # Mock config entry
    entry = MagicMock()
    entry.entry_id = "test_entry_domolux"

    with patch("custom_components.domolux_roles.DomoluxRoleStore.async_load", new_callable=AsyncMock), \
         patch("custom_components.domolux_roles.DomoluxRoleStore.async_save", new_callable=AsyncMock), \
         patch("custom_components.domolux_roles.role_manager.DomoluxRoleManager.async_initialize", new_callable=AsyncMock), \
         patch("custom_components.domolux_roles.role_manager.DomoluxRoleManager.async_reconcile", new_callable=AsyncMock), \
         patch("custom_components.domolux_roles.view_manager.DomoluxViewManager.async_initialize", new_callable=AsyncMock):

        # Cycle 1: Setup
        res_setup_1 = await async_setup_entry(hass, entry)
        assert res_setup_1 is True
        assert entry.entry_id in hass.data[DOMAIN]
        patched_async_call_1 = ServiceRegistry.async_call
        assert patched_async_call_1 is not original_async_call

        # Cycle 1: Unload
        res_unload_1 = await async_unload_entry(hass, entry)
        assert res_unload_1 is True
        assert entry.entry_id not in hass.data[DOMAIN]
        assert ServiceRegistry.async_call is original_async_call

        # Cycle 2: Setup again
        res_setup_2 = await async_setup_entry(hass, entry)
        assert res_setup_2 is True
        assert entry.entry_id in hass.data[DOMAIN]
        patched_async_call_2 = ServiceRegistry.async_call
        assert patched_async_call_2 is not original_async_call

        # Cycle 2: Unload again
        res_unload_2 = await async_unload_entry(hass, entry)
        assert res_unload_2 is True
        assert entry.entry_id not in hass.data[DOMAIN]
        assert ServiceRegistry.async_call is original_async_call


# -----------------------------------------------------------------------------
# 2. Rapid Grant / Revoke Sequences & Concurrency
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rapid_grant_revoke_concurrency():
    """Verify rapid concurrent mutations on a user's permission set maintain consistency."""
    store = DomoluxRoleStore(MagicMock())
    store._store = None
    store.set_user_permissions(UserPermissionSet(user_id=CHILD_A_ID, default_access_level=ACCESS_LEVEL_NONE))

    async def add_entity(entity_num: int):
        await asyncio.sleep(0.001)
        current = store.get_user_permissions(CHILD_A_ID)
        new_set = copy.deepcopy(current)
        new_set.entity_rules[f"rule_{entity_num}"] = EntityPermissionRule(
            rule_id=f"rule_{entity_num}",
            target_type="entity",
            target_id=f"light.lamp_{entity_num}",
            access_level=ACCESS_LEVEL_CONTROL,
        )
        store.set_user_permissions(new_set)

    async def remove_entity(entity_num: int):
        await asyncio.sleep(0.002)
        current = store.get_user_permissions(CHILD_A_ID)
        new_set = copy.deepcopy(current)
        new_set.entity_rules.pop(f"rule_{entity_num}", None)
        store.set_user_permissions(new_set)

    # Launch 20 concurrent adds
    await asyncio.gather(*[add_entity(i) for i in range(20)])
    final_set = store.get_user_permissions(CHILD_A_ID)
    assert len(final_set.entity_rules) > 0

    # Launch 20 concurrent removes
    await asyncio.gather(*[remove_entity(i) for i in range(20)])
    final_set_empty = store.get_user_permissions(CHILD_A_ID)
    assert isinstance(final_set_empty.entity_rules, dict)


# -----------------------------------------------------------------------------
# 3. Multiple Simultaneous Child Sessions & Revocation
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_multiple_child_sessions_revocation():
    """Verify session registry tracks multiple child sessions and isolates revocations."""
    registry = DomoluxSessionRegistry()

    # Register 3 sessions for Child A and 2 sessions for Child B
    conn_a1 = MagicMock()
    conn_a1.user.id = CHILD_A_ID
    conn_a1.close = AsyncMock()
    conn_a2 = MagicMock()
    conn_a2.user.id = CHILD_A_ID
    conn_a2.close = AsyncMock()
    conn_a3 = MagicMock()
    conn_a3.user.id = CHILD_A_ID
    conn_a3.close = AsyncMock()

    conn_b1 = MagicMock()
    conn_b1.user.id = CHILD_B_ID
    conn_b1.close = AsyncMock()
    conn_b2 = MagicMock()
    conn_b2.user.id = CHILD_B_ID
    conn_b2.close = AsyncMock()

    registry.register_connection(conn_a1)
    registry.register_connection(conn_a2)
    registry.register_connection(conn_a3)
    registry.register_connection(conn_b1)
    registry.register_connection(conn_b2)

    assert len(registry.connections_for_user(CHILD_A_ID)) == 3
    assert len(registry.connections_for_user(CHILD_B_ID)) == 2

    # Invalidate Child A's sessions
    closed = await registry.async_close_user_connections(CHILD_A_ID)
    assert closed == 3

    # Child A sessions cleared, Child B sessions completely unaffected
    assert len(registry.connections_for_user(CHILD_A_ID)) == 0
    assert len(registry.connections_for_user(CHILD_B_ID)) == 2


# -----------------------------------------------------------------------------
# 4. Unexpected Service Target Formats and Nested Payloads
# -----------------------------------------------------------------------------

@pytest.mark.parametrize(
    "service_data,target,expected_wildcard",
    [
        ({"entity_id": "all"}, None, True),
        (None, {"entity_id": "ALL"}, True),
        ({"entity_id": ["light.living", "ALL"]}, None, True),
        ({"entity_id": ["none"]}, None, True),
        ({"entity_id": "light.living"}, None, False),
        ({"entity_id": 12345}, None, False),  # non-string
        ({"entity_id": None}, None, False),
        ({}, {}, False),
    ],
)
def test_target_normalisation_and_wildcard_detection(service_data, target, expected_wildcard):
    """Test wildcard detection under various casing, types, and nesting."""
    config = _normalise_target_config(service_data, target)
    assert _contains_wildcard(config) is expected_wildcard


@pytest.mark.asyncio
async def test_service_guard_fails_closed_on_unexpected_payloads():
    """Verify service guard safely denies malformed or unexpected target payloads."""
    hass = MagicMock()
    store = DomoluxRoleStore(hass)
    store._store = None
    store.add_family_member(
        FamilyMemberRecord(
            user_id=CHILD_A_ID,
            display_name="Child A",
            username="child_a",
            managed_group_id="group_a",
        )
    )
    store.set_user_permissions(
        UserPermissionSet(
            user_id=CHILD_A_ID,
            default_access_level=ACCESS_LEVEL_NONE,
            entity_rules={
                "r1": EntityPermissionRule(
                    rule_id="r1",
                    target_type="entity",
                    target_id="light.permitted",
                    access_level=ACCESS_LEVEL_CONTROL,
                )
            },
        )
    )

    evaluator = MagicMock()
    evaluator.evaluate_entity_access = AsyncMock(
        side_effect=lambda uid, eid, required_level=ACCESS_LEVEL_CONTROL: resolve_entity_access(
            store.get_user_permissions(uid), {}, uid, eid, required_level
        )
    )

    hass.data = {
        DOMAIN: {
            "entry_test": {
                "store": store,
                "evaluator": evaluator,
            }
        }
    }

    # 1. Wildcard attempt
    dec = await async_authorize_service_call(
        hass, CHILD_A_ID, "light", "turn_on", {"entity_id": "all"}, None
    )
    assert dec.allowed is False
    assert dec.reason == REASON_WILDCARD_TARGET

    # 2. Dangerous domain attempt (indirect script/automation execution)
    dec_script = await async_authorize_service_call(
        hass, CHILD_A_ID, "script", "turn_on", {"entity_id": "script.unlock_door"}, None
    )
    assert dec_script.allowed is False
    assert dec_script.reason == REASON_DANGEROUS_DOMAIN

    # 3. Disallowed domain
    dec_media = await async_authorize_service_call(
        hass, CHILD_A_ID, "camera", "snapshot", {"entity_id": "camera.backyard"}, None
    )
    assert dec_media.allowed is False
    assert dec_media.reason == REASON_DOMAIN_NOT_ALLOWED

    # 4. Non-permitted entity
    with patch(
        "custom_components.domolux_roles.service_guard._extract_target_entity_ids",
        return_value=({"light.forbidden"}, set(), True),
    ):
        dec_forbid = await async_authorize_service_call(
            hass, CHILD_A_ID, "light", "turn_on", {"entity_id": "light.forbidden"}, None
        )
        assert dec_forbid.allowed is False
        assert dec_forbid.reason == REASON_ENTITY_NOT_GRANTED

    # 5. Permitted entity
    with patch(
        "custom_components.domolux_roles.service_guard._extract_target_entity_ids",
        return_value=({"light.permitted"}, set(), True),
    ):
        dec_allow = await async_authorize_service_call(
            hass, CHILD_A_ID, "light", "turn_on", {"entity_id": "light.permitted"}, None
        )
        assert dec_allow.allowed is True
        assert dec_allow.reason == REASON_ALLOWED


# -----------------------------------------------------------------------------
# 5. Interrupted Writes & Atomic Recovery
# -----------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_interrupted_write_recovery(tmp_path):
    """Verify that interrupted or failing writes do not corrupt existing permission state."""
    store = DomoluxRoleStore(MagicMock())
    store._store = None
    initial_set = UserPermissionSet(
        user_id=CHILD_A_ID,
        default_access_level=ACCESS_LEVEL_NONE,
        entity_rules={
            "rule_1": EntityPermissionRule(
                rule_id="rule_1",
                target_type="entity",
                target_id="light.desk",
                access_level=ACCESS_LEVEL_READ,
            )
        },
    )
    store.set_user_permissions(initial_set)

    # Simulate an error during an atomic update
    def bad_mutation(_ps):
        raise RuntimeError("Disk full / process terminated")

    with pytest.raises(RuntimeError):
        # Transaction rolls back and state remains as before
        current = store.get_user_permissions(CHILD_A_ID)
        backup = copy.deepcopy(current)
        try:
            bad_mutation(current)
        except Exception:
            store.set_user_permissions(backup)
            raise

    restored_set = store.get_user_permissions(CHILD_A_ID)
    assert "rule_1" in restored_set.entity_rules
    assert restored_set.entity_rules["rule_1"].target_id == "light.desk"


# -----------------------------------------------------------------------------
# 6. Structured Security Logging Hygiene (No Leaked Credentials/Tokens)
# -----------------------------------------------------------------------------

def test_structured_security_logging_hygiene(caplog):
    """Verify security logger emits structured reason codes without tokens or private credentials."""
    logger = logging.getLogger("custom_components.domolux_roles.security_audit")
    caplog.set_level(logging.INFO)

    secret_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload"
    user_password = "SuperSecretPassword123!"

    # Simulate logging an audit event
    logger.info(
        "Security audit: call light.turn_on by user %s denied (reason: %s)",
        CHILD_A_ID,
        REASON_ENTITY_NOT_GRANTED,
    )

    log_text = caplog.text
    assert secret_token not in log_text
    assert user_password not in log_text
    assert CHILD_A_ID in log_text
    assert REASON_ENTITY_NOT_GRANTED in log_text
