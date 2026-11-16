# Domolux Roles — Engineering Completion Report

## Executive result

- **Production readiness: PASS** for the product promise (precise family-level
  access control enforced at the backend boundary), with two documented
  non-security known issues and one documented coverage limitation.
- **P0 security gates: 5 / 5 passed.** Every gate is proven against a real
  Home Assistant `2026.2.3` container, not a mock.
- **P1 functional gates: 3 / 4 passed.** Preview-as-Child (T14.2) is not
  implemented; the Father console shows computed permission lists instead.
- **Remaining blockers: none.** Known issues F-4 (sidebar entry visible, no
  data exposure) and F-5 (one cosmetic "Entity not found" tile) are tracked in
  `FINDINGS.md` and deliberately do not fail the release gate.

| Gate                                                   | Result | Evidence                                 |
| ------------------------------------------------------ | ------ | ---------------------------------------- |
| Backend enforcement across every ingress channel       | PASS   | `e2e/run_e2e.sh` → 39/39                 |
| Read visibility (not visible / visible / controllable) | PASS   | API E2E + browser E2E                    |
| Revocation on already-open sessions                    | PASS   | `revoke` phase + `browser.live_revoke_*` |
| Persistence across restart                             | PASS   | `persist` phase 6/6                      |
| Identity isolation (Father / Child A / Child B)        | PASS   | browser E2E, 3 isolated browser contexts |

## Environment

| Item           | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Home Assistant | `ghcr.io/home-assistant/home-assistant:2026.2.3`                       |
| Runtime        | Docker, disposable container per run (removed on exit)                 |
| Integration    | repository `custom_components/` mounted at `/config/custom_components` |
| Test entities  | `demo:` integration (6 lights)                                         |
| Browser        | Google Chrome 149 headless, driven over the DevTools Protocol          |
| Node           | v22.x (built-in `WebSocket`; no Playwright/Puppeteer dependency)       |
| Python         | 3.14, pytest 9.2                                                       |

## Confirmed defects fixed

| Defect                                              | Reproduction                                                                             | Root cause                                                                                                             | Fix                                                                                                                                           | Regression test                                                                                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-001 / T2.2 — no server-side service authorization | Child WebSocket `call_service` on a hidden entity succeeded                              | Authorization lived only in the mediated `domolux/service/enforce` command; raw WS/REST/script/scene calls bypassed it | `service_guard.py` wraps `ServiceRegistry.async_call`, resolves the caller from `Context.user_id`, denies before dispatch; restored on unload | `tests/enforcement/test_service_guard.py` (29), `enforce.native_ws_denied_entity`, `enforce.native_ws_script_denied`                                                                   |
| D-002 / T10.3 — tests that cannot fail              | `assert True` in permission/subscription/service-auth tests                              | Placeholder tests recorded intent, not behaviour                                                                       | Replaced with behavioural assertions that fail when the guard is removed                                                                      | `tests/test_domolux_permission_api.py`, `tests/test_domolux_service_auth.py`, `tests/test_domolux_subscription.py`, `tests/isolated_security/test_child_readonly_exact_replacement.py` |
| T1.2 — evaluator mixed policy and I/O               | Evaluation required `hass`, `await`, and registries                                      | Decision logic was entangled with data access                                                                          | `resolver.py` holds pure `resolve_entity_access`; `permission_evaluator.py` is a thin adapter                                                 | `tests/enforcement/`, full suite                                                                                                                                                       |
| Target smuggling                                    | `service_data` carried `area_id`/`device_id` and expanded beyond the granted entity      | Mediated path only validated the top-level target                                                                      | Device/area/floor/label/`target`/group keys rejected in `service_auth_api.py`                                                                 | `tests/enforcement/test_service_target_smuggling.py` (9), `enforce.mediated_target_smuggling_denied`                                                                                   |
| Fail-open subscription                              | A Child could subscribe to another user's permission stream when the role manager raised | `except: pass` treated an error as success                                                                             | Fail-closed: unmatched/unknown principals are refused                                                                                         | `tests/test_domolux_subscription.py` (8)                                                                                                                                               |
| History/logbook leak                                | `/api/history/period?filter_entity_id=<hidden>` returned hidden data                     | Home Assistant core does not permission-filter those REST handlers                                                     | `read_channel_guard.py` wraps the registered routes                                                                                           | `tests/enforcement/test_read_channel_guard.py` (9), `enforce.history_for_hidden_entity_not_leaked` (404)                                                                               |
| Revoked entity stayed in an open tab                | Revoke while Child tab open; card kept rendering                                         | `subscribe_entities` filters at subscription time only                                                                 | `frontend/domolux_revoke_watch.js` subscribes to `domolux/permission/subscribe` and refreshes the affected session                            | `tests/test_domolux_revocation_watcher.py` (7), `browser.live_revoke_*`                                                                                                                |
| Native policy nested under the wrong key            | Children saw **zero** entities                                                           | Policy was wrapped one level too deep, so Home Assistant denied everything                                             | `_build_native_policy` emits `{"entities": {"entity_ids": …}}`                                                                                | `tests/test_domolux_ha_auth_adapter.py`, `setup.baseline_states`                                                                                                                       |
| Mediated path called a non-existent API             | Every mediated call raised                                                               | `ServiceRegistry.async_get` does not exist in 2026.2                                                                   | Use `supports_response` / `async_call` correctly                                                                                              | `enforce.mediated_allowed_entity`                                                                                                                                                      |
| Child group merged permissive policies              | Read-only Child could still control                                                      | A Child had both the managed group and `system-read-only`; Home Assistant merges permissively                          | Managed Child group is the Child's only group                                                                                                 | `tests/isolated_security/test_child_readonly_exact_replacement.py`, `persist.child_b_read_only_entity_denied`                                                                          |

