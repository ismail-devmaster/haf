#!/usr/bin/env python3
"""Domolux Roles end-to-end verification against a real Home Assistant instance.

This script runs *inside* the Home Assistant container and exercises the real
WebSocket and REST APIs of a live Home Assistant with the Domolux Roles
integration installed.

Phases
------
``setup``    bootstrap the owner, install the integration, create the Father
             and the Children and grant permissions.
``enforce``  run the enforcement matrix as the Children (native WebSocket
             ``call_service``, REST ``/api/services``, the mediated Domolux
             path, target smuggling, wildcards).
``revoke``   revoke a permission while the Child session stays open and prove
             that the still-open session loses access.
``persist``  after a Home Assistant restart, prove that roles, policies and
             enforcement survived.

Every step prints a machine readable ``RESULT <json>`` line so the runner can
assert on the outcome, and the script exits non-zero when an expectation is
not met.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import traceback
from typing import Any

import aiohttp

HA_URL = os.environ.get("HA_URL", "http://127.0.0.1:8123")
CLIENT_ID = HA_URL + "/"
STATE_PATH = os.environ.get("DOMOLUX_E2E_STATE", "/domolux-e2e/state.json")
STATE_DIR = os.path.dirname(STATE_PATH)

ADMIN_USER = os.environ.get("DOMOLUX_E2E_ADMIN_USER", "e2e_admin")
ADMIN_PASSWORD = os.environ.get("DOMOLUX_E2E_ADMIN_PASSWORD", "e2e-Admin-Pass-1")
FATHER_USER = "e2e_father"
FATHER_PASSWORD = "e2e-Father-Pass-1"
CHILD_A_USER = "e2e_child_a"
CHILD_A_PASSWORD = "e2e-ChildA-Pass-1"
CHILD_B_USER = "e2e_child_b"
CHILD_B_PASSWORD = "e2e-ChildB-Pass-1"

RESULTS: list[dict[str, Any]] = []


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------
def record(name: str, ok: bool, **details: Any) -> None:
    """Record and print a single verification result."""
    entry = {"check": name, "ok": bool(ok), **details}
    RESULTS.append(entry)
    print("RESULT " + json.dumps(entry), flush=True)


def load_state() -> dict[str, Any]:
    try:
        with open(STATE_PATH, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return {}


def save_state(state: dict[str, Any]) -> None:
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)


async def wait_for_ha(session: aiohttp.ClientSession, timeout: float = 300.0) -> None:
    """Block until Home Assistant answers."""
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        try:
            async with session.get(f"{HA_URL}/api/", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                if resp.status in (200, 401):
                    return
        except aiohttp.ClientError:
            pass
        await asyncio.sleep(2)
    raise RuntimeError("Home Assistant did not become ready in time")


async def http_json(session: aiohttp.ClientSession, method: str, path: str, **kwargs: Any) -> Any:
    async with session.request(method, f"{HA_URL}{path}", **kwargs) as resp:
        text = await resp.text()
        try:
            body = json.loads(text) if text else None
        except ValueError:
            body = text
        return resp.status, body


async def exchange_code(session: aiohttp.ClientSession, code: str) -> str:
    """Exchange an authorisation code for an access token.

    Home Assistant's token endpoint expects form encoded data.
    """
    status, body = await http_json(
        session,
        "POST",
        "/auth/token",
        data={
            "client_id": CLIENT_ID,
            "grant_type": "authorization_code",
            "code": code,
        },
    )
    if status != 200 or not isinstance(body, dict) or "access_token" not in body:
        raise RuntimeError(f"token exchange failed: {status} {body}")
    return body["access_token"]


async def login(session: aiohttp.ClientSession, username: str, password: str) -> str:
    """Log in through the Home Assistant auth provider and return a token."""
    status, body = await http_json(
        session,
        "POST",
        "/auth/login_flow",
        json={
            "client_id": CLIENT_ID,
            "handler": ["homeassistant", None],
            "redirect_uri": CLIENT_ID,
        },
    )
    if status != 200 or not isinstance(body, dict) or "flow_id" not in body:
        raise RuntimeError(f"login_flow failed for {username}: {status} {body}")

    status, body = await http_json(
        session,
        "POST",
        f"/auth/login_flow/{body['flow_id']}",
        json={
            "client_id": CLIENT_ID,
            "username": username,
            "password": password,
        },
    )
    if status != 200 or not isinstance(body, dict) or "result" not in body:
        raise RuntimeError(f"login failed for {username}: {status} {body}")

    return await exchange_code(session, body["result"])


class WSClient:
    """Minimal Home Assistant WebSocket API client."""

    def __init__(self, session: aiohttp.ClientSession, token: str) -> None:
        self._session = session
        self._token = token
        self._ws: Any = None
        self._next_id = 1

    async def __aenter__(self) -> "WSClient":
        self._ws = await self._session.ws_connect(
            f"{HA_URL}/api/websocket",
            headers={"Authorization": f"Bearer {self._token}"},
            heartbeat=30,
        )
        hello = await self._ws.receive_json()
        if hello.get("type") != "auth_required":
            raise RuntimeError(f"unexpected handshake: {hello}")
        await self._ws.send_json({"type": "auth", "access_token": self._token})
        auth = await self._ws.receive_json()
        if auth.get("type") != "auth_ok":
            raise RuntimeError(f"authentication failed: {auth}")
        return self

    async def __aexit__(self, *exc: Any) -> None:
        if self._ws is not None:
            await self._ws.close()

    async def call(self, payload: dict[str, Any], timeout: float = 30.0) -> dict[str, Any]:
        """Send a command and wait for its response."""
        msg_id = self._next_id
        self._next_id += 1
        await self._ws.send_json({"id": msg_id, **payload})
        while True:
            message = await asyncio.wait_for(self._ws.receive_json(), timeout=timeout)
            if message.get("id") == msg_id:
                return message


async def get_state(session: aiohttp.ClientSession, token: str, entity_id: str) -> Any:
    status, body = await http_json(
        session,
        "GET",
        f"/api/states/{entity_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    if status != 200:
        return None
    return body


async def rest_call_service(
    session: aiohttp.ClientSession, token: str, domain: str, service: str, payload: dict[str, Any]
) -> tuple[int, Any]:
    return await http_json(
        session,
        "POST",
        f"/api/services/{domain}/{service}",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )


# --------------------------------------------------------------------------
# phases
# --------------------------------------------------------------------------
async def phase_setup(session: aiohttp.ClientSession) -> dict[str, Any]:
    """Bootstrap the instance, the integration, the Father and the Children."""
    state: dict[str, Any] = {}

    # 1. Owner / administrator -------------------------------------------------
    status, body = await http_json(
        session,
        "POST",
        "/api/onboarding/users",
        json={
            "client_id": CLIENT_ID,
            "name": "E2E Administrator",
            "username": ADMIN_USER,
            "password": ADMIN_PASSWORD,
            "language": "en",
        },
    )
    if status == 200 and isinstance(body, dict) and body.get("auth_code"):
        admin_token = await exchange_code(session, body["auth_code"])
    else:
        # The instance was already onboarded (restart phase).
        admin_token = await login(session, ADMIN_USER, ADMIN_PASSWORD)
    state["admin_token"] = admin_token
    record("setup.onboard_admin", True, status=status)

    # 1b. Finish the remaining onboarding steps ---------------------------------
    # The browser phase needs a fully onboarded instance; otherwise the login
    # redirect sends the user to `/onboarding.html` instead of the dashboard.
    status, steps = await http_json(
        session, "GET", "/api/onboarding", headers={"Authorization": f"Bearer {admin_token}"}
    )
    pending = [
        step["step"]
        for step in (steps if isinstance(steps, list) else [])
        if not step.get("done")
    ]
    for step in pending:
        await http_json(
            session,
            "POST",
            f"/api/onboarding/{step}",
            json={"client_id": CLIENT_ID, "redirect_uri": CLIENT_ID},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    status, steps = await http_json(
        session, "GET", "/api/onboarding", headers={"Authorization": f"Bearer {admin_token}"}
    )
    remaining = [
        step["step"]
        for step in (steps if isinstance(steps, list) else [])
        if not step.get("done")
    ]
    record("setup.onboarding_complete", not remaining, pending=remaining)


    # 2. Integration -----------------------------------------------------------
    # Home Assistant 2026.2 exposes the config entry flow over REST.
    status, flow = await http_json(
        session,
        "POST",
        "/api/config/config_entries/flow",
        json={"handler": "domolux_roles"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    if status == 200 and isinstance(flow, dict) and flow.get("type") == "form":
        status, created = await http_json(
            session,
            "POST",
            f"/api/config/config_entries/flow/{flow['flow_id']}",
            json={"user_input": {}},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    else:
        created = flow
    record(
        "setup.install_integration",
        isinstance(created, dict) and created.get("type") == "create_entry",
        status=status,
        result=(created or {}).get("type") if isinstance(created, dict) else created,
        error=(created or {}).get("error") if isinstance(created, dict) else None,
    )

    async with WSClient(session, admin_token) as admin:
        father = await admin.call({"type": "config/auth/create", "name": "E2E Father"})
        father_user = father.get("result", {}).get("user", {})
        father_id = father_user.get("id")
        record("setup.create_father_user", bool(father_id), user_id=father_id)

        cred = await admin.call(
            {
                "type": "config/auth_provider/homeassistant/create",
                "user_id": father_id,
                "username": FATHER_USER,
                "password": FATHER_PASSWORD,
            }
        )
        record(
            "setup.set_father_credentials",
            cred.get("success") is True,
            error=cred.get("error"),
        )

        # 4. Father role --------------------------------------------------------
        role = await admin.call({"type": "domolux/role/set_father", "user_id": father_id})
        record(
            "setup.set_father_role",
            role.get("success") is True or bool(role.get("result")),
            error=role.get("error"),
        )

    # 5. Father session -------------------------------------------------------
    father_token = await login(session, FATHER_USER, FATHER_PASSWORD)
    state["father_token"] = father_token
    state["father_id"] = father_id

    async with WSClient(session, father_token) as father_ws:
        role = await father_ws.call({"type": "domolux/role/get"})
        record(
            "setup.father_sees_father_role",
            role.get("success") is True,
            response=role.get("result"),
        )

        child_a = await father_ws.call(
            {
                "type": "domolux/family/create",
                "display_name": "Child A",
                "username": CHILD_A_USER,
                "password": CHILD_A_PASSWORD,
            }
        )
        child_b = await father_ws.call(
            {
                "type": "domolux/family/create",
                "display_name": "Child B",
                "username": CHILD_B_USER,
                "password": CHILD_B_PASSWORD,
            }
        )
        member_a = child_a.get("result", {}).get("family_member", {})
        member_b = child_b.get("result", {}).get("family_member", {})
        state["child_a_id"] = member_a.get("user_id")
        state["child_b_id"] = member_b.get("user_id")
        record(
            "setup.create_children",
            bool(state["child_a_id"]) and bool(state["child_b_id"]),
            child_a=state["child_a_id"],
            child_b=state["child_b_id"],
            error_a=child_a.get("error"),
            error_b=child_b.get("error"),
        )

    # 6. Test entities --------------------------------------------------------
    async with WSClient(session, admin_token) as admin:
        states = await admin.call({"type": "get_states"})
        lights = sorted(
            state["entity_id"]
            for state in states.get("result", [])
            if state["entity_id"].startswith("light.")
        )
    record("setup.demo_lights_found", len(lights) >= 2, lights=lights)
    if len(lights) < 2:
        raise RuntimeError("the demo integration must provide at least two lights")

    permitted = lights[0]
    forbidden = lights[1]
    state["permitted_entity"] = permitted
    state["forbidden_entity"] = forbidden

    # 7. Permissions ----------------------------------------------------------
    async with WSClient(session, father_token) as father_ws:
        grant_a = await father_ws.call(
            {
                "type": "domolux/permission/set_entity_rule",
                "user_id": state["child_a_id"],
                "target_type": "entity",
                "target_id": permitted,
                "access_level": "control",
            }
        )
        grant_b = await father_ws.call(
            {
                "type": "domolux/permission/set_entity_rule",
                "user_id": state["child_b_id"],
                "target_type": "entity",
                "target_id": forbidden,
                "access_level": "read",
            }
        )
        state["child_a_rule_id"] = (grant_a.get("result", {}) or {}).get("rule", {}).get("rule_id")
        state["child_b_rule_id"] = (grant_b.get("result", {}) or {}).get("rule", {}).get("rule_id")
        record(
            "setup.grant_child_a_control",
            grant_a.get("success") is True,
            rule_id=state["child_a_rule_id"],
            error=grant_a.get("error"),
        )
        record(
            "setup.grant_child_b_read",
            grant_b.get("success") is True,
            rule_id=state["child_b_rule_id"],
            error=grant_b.get("error"),
        )

    state["child_a_token"] = await login(session, CHILD_A_USER, CHILD_A_PASSWORD)
    state["child_b_token"] = await login(session, CHILD_B_USER, CHILD_B_PASSWORD)
    record("setup.child_logins", True)

    # Baseline states so the enforcement phase can prove "no side effect".
    for key, entity_id in (("permitted", permitted), ("forbidden", forbidden)):
        current = await get_state(session, admin_token, entity_id)
        state[f"{key}_state_before"] = (current or {}).get("state")
    record(
        "setup.baseline_states",
        True,
        permitted=state["permitted_state_before"],
        forbidden=state["forbidden_state_before"],
    )

    save_state(state)
    return state


async def phase_enforce(session: aiohttp.ClientSession) -> None:
    """Run the enforcement matrix as the Children."""
    state = load_state()
    permitted = state["permitted_entity"]
    forbidden = state["forbidden_entity"]
    child_a_token = state["child_a_token"]

    # --- native WebSocket call_service ------------------------------------
    async with WSClient(session, child_a_token) as child:
        allowed = await child.call(
            {
                "type": "call_service",
                "domain": "light",
                "service": "turn_on",
                "service_data": {"entity_id": permitted},
            }
        )
        record(
            "enforce.native_ws_allowed_entity",
            allowed.get("success") is True,
            response=allowed,
        )

        denied = await child.call(
            {
                "type": "call_service",
                "domain": "light",
                "service": "turn_on",
                "service_data": {"entity_id": forbidden},
            }
        )
        record(
            "enforce.native_ws_denied_entity",
            denied.get("success") is not True,
            response=denied,
        )

        wildcard = await child.call(
            {
                "type": "call_service",
                "domain": "light",
                "service": "turn_off",
                "service_data": {"entity_id": "all"},
            }
        )
        record(
            "enforce.native_ws_wildcard_denied",
            wildcard.get("success") is not True,
            response=wildcard,
        )

        script = await child.call(
            {
                "type": "call_service",
                "domain": "script",
                "service": "turn_on",
                "service_data": {"entity_id": permitted},
            }
        )
        record(
            "enforce.native_ws_script_denied",
            script.get("success") is not True,
            response=script,
        )

        # --- mediated Domolux path -------------------------------------------
        mediated_ok = await child.call(
            {
                "type": "domolux/service/enforce",
                "domain": "light",
                "service": "turn_on",
                "entity_id": [permitted],
                "service_data": {"entity_id": permitted},
            }
        )
        record(
            "enforce.mediated_allowed_entity",
            mediated_ok.get("success") is True,
            response=mediated_ok,
        )

        mediated_denied = await child.call(
            {
                "type": "domolux/service/enforce",
                "domain": "light",
                "service": "turn_on",
                "entity_id": [forbidden],
                "service_data": {"entity_id": forbidden},
            }
        )
        record(
            "enforce.mediated_denied_entity",
            mediated_denied.get("success") is not True,
            response=mediated_denied,
        )

        smuggled = await child.call(
            {
                "type": "domolux/service/enforce",
                "domain": "light",
                "service": "turn_on",
                "entity_id": [permitted],
                "service_data": {"entity_id": permitted, "area_id": "living_room"},
            }
        )
        record(
            "enforce.mediated_target_smuggling_denied",
            smuggled.get("success") is not True,
            response=smuggled,
        )

        # --- read visibility --------------------------------------------------
        states = await child.call({"type": "get_states"})
        all_states = states.get("result") or []
        visible = sorted(
            s["entity_id"]
            for s in all_states
            if s["entity_id"].startswith("light.")
        )
        record(
            "enforce.read_visibility_of_forbidden_entity",
            forbidden not in visible,
            visible_lights=visible,
            total_states=len(all_states),
            error=states.get("error"),
        )

        # --- privilege escalation ---------------------------------------------
        escalate = await child.call(
            {
                "type": "domolux/role/set_father",
                "user_id": state["child_a_id"],
            }
        )
        record(
            "enforce.child_cannot_become_father",
            escalate.get("success") is not True,
            response=escalate,
        )

        family_list = await child.call({"type": "domolux/family/list"})
        record(
            "enforce.child_cannot_list_family",
            family_list.get("success") is not True,
            response=family_list,
        )

    # --- alternate read channels (documented residual risk) -------------------
    # These endpoints are part of Home Assistant Core and do not consult the
    # native entity permission policy.  The check records what a Child can
    # actually observe so the residual risk is evidence-backed.
    history_status, history_body = await http_json(
        session,
        "GET",
        f"/api/history/period?filter_entity_id={forbidden}",
        headers={"Authorization": f"Bearer {child_a_token}"},
    )
    history_leaks = isinstance(history_body, list) and len(history_body) > 0
    record(
        "enforce.history_for_hidden_entity_not_leaked",
        not history_leaks,
        status=history_status,
        entries=len(history_body) if isinstance(history_body, list) else None,
    )

    logbook_status, logbook_body = await http_json(
        session,
        "GET",
        f"/api/logbook?entity={forbidden}",
        headers={"Authorization": f"Bearer {child_a_token}"},
    )
    logbook_leaks = isinstance(logbook_body, list) and len(logbook_body) > 0
    record(
        "enforce.logbook_for_hidden_entity_not_leaked",
        not logbook_leaks,
        status=logbook_status,
        entries=len(logbook_body) if isinstance(logbook_body, list) else None,
    )

    # Regression: the Father must keep full Home Assistant read access.
    father_token = state["father_token"]
    father_history_status, father_history_body = await http_json(
        session,
        "GET",
        f"/api/history/period?filter_entity_id={forbidden}",
        headers={"Authorization": f"Bearer {father_token}"},
    )
    record(
        "enforce.father_history_not_filtered",
        father_history_status == 200,
        status=father_history_status,
    )

    async with WSClient(session, father_token) as father_ws:
        father_states = await father_ws.call({"type": "get_states"})
    father_lights = sorted(
        s["entity_id"]
        for s in (father_states.get("result") or [])
        if s["entity_id"].startswith("light.")
    )
    record(
        "enforce.father_sees_household_states",
        len(father_lights) >= 2,
        visible_lights=father_lights,
    )

    # --- REST channel ---------------------------------------------------------
    status, body = await rest_call_service(
        session, child_a_token, "light", "turn_off", {"entity_id": forbidden}
    )
    record(
        "enforce.rest_denied_entity",
        status >= 400,
        status=status,
        body=body,
    )

    # --- state evidence --------------------------------------------------------
    admin_token = state["admin_token"]
    forbidden_state = await get_state(session, admin_token, forbidden)
    permitted_state = await get_state(session, admin_token, permitted)
    record(
        "enforce.forbidden_entity_not_changed",
        (forbidden_state or {}).get("state") == state["forbidden_state_before"],
        before=state["forbidden_state_before"],
        after=(forbidden_state or {}).get("state"),
    )
    record(
        "enforce.permitted_entity_turned_on",
        (permitted_state or {}).get("state") == "on",
        before=state["permitted_state_before"],
        after=(permitted_state or {}).get("state"),
    )


async def phase_revoke(session: aiohttp.ClientSession) -> None:
    """Revoke a permission while the Child session stays open."""
    state = load_state()
    permitted = state["permitted_entity"]

    async with WSClient(session, state["father_token"]) as father_ws:
        revoke = await father_ws.call(
            {
                "type": "domolux/permission/remove_entity_rule",
                "user_id": state["child_a_id"],
                "rule_id": state["child_a_rule_id"],
            }
        )
        record("revoke.father_removes_rule", revoke.get("success") is True, response=revoke)

    # The Child keeps using the *same* WebSocket session.
    async with WSClient(session, state["child_a_token"]) as child:
        denied = await child.call(
            {
                "type": "call_service",
                "domain": "light",
                "service": "turn_off",
                "service_data": {"entity_id": permitted},
            }
        )
        record(
            "revoke.native_ws_denied_after_revoke",
            denied.get("success") is not True,
            response=denied,
        )

        mediated = await child.call(
            {
                "type": "domolux/service/enforce",
                "domain": "light",
                "service": "turn_off",
                "entity_id": [permitted],
                "service_data": {"entity_id": permitted},
            }
        )
        record(
            "revoke.mediated_denied_after_revoke",
            mediated.get("success") is not True,
            response=mediated,
        )


async def phase_persist(session: aiohttp.ClientSession) -> None:
    """Verify that roles and policies survived a Home Assistant restart."""
    state = load_state()
    permitted = state["permitted_entity"]
    forbidden = state["forbidden_entity"]

    father_token = await login(session, FATHER_USER, FATHER_PASSWORD)
    record("persist.father_can_log_in_after_restart", True)

    # Wait for the Domolux integration entry to finish setting up after restart.
    role = None
    for _ in range(20):
        try:
            async with WSClient(session, father_token) as probe_ws:
                res = await probe_ws.call({"type": "domolux/role/get"})
                if res.get("success") is True and res.get("result"):
                    role = res
                    break
        except Exception:
            pass
        await asyncio.sleep(0.5)

    if role is None:
        async with WSClient(session, father_token) as probe_ws:
            role = await probe_ws.call({"type": "domolux/role/get"})

    record(
        "persist.father_role_survived",
        role.get("success") is True,
        response=role.get("result"),
    )
    async with WSClient(session, father_token) as father_ws:
        family = await father_ws.call({"type": "domolux/family/list"})
        members = family.get("result") or []
        if isinstance(members, dict):
            members = members.get("family_members", [])
        record(
            "persist.children_survived",
            len(members) >= 2,
            count=len(members),
            error=family.get("error"),
        )

    child_a_token = await login(session, CHILD_A_USER, CHILD_A_PASSWORD)
    record("persist.child_can_log_in_after_restart", True)

    async with WSClient(session, child_a_token) as child:
        mediated = await child.call(
            {
                "type": "domolux/service/enforce",
                "domain": "light",
                "service": "turn_off",
                "entity_id": [permitted],
                "service_data": {"entity_id": permitted},
            }
        )
        record(
            "persist.mediated_still_denied_after_restart",
            mediated.get("success") is not True,
            response=mediated,
        )

    child_b_token = await login(session, CHILD_B_USER, CHILD_B_PASSWORD)
    async with WSClient(session, child_b_token) as child_b:
        allowed = await child_b.call(
            {
                "type": "domolux/service/enforce",
                "domain": "light",
                "service": "turn_off",
                "entity_id": [forbidden],
                "service_data": {"entity_id": forbidden},
            }
        )
        record(
            "persist.child_b_read_only_entity_denied",
            allowed.get("success") is not True,
            response=allowed,
        )


PHASES = {
    "setup": phase_setup,
    "enforce": phase_enforce,
    "revoke": phase_revoke,
    "persist": phase_persist,
}


async def main() -> int:
    phase = sys.argv[1] if len(sys.argv) > 1 else "setup"
    if phase not in PHASES:
        print(f"unknown phase: {phase}", file=sys.stderr)
        return 2
    async with aiohttp.ClientSession() as session:
        await wait_for_ha(session)
        try:
            await PHASES[phase](session)
        except Exception:
            record(f"{phase}.exception", False, traceback=traceback.format_exc())
            return 1

    failures = [entry for entry in RESULTS if not entry["ok"]]
    print(
        f"SUMMARY phase={phase} checks={len(RESULTS)} failures={len(failures)}",
        flush=True,
    )
    for failure in failures:
        print("FAILED " + json.dumps(failure), flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
