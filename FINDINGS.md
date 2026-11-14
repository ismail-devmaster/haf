# Findings & Gate Status

## F-1: Indirect/template/script/scene/automation execution bypass risk

- Severity: CRITICAL
- Found in: Architecture review (D1)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: A Child allowed on a light can reach the AC/curtains/locks via nested execution or templating.
- Fix task: Phase 2 (T2.1 - T2.6)
- Regression test: `tests/enforcement/`
- Status: OPEN

## F-2: Hidden entities visible across raw channels

- Severity: HIGH
- Found in: Architecture review (D2)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: "Never see this device" unmet on raw WebSocket, subscriptions, history, logbook, registries, search.
- Fix task: Phase 3 (T3.1 - T3.5)
- Regression test: `tests/visibility/`
- Status: OPEN

## F-3: Revocation does not end live sessions/tokens

- Severity: MEDIUM
- Found in: Architecture review (D3)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: Revoked Child keeps receiving state pushes; removed Father keeps tokens.
- Fix task: Phase 4 (T4.1 - T4.5)
- Regression test: `tests/lifecycle/`
- Status: OPEN

## Gate Status

Staging is blocked on D1, D2, D3 until Phase 2-4 evidence exists.