## Security enforcement evidence

All rows observed on a live Home Assistant; Child A has `control` on
`light.bed_light` and nothing else; Child B has `read` on
`light.ceiling_lights` and nothing else.

| Principal           | Resource                              | Operation                                   | Expected            | Actual                 | Evidence                                                                              |
| ------------------- | ------------------------------------- | ------------------------------------------- | ------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| Child A             | `light.bed_light`                     | WS `call_service` `light.turn_on`           | allow               | success                | `enforce.native_ws_allowed_entity`                                                    |
| Child A             | `light.ceiling_lights`                | WS `call_service` `light.turn_on`           | deny                | `Unauthorized`         | `enforce.native_ws_denied_entity`                                                     |
| Child A             | `all`                                 | WS `call_service` `light.turn_off`          | deny                | `Unauthorized`         | `enforce.native_ws_wildcard_denied`                                                   |
| Child A             | `script.turn_on`                      | WS `call_service`                           | deny                | `Unauthorized`         | `enforce.native_ws_script_denied`                                                     |
| Child A             | `light.ceiling_lights`                | REST `POST /api/services/light/turn_on`     | deny                | `401`                  | `enforce.rest_denied_entity`                                                          |
| Child A             | Domolux mediated                      | `domolux/service/enforce` on granted entity | allow               | success                | `enforce.mediated_allowed_entity`                                                     |
| Child A             | Domolux mediated                      | `domolux/service/enforce` on hidden entity  | deny                | `service_denied`       | `enforce.mediated_denied_entity`                                                      |
| Child A             | Domolux mediated                      | smuggled `area_id` in `service_data`        | deny                | `target_invalid`       | `enforce.mediated_target_smuggling_denied`                                            |
| Child A             | `get_states`                          | read all states                             | only granted entity | only `light.bed_light` | `enforce.read_visibility_of_forbidden_entity`                                         |
| Child A             | `/api/states/light.ceiling_lights`    | REST read                                   | deny                | `401`                  | `browser.child_a_rest_hidden_entity_denied`                                           |
| Child A             | `/api/history/period` (hidden entity) | REST read                                   | deny                | `404`                  | `enforce.history_for_hidden_entity_not_leaked`                                        |
| Child A             | `/api/logbook` (hidden entity)        | REST read                                   | deny                | `404`                  | `enforce.logbook_for_hidden_entity_not_leaked`                                        |
| Child A             | hidden light                          | denied call side effect                     | no state change     | unchanged              | `enforce.forbidden_entity_not_changed`                                                |
| Child A             | Father role                           | `domolux/role/set_father` on self           | deny                | denied                 | `enforce.child_cannot_become_father`                                                  |
| Child A             | family list                           | `domolux/family/list`                       | deny                | denied                 | `enforce.child_cannot_list_family`                                                    |
| Child B (read-only) | `light.ceiling_lights`                | WS `call_service` `light.turn_off`          | deny                | `Unauthorized`         | `browser.child_b_read_only_cannot_control`, `persist.child_b_read_only_entity_denied` |
| Father              | whole household                       | state read + history                        | allow, unfiltered   | 6 lights, `200`        | `enforce.father_sees_household_states`, `enforce.father_history_not_filtered`         |

## Account and policy lifecycle

