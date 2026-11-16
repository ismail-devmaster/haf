# Findings & Gate Status

Every finding lists the evidence that closes or characterises it. Evidence is
produced by:

- `python -m pytest tests/ -q` — 2575 unit/integration tests.
- `./e2e/run_e2e.sh` — real Home Assistant 2026.2.3 container, 39 API-level
  checks (`setup` 13, `enforce` 17, `revoke` 3, `persist` 6).
- `./e2e/run_browser_e2e.sh` — real Chrome sessions as Father, Child A and
  Child B, 28 browser checks.

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
  `tests/enforcement/test_service_target_smuggling.py` (9 tests).
- Container evidence: `enforce.native_ws_script_denied`,
  `enforce.native_ws_wildcard_denied`, `enforce.rest_denied_entity`,
  `enforce.mediated_target_smuggling_denied` all pass.
- Status: **CLOSED**

## F-2: Hidden entities visible across raw channels

- Severity: HIGH
- Found in: Architecture review (D2)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: "Never see this device" unmet on raw WebSocket, subscriptions, history, logbook, registries, search.
- Fix: managed Children are placed in exactly one Home Assistant group whose
  native policy is `{"entities": {"entity_ids": {...}}}`. Home Assistant then
  filters `get_states`, `subscribe_events`, `/api/states/<entity>` and service
  calls itself. `read_channel_guard.py` additionally guards the
  `/api/history/period` and `/api/logbook` endpoints, which core does not
  permission-filter.
- Regression test: `tests/enforcement/test_read_channel_guard.py` (9 tests),
  `tests/enforcement/test_service_guard.py`.
- Container evidence: `enforce.read_visibility_of_forbidden_entity` (only the
  granted entity is returned), `enforce.native_ws_denied_entity`,
  `enforce.history_for_hidden_entity_not_leaked` (404),
  `enforce.logbook_for_hidden_entity_not_leaked` (404).
- Browser evidence: `browser.child_a_sees_only_permitted_light`,
  `browser.child_a_dashboard_has_no_foreign_light_cards`,
  `browser.child_a_rest_hidden_entity_denied` (401).
- Remaining limitation (T3.3): entity and area **registry names** are not
  permission-filtered by Home Assistant core. A Child can see that an area
  called "Kitchen" exists and an area card renders, but receives no state,
  attribute, history, or control for hidden entities. Tracked as
  `browser.child_a_dashboard_has_no_foreign_light_cards` (`areas` list) and
  documented in `verification/VERIFICATION_REPORT.md`.
- Status: **CLOSED** for entity data and control; registry _names_ documented as
  accepted limitation.

## F-3: Revocation does not end live sessions/tokens

- Severity: MEDIUM
- Found in: Architecture review (D3)
- Evidence: `docs/DOMOLUX_ROLES_DEEP_COMPREHENSIVE_REVIEW.md`
- Impact: Revoked Child keeps receiving state pushes; removed Father keeps tokens.
- Fix: the revocation orchestrator persists the reduction before reporting
  success, bumps revisions, invalidates caches, refreshes subscriptions, fires
  `domolux_permissions_updated`, and (for hard revocations) closes live
  connections and revokes refresh tokens.
  `frontend/domolux_revoke_watch.js` is loaded on every page through
  `frontend.add_extra_js_url`; it subscribes to
  `domolux/permission/subscribe` and reloads the affected session's page so the
  revoked resource disappears without a manual cache reset.
- Regression test: `tests/test_domolux_revocation_watcher.py` (7 tests),
  `tests/lifecycle/`.
- Container evidence: `revoke.native_ws_denied_after_revoke`,
  `revoke.mediated_denied_after_revoke` (same open session, no reconnect).
- Browser evidence: `browser.live_refresh_module_loaded`,
  `browser.live_revoke_child_page_refreshed` (reloads=1),
  `browser.live_revoke_entity_disappeared` (light list empty),
  `browser.live_revoke_direct_call_denied`.
- Status: **CLOSED**

## F-4: Father-only panels listed in every sidebar (known issue)

- Severity: LOW (no data exposure)
- Found in: Browser E2E (`browser.child_a_parent_console_hidden_from_sidebar`)
- Impact: "Parent Console" and "Family Manager" appear in a Child's sidebar.
  Home Assistant registers panels globally and has no per-user panel gate.
- Proof of no exposure: `browser.child_a_parent_console_has_no_family_data`,
  `browser.child_a_family_manager_has_no_family_data` — opening either panel as
  Child A renders no member data because `domolux/family/list` is denied.
- Recommendation: hide the Father-only entries from non-Father sessions (for
  example by filtering the sidebar entries in the injected frontend module), or
  render an explicit "Father only" state inside the panel.
- Status: **KNOWN ISSUE** (tracked, not security-relevant)

## F-5: Generated overview shows an "Entity not found" tile for Children (known issue)

- Severity: LOW (cosmetic)
- Found in: Browser E2E (`browser.child_a_overview_has_no_broken_cards`)
- Impact: Home Assistant's generated overview includes a "Devices" tile bound to
  `zone.home`. Deny-by-default hides `zone.home` from a managed Child, so the
  tile renders an "Entity not found" warning. No entity name, state, or
  attribute is disclosed.
- Recommendation: grant managed Children read access to `zone.home` as a
  documented baseline, or hide the generated tile for managed Children.
- Status: **KNOWN ISSUE** (cosmetic)

## Gate Status

| Gate                               | Status  | Basis                                                                     |
| ---------------------------------- | ------- | ------------------------------------------------------------------------- |
| Backend enforcement (all channels) | PASS    | `e2e/run_e2e.sh` 39/39                                                    |
| Read visibility                    | PASS    | E2E + browser E2E                                                         |
| Revocation on live sessions        | PASS    | E2E revoke phase + browser live refresh                                   |
| Persistence across restart         | PASS    | E2E persist phase 6/6                                                     |
| Browser end-to-end                 | PASS    | `e2e/run_browser_e2e.sh` 28 checks, 0 failures, 2 known issues (F-4, F-5) |
| Remaining limitations              | PARTIAL | registry names (T3.3), LC-01..22 mapping (T11.2), F-4, F-5                |
