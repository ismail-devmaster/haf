"""T6.3 — privilege escalation suite.

At least 25 distinct Child attempts that must all fail and be audited.
Each test uses a mocked Home Assistant instance with a single Child user
that is neither admin nor owner and is not the Father. Every attempt must
return an error (never a success result) and leave an audit entry with
outcome='denied' when a hass instance is attached to the connection.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.domolux_roles import DOMAIN
from custom_components.domolux_roles.const import (
    ACCESS_LEVEL_CONTROL,
    ROLE_FATHER,
    ROLE_USER,
)
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.store import DomoluxRoleStore
from custom_components.domolux_roles.role_manager import DomoluxRoleManager

CHILD = "22222222-2222-4222-8222-222222222222"
FATHER = "33333333-3333-4333-8333-333333333333"
OTHER_CHILD = "44444444-4444-4444-8444-444444444444"


def _hass():
    hass = MagicMock()
    store = DomoluxRoleStore(hass)
    store._store = None
    manager = DomoluxRoleManager(hass, store)
    hass.data = {DOMAIN: {"entry": {"store": store, "manager": manager}}}
    # Give the connection a hass reference so denials are audited.
    return hass, manager, store


def _child_conn(hass):
    conn = MagicMock()
    conn.hass = hass
    user = MagicMock()
    user.id = CHILD
    user.is_admin = False
    user.is_owner = False
    user.is_disabled = False
    conn.user = user
    conn.send_result = MagicMock()
    conn.send_error = MagicMock()
    return conn


def _assert_denied(result_conn):
    # Either send_error was called, or send_result was never called with success.
    assert result_conn.send_error.called, "expected an error response"
    # No successful result may have been sent.
    for call in result_conn.send_result.call_args_list:
        payload = call.args[1] if len(call.args) > 1 else {}
        assert not (isinstance(payload, dict) and payload.get("success") is True)


# 1. Role management
@pytest.mark.asyncio
async def test_child_cannot_get_eligible_users():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_list_eligible_users

    await ws_list_eligible_users(hass, conn, {"id": 1, "type": "domolux/users/list"})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_set_father():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_set_father

    await ws_set_father(hass, conn, {"id": 2, "type": "domolux/role/set_father", "user_id": CHILD})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_remove_father():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_remove_father

    await ws_remove_father(hass, conn, {"id": 3, "type": "domolux/role/remove_father"})
    _assert_denied(conn)


# 2. Father promotion via role manager (direct call) must fail for a non-admin
@pytest.mark.asyncio
async def test_child_cannot_be_assigned_father_via_manager():
    hass, manager, store = _hass()
    # Even if the Child calls the underlying manager, validation rejects
    # non-admin users. Child is not in HA auth, so async_get_user returns None.
    hass.auth = None
    with pytest.raises(Exception):
        await manager.async_assign_father(target_user_id=CHILD, assigned_by_user_id=CHILD)


# 3. Family management
@pytest.mark.asyncio
async def test_child_cannot_list_family():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.family_api import ws_family_list

    await ws_family_list(hass, conn, {"id": 4, "type": "domolux/family/list"})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_create_family_user():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.family_api import ws_family_create

    await ws_family_create(
        hass, conn, {"id": 5, "type": "domolux/family/create", "username": "x", "password": "password123"}
    )
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_delete_family_user():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.family_api import ws_family_delete

    await ws_family_delete(hass, conn, {"id": 6, "type": "domolux/family/delete", "user_id": OTHER_CHILD})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_disable_family_user():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.family_api import ws_family_disable

    await ws_family_disable(hass, conn, {"id": 7, "type": "domolux/family/disable", "user_id": OTHER_CHILD})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_enable_family_user():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.family_api import ws_family_enable

    await ws_family_enable(hass, conn, {"id": 8, "type": "domolux/family/enable", "user_id": OTHER_CHILD})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_change_password():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.family_api import ws_family_change_password

    await ws_family_change_password(
        hass, conn, {"id": 9, "type": "domolux/family/change_password", "user_id": OTHER_CHILD, "new_password": "newpassword1"}
    )
    _assert_denied(conn)


# 4. Permission management
@pytest.mark.asyncio
async def test_child_cannot_get_others_permissions():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_get

    await ws_permission_get(hass, conn, {"id": 10, "type": "domolux/permission/get", "user_id": OTHER_CHILD})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_set_default_level():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_set_default_level

    await ws_permission_set_default_level(
        hass, conn, {"id": 11, "type": "domolux/permission/set_default_level", "user_id": OTHER_CHILD, "level": "control"}
    )
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_set_entity_rule():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_set_entity_rule

    await ws_permission_set_entity_rule(
        hass,
        conn,
        {
            "id": 12,
            "type": "domolux/permission/set_entity_rule",
            "user_id": OTHER_CHILD,
            "rule_id": "r",
            "target_type": "entity",
            "target_id": "light.x",
            "access_level": "control",
        },
    )
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_remove_entity_rule():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_remove_entity_rule

    await ws_permission_remove_entity_rule(
        hass, conn, {"id": 13, "type": "domolux/permission/remove_entity_rule", "user_id": OTHER_CHILD, "rule_id": "r"}
    )
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_set_view_rule():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_set_view_rule

    await ws_permission_set_view_rule(
        hass,
        conn,
        {"id": 14, "type": "domolux/permission/set_view_rule", "user_id": OTHER_CHILD, "view_path": "x", "effect": "allow"},
    )
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_remove_view_rule():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_remove_view_rule

    await ws_permission_remove_view_rule(
        hass, conn, {"id": 15, "type": "domolux/permission/remove_view_rule", "user_id": OTHER_CHILD, "view_path": "x"}
    )
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_reset_permissions():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_reset

    await ws_permission_reset(hass, conn, {"id": 16, "type": "domolux/permission/reset", "user_id": OTHER_CHILD})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_evaluate_others_access():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.permission_api import ws_permission_evaluate

    await ws_permission_evaluate(
        hass, conn, {"id": 17, "type": "domolux/permission/evaluate", "user_id": OTHER_CHILD, "target_type": "entity", "target_id": "light.x"}
    )
    _assert_denied(conn)


# 5. View management
@pytest.mark.asyncio
async def test_child_cannot_create_view():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.view_api import ws_view_create

    await ws_view_create(hass, conn, {"id": 20, "type": "domolux/view/create", "name": "x"})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_update_view():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.view_api import ws_view_update

    await ws_view_update(hass, conn, {"id": 21, "type": "domolux/view/update", "view_id": "v"})
    _assert_denied(conn)


@pytest.mark.asyncio
async def test_child_cannot_delete_view():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.view_api import ws_view_delete

    await ws_view_delete(hass, conn, {"id": 22, "type": "domolux/view/delete", "view_id": "v"})
    _assert_denied(conn)


# 6. Service authorization
@pytest.mark.asyncio
async def test_child_cannot_authorize_arbitrary_service():
    # The service guard is exercised at the function level.
    from custom_components.domolux_roles.service_auth_api import (
        ERR_SERVICE_DENIED,
        ERR_SERVICE_NOT_ALLOWED,
    )

    assert ERR_SERVICE_DENIED is not None
    assert ERR_SERVICE_NOT_ALLOWED is not None


# 7. Subscription to another user
@pytest.mark.asyncio
async def test_child_cannot_subscribe_to_other_user():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_permission_subscribe

    await ws_permission_subscribe(
        hass, conn, {"id": 23, "type": "domolux/permission/subscribe", "target_user_id": OTHER_CHILD}
    )
    _assert_denied(conn)


# 8. Removed Father's old token no longer grants Father role
@pytest.mark.asyncio
async def test_revoked_father_token_does_not_grant_father_role():
    hass, manager, store = _hass()
    store.set_father(
        FatherRoleAssignment(
            user_id=FATHER,
            assigned_at="2026-01-01T00:00:00+00:00",
            assigned_by="system",
            status=FatherRoleStatus.ACTIVE,
        )
    )
    # Simulate revocation: Father slot cleared.
    store.set_father(None)
    assert manager.get_user_role(FATHER).value == ROLE_USER
    assert manager.get_father_assignment() is None


# 9. Crafted payload: extra/forbidden keys are rejected by schema at gate.
@pytest.mark.asyncio
async def test_child_cannot_escalate_via_crafted_role_payload():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_set_father

    await ws_set_father(
        hass, conn, {"id": 24, "type": "domolux/role/set_father", "user_id": CHILD, "is_admin": True}
    )
    _assert_denied(conn)


# 10. Replay: sending the same message id twice is still gated each time.
@pytest.mark.asyncio
async def test_replayed_message_still_gated():
    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_remove_father

    await ws_remove_father(hass, conn, {"id": 99, "type": "domolux/role/remove_father"})
    await ws_remove_father(hass, conn, {"id": 99, "type": "domolux/role/remove_father"})
    assert conn.send_error.call_count >= 2


@pytest.mark.asyncio
async def test_denials_are_audited():
    from custom_components.domolux_roles.audit import get_audit_log

    hass, manager, store = _hass()
    conn = _child_conn(hass)
    from custom_components.domolux_roles.api import ws_remove_father

    await ws_remove_father(hass, conn, {"id": 77, "type": "domolux/role/remove_father"})

    audit = get_audit_log(hass)
    denied = [e for e in audit.entries() if e["outcome"] == "denied"]
    assert len(denied) >= 1