- **Father creation/uniqueness:** a Father is created through the family API,
  receives exactly the native `system-users` group (never admin or owner), and
  the role assignment is unique (`setup.set_father_role`,
  `persist.father_role_survived`).
- **Child creation/isolation:** each Child is an independent Home Assistant
  user in exactly one managed group. Children cannot see each other's rules or
  enumerate the family (`enforce.child_cannot_list_family`).
- **Permission update/revocation:** the revocation orchestrator persists the
  reduction, bumps revisions, invalidates caches, refreshes subscriptions, and
  fires `domolux_permissions_updated`. The reduced policy is written before
  success is reported.
- **Session invalidation:** a still-open Child WebSocket loses access with no
  reconnect (`revoke.native_ws_denied_after_revoke`,
  `revoke.mediated_denied_after_revoke`), and the open browser tab refreshes
  and drops the entity (`browser.live_revoke_child_page_refreshed`,
  `browser.live_revoke_entity_disappeared`).
- **Persistence/restart:** after a full container restart the Father role, both
  Children, the read-only restriction, and mediated denial all survive
  (`persist.*`, 6/6).

## Frontend and dashboard validation

Each account runs in an isolated Chrome browser context and signs in through the
real Home Assistant login form.

- **Father flow:** sees all 6 lights, dashboard cards render, history is not
  filtered (`browser.father_login`, `father_sees_household`,
  `father_dashboard_renders`).
- **Child A flow:** sees exactly `light.bed_light`, no hidden light card is
  rendered, the permitted light can be turned on and the state changes, the
  hidden light and the `all` wildcard are denied
  (`browser.child_a_login`, `child_a_sees_only_permitted_light`,
  `child_a_dashboard_has_no_foreign_light_cards`,
  `child_a_ui_can_control_permitted_entity`,
  `child_a_permitted_entity_state_changed`,
  `child_a_ui_cannot_control_hidden_entity`, `child_a_ui_wildcard_denied`).
- **Child B flow:** sees exactly `light.ceiling_lights` and cannot control it
  (`browser.child_b_login`, `child_b_sees_only_permitted_light`,
  `child_b_read_only_cannot_control`).
- **Direct URL/API attempts:** `/domolux-manage` and `/domolux-family` opened
  manually render no family member data; `/api/states/<hidden>` returns `401`;
  the hidden light is denied from the page's own WebSocket; a manual login as
  Child A in a context that previously held the Father leaves no Father data or
  name behind (`browser.child_a_parent_console_has_no_family_data`,
  `child_a_family_manager_has_no_family_data`,
  `child_a_rest_hidden_entity_denied`, `account_switch_*`).
- **Browser errors:** no failed page requests across the three sessions
  (`browser.no_failed_page_requests`). Screenshots:
  `evidence/E2E/screenshots/` (father-overview, child-a-overview,
  child-b-overview, child-a-after-revoke, child-a-parent-console,
  account-switch-child-a).

## Build and deployment

- **Build command:** `yarn build:domolux` → `gulp build-domolux-roles`, which
  bundles `src/` into `build/domolux_roles/` and emits `domolux-assets.json`.
  `build-scripts/deploy-domolux-roles.mjs` then copies exactly the manifest
  entries into `custom_components/domolux_roles/frontend/` and removes stale
  generated files.
- **Asset manifest count:** 15 runtime assets
  (`custom_components/domolux_roles/frontend/.domolux-assets.json`).
- **Installed runtime assets:** 27 files, 1.7 MB in
  `custom_components/domolux_roles/frontend/` (entrypoint, code-split chunks,
  formatjs polyfills, logos, plus the dependency-free
  `domolux_revoke_watch.js` served without a build step).
- **Production self-containment:** no runtime dependency on a CDN. All scripts,
  chunks, styles, and images are served from
  `/api/domolux_roles/frontend/*` by the integration's own static route, with
  traversal rejected. The browser suite records zero failed requests, proving
  the page resolves everything from the Home Assistant origin.

## Tests and quality checks

| Command                                         | Result                             | Notes                                                       |
| ----------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `python -m pytest tests/ -q`                    | **2575 passed**                    | unit, integration, isolated security, lifecycle             |
| `./e2e/run_e2e.sh`                              | **39 checks, 0 failures**          | real HA 2026.2.3: setup 13, enforce 17, revoke 3, persist 6 |
| `./e2e/run_browser_e2e.sh`                      | **28 checks, 0 failures, 2 known** | real Chrome: setup 13 + browser 28                          |
| `node --check e2e/cdp.mjs e2e/browser_e2e.mjs`  | pass                               | browser harness syntax                                      |
| `bash -n e2e/run_e2e.sh e2e/run_browser_e2e.sh` | pass                               | runner syntax                                               |
| `python -m pytest tests/enforcement/ -q`        | **47 passed**                      | service guard 29, smuggling 9, read channel 9               |

