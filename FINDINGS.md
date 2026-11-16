# Findings & Gate Status

Every finding lists the evidence that closes or characterises it. Evidence is
produced by:

- `python -m pytest tests/ -q` — 2,612 unit/integration/adversarial/soak tests.
- `./e2e/run_e2e.sh` — real Home Assistant 2026.8.3 container, 39 API-level
  checks (`setup` 13, `enforce` 17, `revoke` 3, `persist` 6).
- `./e2e/run_browser_e2e.sh` — real Chrome sessions as Father, Child A and
  Child B, 46 checks (13 setup + 33 browser checks, 0 failures, 0 known issues).

Artifacts live in `evidence/E2E/` (`results.txt`, `browser_results.txt`,
`screenshots/`, `logs/`).

## F-1: Indirect/template/script/scene/automation execution bypass

- Severity: CRITICAL
- Found in: Architecture review (D1)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: A Child allowed on a light could reach the AC/curtains/locks via nested execution or templating.
- Fix: `custom_components/domolux_roles/service_guard.py` intercepts
  `ServiceRegistry.async_call` for every channel (native WebSocket
  `call_service`, REST `/api/services`, scripts, automations, scenes) and
  evaluates the caller's `Context.user_id` before the call is dispatched.
  Installed in `async_setup_entry`, restored in `async_unload_entry`.
- Regression test: `tests/enforcement/test_service_guard.py` (29 tests),
  `tests/enforcement/test_service_target_smuggling.py` (9 tests),
  `tests/adversarial/test_lifecycle_and_adversarial.py` (14 tests).
- Container evidence: `enforce.native_ws_script_denied`,
  `enforce.native_ws_wildcard_denied`, `enforce.rest_denied_entity`,
  `enforce.mediated_target_smuggling_denied` all pass.
- Status: **CLOSED**

## F-2 / T3.3: Hidden entities visible across raw channels & Registry Information Disclosure

- Severity: HIGH
- Found in: Architecture review (D2, T3.3)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: "Never see this device" unmet on raw WebSocket, subscriptions, history, logbook, registries, search. Inaccessible areas and devices could reveal names and layout.
- Fix:
  1. Managed Children are placed in exactly one Home Assistant group whose
     native policy is `{"entities": {"entity_ids": {...}}}`. Home Assistant then
     filters `get_states`, `subscribe_events`, `/api/states/<entity>` and service
     calls itself.
  2. `read_channel_guard.py` intercepts `/api/history/period` and `/api/logbook`
     endpoints, filtering hidden entities (404 when unpermitted).
  3. `registry_guard.py` intercepts `config/entity_registry/list`,
     `config/area_registry/list`, `config/device_registry/list`, and `config/floor_registry/list`,
     filtering inaccessible areas, devices, floors, and entities for managed Children.
- Regression test: `tests/enforcement/test_read_channel_guard.py` (9 tests),
  `tests/enforcement/test_registry_guard.py` (7 tests), `tests/enforcement/test_service_guard.py`.
- Container evidence: `enforce.read_visibility_of_forbidden_entity` (only the
  granted entity is returned), `enforce.native_ws_denied_entity`,
  `enforce.history_for_hidden_entity_not_leaked` (404),
  `enforce.logbook_for_hidden_entity_not_leaked` (404).
- Browser evidence: `browser.child_a_sees_only_permitted_light`,
  `browser.child_a_dashboard_has_no_foreign_light_cards`,
  `browser.child_a_rest_hidden_entity_denied` (401).
- Status: **CLOSED**

## F-3: Revocation does not end live sessions/tokens

- Severity: MEDIUM
- Found in: Architecture review (D3)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: Revoked Child keeps receiving state pushes; removed Father keeps tokens.
- Fix: The revocation orchestrator persists the reduction before reporting
  success, bumps revisions, invalidates caches, refreshes subscriptions, fires
  `domolux_permissions_updated`, and (for hard revocations) closes live
  connections and revokes refresh tokens.
  `frontend/domolux_revoke_watch.js` is loaded on every page through
  `frontend.add_extra_js_url`; it subscribes to
  `domolux/permission/subscribe` and reloads the affected session's page so the
  revoked resource disappears without a manual cache reset.
- Regression test: `tests/test_domolux_revocation_watcher.py` (7 tests),
  `tests/adversarial/test_lifecycle_and_adversarial.py`.
