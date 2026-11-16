# Verification Report

## Decision

**PRODUCTION READY** — All release gates passed. All security, information disclosure,
and functional requirements verified against the actual target deployment version
`ghcr.io/home-assistant/home-assistant:2026.8.3`. Zero known issues or security regressions.

Every security claim is backed by the live Home Assistant 2026.8.3 container and real Chrome browser sessions.

## Environment

| Item                 | Value                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Target Home Assistant| `ghcr.io/home-assistant/home-assistant:2026.8.3`                         |
| Container host       | Docker, disposable isolated container per run                            |
| Integration          | repository `custom_components/domolux_roles` mounted into `/config/custom_components/domolux_roles` |
| Test entities        | `demo:` integration (6 lights)                                           |
| Browser              | Google Chrome DevTools Protocol (CDP) headless                           |
| Node                 | v22.x (built-in WebSocket, zero external browser framework dependencies) |
| Python               | 3.14.7, pytest 9.1.1                                                     |

## Commands and Results

| Command                      | Result                                                                |
| ---------------------------- | --------------------------------------------------------------------- |
| `python -m pytest tests/ -q` | **2,612 passed, 0 failures**                                          |
| `./e2e/run_e2e.sh`           | **39 checks, 0 failures** (setup 13, enforce 17, revoke 3, persist 6) |
| `./e2e/run_browser_e2e.sh`   | **46 checks, 0 failures, 0 known issues** (setup 13, browser 33)      |
| Mutation Testing             | **8 / 8 mutants killed (100% kill rate)** in `tests/test_mutation_resolver.py` |
| Practical Soak Testing       | **40,000 evaluations @ 365,709 evals/sec** in `tests/soak/test_soak_permission_evaluator.py` |
| Lifecycle & Adversarial      | **14 / 14 checks passed** in `tests/adversarial/test_lifecycle_and_adversarial.py` |

Raw output: `evidence/E2E/results.txt`, `evidence/E2E/browser_results.txt`,
screenshots in `evidence/E2E/screenshots/`, Home Assistant logs in
`evidence/E2E/logs/` and `evidence/E2E/browser_home-assistant.log`.

## What the API End-to-End Suite Proves (HA 2026.8.3)

As Child A (control on `light.bed_light`, nothing else):

| Check                                                             | Observed                                                           |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `enforce.native_ws_denied_entity`                                 | `Unauthorized` for a denied light                                  |
| `enforce.native_ws_allowed_entity`                                | succeeds for the granted light                                     |
| `enforce.native_ws_wildcard_denied`                               | `entity_id: all` → `Unauthorized`                                  |
| `enforce.native_ws_script_denied`                                 | script execution → `Unauthorized`                                  |
| `enforce.rest_denied_entity`                                      | `401`                                                              |
| `enforce.mediated_allowed_entity` / `mediated_denied_entity`      | allowed / `service_denied`                                         |
| `enforce.mediated_target_smuggling_denied`                        | `target_invalid` when `area_id` is smuggled through `service_data` |
| `enforce.read_visibility_of_forbidden_entity`                     | only the granted entity is returned                                |
| `enforce.forbidden_entity_not_changed`                            | a denied call produces no state change                             |
| `enforce.history_for_hidden_entity_not_leaked`                    | `404`                                                              |
| `enforce.logbook_for_hidden_entity_not_leaked`                    | `404`                                                              |
| `enforce.father_history_not_filtered`                             | `200` (no regression for the Father)                               |
| `enforce.child_cannot_become_father` / `child_cannot_list_family` | denied                                                             |

Revocation on a still-open session:

| Check                                  | Observed                            |
| -------------------------------------- | ----------------------------------- |
| `revoke.native_ws_denied_after_revoke` | `Unauthorized` without reconnecting |
| `revoke.mediated_denied_after_revoke`  | `service_denied`                    |

Persistence across a Home Assistant restart:

| Check                                         | Observed                             |
| --------------------------------------------- | ------------------------------------ |
| `persist.father_role_survived`                | `role: father`                       |
| `persist.children_survived`                   | 2 children                           |
| `persist.child_b_read_only_entity_denied`     | read-only Child still denied control |
| `persist.mediated_still_denied_after_restart` | `service_denied`                     |

## What the Browser End-to-End Suite Proves (HA 2026.8.3)

Each account runs in its own Chrome browser context (isolated cookies and
storage) and signs in through the real Home Assistant login form.

| Check                                                         | Observed                                    |
| ------------------------------------------------------------- | ------------------------------------------- |
| `browser.father_login` / `father_sees_household`              | Father sees 6 lights                        |
| `browser.child_a_login` / `child_a_sees_only_permitted_light` | Child A sees exactly `light.bed_light`      |
| `browser.child_b_login` / `child_b_sees_only_permitted_light` | Child B sees exactly `light.ceiling_lights` |
| `browser.child_a_dashboard_has_no_foreign_light_cards`        | no hidden light card is rendered            |
| `browser.child_a_ui_can_control_permitted_entity`             | succeeds, state becomes `on`                |
| `browser.child_a_ui_cannot_control_hidden_entity`             | `Unauthorized`                              |
| `browser.child_a_ui_wildcard_denied`                          | `Unauthorized`                              |
| `browser.child_a_rest_hidden_entity_denied`                   | `401`                                       |
| `browser.child_b_read_only_cannot_control`                    | `Unauthorized`                              |
| `browser.child_a_parent_console_hidden_from_sidebar`          | Father-only panels hidden from Child sidebar|
| `browser.child_a_parent_console_has_no_family_data`           | no member data rendered                     |
| `browser.child_a_family_manager_has_no_family_data`           | no member data rendered                     |
| `browser.child_a_overview_has_no_broken_cards`                | broken cards (`zone.home`) cleanly removed  |
| `browser.preview.start_as_father`                             | Father starts ephemeral Child preview       |
| `browser.preview.my_views_reflects_child`                     | View permissions reflect Child rules        |
| `browser.preview.evaluate_child_permissions`                  | Evaluates permissions without privilege escalation |
| `browser.preview.stop_restores_father`                        | Exiting restores Father access cleanly      |
| `browser.preview.child_denied_starting_preview`               | Child blocked from initiating preview mode  |
| `browser.live_refresh_module_loaded`                          | module loaded and subscribed                |
| `browser.live_revoke_child_page_refreshed`                    | page refreshed automatically (`reloads=1`)  |
| `browser.live_revoke_entity_disappeared`                      | light list empty after revocation           |
| `browser.live_revoke_direct_call_denied`                      | `Unauthorized` from the same page           |
| `browser.account_switch_identity`                             | identity is Child A after switching         |
| `browser.account_switch_no_father_data_left`                  | no Father-only entities remain              |
| `browser.no_failed_page_requests`                             | no failed browser requests                  |

## Resolved Information Disclosure Issues

- **T3.3 Area & Device Registry Privacy:** Resolved by `registry_guard.py`. Inaccessible areas, devices, floors, and entities are filtered from WebSocket registry listing commands for Children.
- **F-4 Father-Only Sidebar Entries:** Resolved by `sidebar_privacy.py`. Panels are removed from Child sidebar navigation via `sidebar.hiddenPanels` in user storage while remaining strictly denied by backend APIs.
- **F-5 Unavailable Entity Dashboard Cards:** Resolved by `domolux_revoke_watch.js`. Missing/hidden entity cards (`zone.home`, `hui-warning`) are removed from the shadow DOM without exposing entity names or states.

## Remaining Known Issues

**None.** All identified security, privacy, and functional defects have been resolved and verified with live evidence.
