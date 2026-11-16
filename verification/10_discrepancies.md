## D-001 [BLOCKER] — Service-call enforcement is mediated WS only, not a server-side guard

- Task(s): T2.2, T2.5, T2.6 · Gate(s): G2
- Claimed: BYPASS_INVENTORY / tasks plan service-call enforcement via ServiceRegistry wrapper (fail closed, zero side effects).
- Observed: No monkeypatch/wrapper of `ServiceRegistry.async_call` anywhere in custom_components. Enforcement only via `domolux/service/enforce` WS command. Native channels (raw WS `call_service`, REST `/api/services`, scripts, automations, scenes) bypass Domolux entirely.
- Reproduction: grep for async_call/monkey/wrap in custom_components/domolux_roles/\*.py -> no guard.
- Evidence: verification/raw/grep_service_guard.txt
- Product impact: Father cannot control what Child does inside HA native channels; product sentence violated.
- Required fix: Implement server-side service registry guard or accept mediated-only with documented limitations.
- Regression test to add: tests/enforcement/test_native_service_call_denied.py

## D-002 [BLOCKER] — Tests that cannot fail (assert True)

- Task(s): T10.3 · Gate(s): G5
- Claimed: subscription, permission_api, service_auth tests verify behavior.
- Observed: tests/test_domolux_subscription.py (4 tests) all `assert True`; test_domolux_permission_api.py test_permission_api_register `assert True`; test_domolux_service_auth.py has 2 `assert True` claiming code-path coverage.
- Reproduction: grep -rn "assert True" tests/
- Evidence: verification/raw/weak_tests.txt
- Product impact: security tests provide false confidence.
- Required fix: Replace with behavioral assertions.

## D-003 [MAJOR] — Permission evaluator is not pure (T1.2 violated)

- Task(s): T1.2 · Gate(s): G5
- Claimed: resolver pure, no I/O.
- Observed: permission_evaluator.py uses self.hass, await, entity/device registries.
- Reproduction: grep hass/await in permission_evaluator.py
- Evidence: verification/raw/resolver_impurity.txt

## D-004 [MAJOR] — No independent container verification performed

- Task(s): T11.x · Gate(s): G6-G9
- Claimed: LC-01..LC-22 pass in fresh container.
- Observed: No container/staging scripts runnable in this audit; no fresh container E2E executed.
- Product impact: Cannot claim server-side visibility/enforcement in real HA.

## D-005 [MINOR] — Scope creep: build-scripts and frontend changes

- Task(s): V7.2
- Claimed: targeted improvement.
- Observed: git diff includes build-scripts/\*, script/develop_and_serve, pyproject.toml, frontend/entrypoint.js modifications.
- Required fix: justify or revert unrelated changes.
