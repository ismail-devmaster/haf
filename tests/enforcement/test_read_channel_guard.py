"""Tests for the history/logbook read-channel guard.

Home Assistant's history and logbook REST endpoints do not consult the native
entity permission policy.  These tests prove that a managed Child cannot read
them for an entity the Domolux policy hides, while the Father and unmanaged
users are untouched.
"""

import sys
import types
from unittest.mock import MagicMock

import pytest

from custom_components.domolux_roles import DOMAIN, read_channel_guard
from custom_components.domolux_roles.const import ACCESS_LEVEL_CONTROL, ACCESS_LEVEL_READ
from custom_components.domolux_roles.models import (
    EntityPermissionRule,
    FamilyMemberRecord,
    FatherRoleAssignment,
    FatherRoleStatus,
    UserPermissionSet,
)
from custom_components.domolux_roles.resolver import resolve_entity_access
from custom_components.domolux_roles.store import DomoluxRoleStore

CHILD = "22222222-2222-4222-8222-222222222222"
FATHER = "33333333-3333-4333-8333-333333333333"
OTHER = "44444444-4444-4444-8444-444444444444"


class _FakeEvaluator:
    def __init__(self, store):
        self.store = store

    async def evaluate_entity_access(
        self, user_id, entity_id, required_level=ACCESS_LEVEL_READ
    ):
        grants = self.store.get_user_permissions(user_id)
        return resolve_entity_access(grants, {}, user_id, entity_id, required_level)


@pytest.fixture(autouse=True)
def _clean_state():
    yield
    read_channel_guard.uninstall_read_channel_guard()


def _hass(child_rules=None):
    hass = MagicMock()
    store = DomoluxRoleStore(hass)
    store._store = None
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
            managed_group_id="domolux-family-child",
        )
    )
    store.set_user_permissions(
        UserPermissionSet(
            user_id=CHILD,
            default_access_level="none",
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
    hass.data = {DOMAIN: {"entry": {"store": store, "evaluator": _FakeEvaluator(store)}}}
    return hass, store


class _FakeRoute:
    """Minimal aiohttp route stand-in."""

    def __init__(self, path: str, handler) -> None:
        self._path = path
        self._handler = handler
        self.resource = types.SimpleNamespace(canonical=path)

    @property
    def handler(self):
        """Mirror aiohttp's ``AbstractRoute.handler`` property."""
        return self._handler


def _router_with(*paths_and_handlers):
    router = MagicMock()
    routes = [
        _FakeRoute(path, handler) for path, handler in paths_and_handlers
    ]
    router.routes.return_value = routes
    return router, routes


def _request(hass, user_id, query):
    request = MagicMock()
    request.get = lambda key, default=None: (
        {"hass_user": MagicMock(id=user_id)}.get(key, default)
        if key == "hass_user"
        else default
    )
    request.app = {"hass": hass}
    request.query = query
    return request


def _hass_with_router(hass, router):
    app = MagicMock()
    app.router = router
    hass.http = MagicMock()
    hass.http.app = app
    return hass


async def test_child_cannot_read_hidden_entity_history():
    """A hidden entity's history is refused with a 404."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period", original))
    _hass_with_router(hass, router)

    read_channel_guard.install_read_channel_guard(hass)
    guarded = routes[0].handler

    response = await guarded(_request(hass, CHILD, {"filter_entity_id": "light.hidden"}))

    assert served == [], "the original handler must not run for a hidden entity"
    assert response.status == 404


async def test_child_can_read_granted_entity_history():
    """A granted entity's history is passed through."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period", original))
    _hass_with_router(hass, router)

    read_channel_guard.install_read_channel_guard(hass)
    response = await routes[0].handler(
        _request(hass, CHILD, {"filter_entity_id": "light.allowed"})
    )

    assert response == "passed-through"
    assert len(served) == 1


async def test_mixed_history_request_is_denied():
    """One unreadable entity denies the whole history request."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period", original))
    _hass_with_router(hass, router)
    read_channel_guard.install_read_channel_guard(hass)

    response = await routes[0].handler(
        _request(hass, CHILD, {"filter_entity_id": "light.allowed,light.hidden"})
    )
    assert response.status == 404
    assert served == []


async def test_unfiltered_history_request_is_denied():
    """A request without an entity filter would return every entity."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/logbook", original))
    _hass_with_router(hass, router)
    read_channel_guard.install_read_channel_guard(hass)

    response = await routes[0].handler(_request(hass, CHILD, {}))
    assert response.status == 404
    assert served == []


async def test_read_only_grant_allows_history_read():
    """READ is enough to read history; CONTROL is not required."""
    hass, _store = _hass(child_rules={"r1": ("light.readonly", ACCESS_LEVEL_READ)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period/{datetime}", original))
    _hass_with_router(hass, router)
    read_channel_guard.install_read_channel_guard(hass)

    response = await routes[0].handler(
        _request(hass, CHILD, {"filter_entity_id": "light.readonly"})
    )
    assert response == "passed-through"
    assert len(served) == 1


async def test_father_and_unmanaged_users_are_not_filtered():
    """The Father and users outside the Domolux scope are untouched."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period", original))
    _hass_with_router(hass, router)
    read_channel_guard.install_read_channel_guard(hass)
    guarded = routes[0].handler

    assert await guarded(
        _request(hass, FATHER, {"filter_entity_id": "light.hidden"})
    ) == "passed-through"
    assert await guarded(
        _request(hass, OTHER, {"filter_entity_id": "light.hidden"})
    ) == "passed-through"
    assert len(served) == 2


async def test_evaluator_failure_fails_closed():
    """A policy evaluation error denies the read instead of allowing it."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def _boom(*args, **kwargs):
        raise RuntimeError("store unavailable")

    hass.data[DOMAIN]["entry"]["evaluator"].evaluate_entity_access = _boom

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period", original))
    _hass_with_router(hass, router)
    read_channel_guard.install_read_channel_guard(hass)

    response = await routes[0].handler(
        _request(hass, CHILD, {"filter_entity_id": "light.allowed"})
    )
    assert response.status == 404
    assert served == []


async def test_install_and_uninstall_round_trip():
    """The original route handler is restored on uninstall."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(("/api/history/period", original))
    _hass_with_router(hass, router)

    read_channel_guard.install_read_channel_guard(hass)
    assert read_channel_guard.is_installed() is True
    assert routes[0].handler is not original

    read_channel_guard.uninstall_read_channel_guard(hass)
    assert read_channel_guard.is_installed() is False
    assert routes[0].handler is original


async def test_unrelated_routes_are_untouched():
    """Routes outside the history/logbook set are never wrapped."""
    hass, _store = _hass(child_rules={"r1": ("light.allowed", ACCESS_LEVEL_CONTROL)})
    served = []

    async def original(request):
        served.append(request)
        return "passed-through"

    router, routes = _router_with(
        ("/api/states/light.allowed", original),
        ("/api/logbook", original),
    )
    _hass_with_router(hass, router)
    read_channel_guard.install_read_channel_guard(hass)

    assert routes[0].handler is original
    assert routes[1].handler is not original