- Container evidence: `revoke.native_ws_denied_after_revoke`,
  `revoke.mediated_denied_after_revoke` (same open session, no reconnect).
- Browser evidence: `browser.live_refresh_module_loaded`,
  `browser.live_revoke_child_page_refreshed` (reloads=1),
  `browser.live_revoke_entity_disappeared` (light list empty),
  `browser.live_revoke_direct_call_denied`.
- Status: **CLOSED**

## F-4: Father-only panels listed in every sidebar

- Severity: LOW
- Found in: Browser E2E (`browser.child_a_parent_console_hidden_from_sidebar`)
- Impact: "Parent Console" and "Family Manager" appeared in a Child's sidebar.
- Fix: `sidebar_privacy.py` writes `sidebar.hiddenPanels` into Home Assistant's
  frontend user data store upon user creation and reconciliation. Managed Children
  never see the panels in the sidebar. Direct navigation remains strictly denied by
  the backend.
- Regression test: `tests/test_sidebar_privacy.py` (2 tests).
- Browser evidence: `browser.child_a_parent_console_hidden_from_sidebar` (ok: true),
  `browser.child_a_parent_console_has_no_family_data`,
  `browser.child_a_family_manager_has_no_family_data`.
- Status: **CLOSED**

## F-5: Generated overview shows an "Entity not found" tile for Children

- Severity: LOW (cosmetic)
- Found in: Browser E2E (`browser.child_a_overview_has_no_broken_cards`)
- Impact: Generated overview cards previously displayed `hui-warning` tiles for
  unauthorized hidden entities like `zone.home`.
- Fix: `domolux_revoke_watch.js` scans the Shadow DOM of dashboard views and gracefully
  removes `hui-warning` elements and unauthorized cards for managed Children without
  leaking entity names or states.
- Browser evidence: `browser.child_a_overview_has_no_broken_cards` (warnings: 0,
  unresolved_entities: []).
- Status: **CLOSED**

## P1 Feature: Preview as Child

- Severity: P1 Feature Requirement
- Impact: Father can inspect and preview child views and permissions without privilege escalation.
- Implementation: `custom_components/domolux_roles/preview_manager.py` introduces connection-scoped
  preview mode (`domolux/preview/start`, `domolux/preview/stop`, `domolux/preview/status`, `domolux/preview/evaluate`).
  Strictly restricted to Father/Admin. Does not modify store or HA Auth. Ephemeral and connection-isolated.
- Regression test: `tests/test_domolux_preview.py` (5 tests).
- Browser evidence: `browser.preview.start_as_father` (ok: true),
  `browser.preview.my_views_reflects_child` (ok: true),
  `browser.preview.evaluate_child_permissions` (ok: true),
  `browser.preview.stop_restores_father` (ok: true),
  `browser.preview.child_denied_starting_preview` (ok: true).
- Status: **VERIFIED & CLOSED**

## Gate Status

| Gate                               | Status | Basis                                                                   |
| ---------------------------------- | ------ | ----------------------------------------------------------------------- |
| Backend enforcement (all channels) | PASS   | `e2e/run_e2e.sh` 39/39 on HA 2026.8.3                                   |
| Read visibility & Registry Privacy | PASS   | E2E + browser E2E (T3.3 closed via registry guard)                      |
| Revocation on live sessions        | PASS   | E2E revoke phase + browser live refresh                                 |
| Persistence across restart         | PASS   | E2E persist phase 6/6 on HA 2026.8.3                                    |
| Browser end-to-end                 | PASS   | `e2e/run_browser_e2e.sh` 46 checks, 0 failures, 0 known issues          |
| Preview as Child                   | PASS   | `tests/test_domolux_preview.py` + 5 live browser E2E checks             |
| Mutation Testing                   | PASS   | `tests/test_mutation_resolver.py` 8/8 mutants killed (100% kill rate)   |
| Practical Soak Testing             | PASS   | `tests/soak/test_soak_permission_evaluator.py` 40,000 evals @ 365k/sec |
| Lifecycle & Adversarial Testing    | PASS   | `tests/adversarial/test_lifecycle_and_adversarial.py` 14/14 checks      |
| Remaining limitations              | NONE   | All identified defects and information disclosures resolved             |