Artifacts: `evidence/E2E/results.txt`, `evidence/E2E/browser_results.txt`,
`evidence/E2E/screenshots/`. Container credentials, `.storage` copies, and state
files are intentionally **not** committed (`.gitignore`); they are regenerated
by every run.

## Files changed

User-owned work already present in the tree (`dashboards/lovelace.*.yaml`
deletions, `src/panels/lovelace/views/hui-view-background.ts`,
`components/`, `.claude/`, the first `graphify-out/` `.gitignore` line) is
excluded from this change set and left untouched.

| File                                                               | Change                 | Rationale                                                                                                 |
| ------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `custom_components/domolux_roles/service_guard.py`                 | **new** (393 lines)    | Server-side `ServiceRegistry.async_call` guard covering native WS, REST, scripts, automations, and scenes |
| `custom_components/domolux_roles/read_channel_guard.py`            | **new** (249 lines)    | Guards `/api/history/period` and `/api/logbook`, which core does not permission-filter                    |
| `custom_components/domolux_roles/resolver.py`                      | **new** (224 lines)    | Pure policy decision function, no `hass` / I/O                                                            |
| `custom_components/domolux_roles/frontend/domolux_revoke_watch.js` | **new**                | Dependency-free live refresh: refreshes the affected session on permission change                         |
| `custom_components/domolux_roles/permission_evaluator.py`          | rewritten (−180 lines) | Thin I/O adapter over the pure resolver                                                                   |
| `custom_components/domolux_roles/service_auth_api.py`              | modified               | Mediated execution hardening, `entity_id`/target smuggling rejection, `supports_response` fix             |
| `custom_components/domolux_roles/ha_auth_adapter.py`               | modified               | Correct native policy nesting, `bind`, `async_assign_native_user_group`                                   |
| `custom_components/domolux_roles/role_manager.py`                  | modified               | Father gets exactly one native group; managed Child group provisioning                                    |
| `custom_components/domolux_roles/api.py`                           | modified               | Subscription authorization now fails closed                                                               |
| `custom_components/domolux_roles/frontend.py`                      | modified               | Registers/unregisters the live refresh module via `add_extra_js_url`                                      |
| `custom_components/domolux_roles/__init__.py`                      | modified               | Installs/restores the guards and the live refresh module                                                  |
| `tests/enforcement/test_service_guard.py`                          | **new** (29 tests)     | Proves native-channel denial and mediated-context execution                                               |
| `tests/enforcement/test_service_target_smuggling.py`               | **new** (9 tests)      | Proves target smuggling is rejected                                                                       |
| `tests/enforcement/test_read_channel_guard.py`                     | **new** (9 tests)      | Proves history/logbook filtering per user                                                                 |
| `tests/test_domolux_revocation_watcher.py`                         | **new** (7 tests)      | Registration + shipped-module behaviour                                                                   |
| `tests/test_domolux_frontend_content_type.py`                      | **moved** from `test/` | Kept the whole suite under `tests/` (one `testpaths`)                                                     |
| `tests/test_domolux_permission_api.py`                             | modified               | Replaced `assert True` with behavioural assertions                                                        |
| `tests/test_domolux_service_auth.py`                               | modified               | Behavioural enforcement tests (+318 lines)                                                                |
| `tests/test_domolux_subscription.py`                               | modified               | Behavioural fail-closed subscription tests                                                                |
| `tests/test_domolux_ha_auth_adapter.py`                            | modified               | Native policy shape assertions                                                                            |
| `tests/isolated_security/test_child_readonly_exact_replacement.py` | modified               | Proves the Child group is the only group                                                                  |
| `tests/conftest.py`                                                | modified               | Minimal `aiohttp` stub for environments without it; no test-only shortcuts in product code                |
| `pyproject.toml`                                                   | modified               | `testpaths = ["tests"]` so the whole suite is discoverable                                                |
| `e2e/domolux_e2e.py`                                               | **new**                | API-level E2E: setup / enforce / revoke / persist against a live instance                                 |
| `e2e/run_e2e.sh`                                                   | **new**                | Disposable-container orchestration for the API suite                                                      |
| `e2e/cdp.mjs`                                                      | **new**                | Zero-dependency Chrome DevTools Protocol client                                                           |
| `e2e/browser_e2e.mjs`                                              | **new**                | 28-check browser suite for Father and both Children                                                       |
| `e2e/run_browser_e2e.sh`                                           | **new**                | Disposable-container orchestration for the browser suite                                                  |
| `evidence/E2E/results.txt`                                         | **new**                | API suite output (39 checks)                                                                              |
| `evidence/E2E/browser_results.txt`                                 | **new**                | Browser suite output (28 checks)                                                                          |
| `evidence/E2E/screenshots/*.png`                                   | **new** (6)            | Father, Child A, Child B, post-revoke, panel attempts, account switch                                     |
| `FINDINGS.md`                                                      | rewritten              | F-1…F-5 with closure evidence and the gate table                                                          |
| `PROGRESS.md`                                                      | appended               | Hardening pass record: changes, totals, new defects                                                       |
| `verification/VERIFICATION_REPORT.md`                              | rewritten              | READY verdict backed by the runs above                                                                    |
| `verification/03_task_verdicts.csv`                                | modified               | 14 task verdicts updated from audit reality                                                               |
| `docs/STATUS_CLASSIFICATION.csv`                                   | modified               | 14 task classifications updated with code/test paths                                                      |
| `docs/HA_HOOKPOINTS.md`                                            | modified               | Pinned to Home Assistant 2026.2.3 with verified hook points                                               |
| `docs/SCOPE_DECISIONS.md`                                          | **new**                | Records deliberate scope calls (registry names, preview mode)                                             |
| `.gitignore`                                                       | modified               | Excludes E2E state/logs that hold live test credentials                                                   |

## Remaining risks and limitations

1. **F-4 — Father-only panels in every sidebar (LOW, no data exposure).**
   Home Assistant registers panels globally; there is no per-user panel gate.
   Opening "Parent Console" or "Family Manager" as a Child renders no member
   data. Recommended follow-up: filter sidebar entries in the injected frontend
   module.
2. **F-5 — one cosmetic "Entity not found" tile (LOW).** The generated overview
   binds a "Devices" tile to `zone.home`, which deny-by-default hides from a
   Child. No name, state, or attribute is disclosed. Recommended follow-up:
   grant Children read on `zone.home` as a documented baseline.
3. **T3.3 — registry names are not permission-filtered.** Entity and area
   **names** are visible (for example "Kitchen"), but no state, attribute,
   history, or control is. Fixing this needs a registry proxy, outside the
   entity-visibility promise.
4. **T11.2 — the LC-01…22 matrix is not mapped 1:1** to E2E checks; behaviour is
   covered, traceability is not complete.
5. **T14.2 — Preview-as-Child is not implemented.** The Father console shows
   computed permission lists only.
6. **Not verified:** soak/soak-mutation runs, coverage measurement, `kill -9`
   crash drills, and red-team exercises (T5.x, T7.x, T10.4/T10.5,
   T11.3–T11.6, T12.x).
7. **Coupling to core internals.** `read_channel_guard.py` wraps registered
   aiohttp route handlers and `service_guard.py` wraps `ServiceRegistry`.
   Re-run both E2E suites on every Home Assistant upgrade; `T3.2` notes this.

## Rollback instructions

No storage schema changed and no migration is required, so rollback is a code
revert plus a restart.

1. Stop Home Assistant.
2. Revert the change set:
   ```bash
   git revert --no-commit <first-commit>^..<last-commit>
   # or, if the work is uncommitted:
   git restore --source=HEAD -- custom_components/domolux_roles tests e2e \
     pyproject.toml docs verification FINDINGS.md PROGRESS.md
   git clean -fd custom_components/domolux_roles tests/enforcement e2e evidence verification
   ```
3. Remove the generated role data only if you also want to erase assignments:
   `.storage/domolux_auth` (deleting it resets every Father/Child assignment;
   Home Assistant users themselves remain and must be cleaned in the UI).
4. Start Home Assistant. The integration reverts to mediated-only enforcement;
   **native** WebSocket/REST/script calls are no longer guarded, so do not run a
   reverted build with untrusted accounts.
5. Confirm rollback: `curl -s -o /dev/null -w '%{http_code}' http://<host>:8123/api/`
   and check the log for `domolux_roles` setup errors.

Because the guards are installed at runtime and removed in `async_unload_entry`,
unloading or disabling the integration also restores the original
`ServiceRegistry` and route handlers without dropping the Home Assistant
database — useful for a canary rollback without a code revert.
