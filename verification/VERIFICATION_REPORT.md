# Verification Report

## Decision

**READY for internal family use** — with two documented, non-security known
issues (F-4, F-5) and one documented coverage limitation (registry names, T3.3).

Every P0 security claim is backed by a real Home Assistant instance and, where
the requirement is about the browser, by real Chrome sessions.

## Environment

| Item                 | Value                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Home Assistant image | `ghcr.io/home-assistant/home-assistant:2026.2.3`                         |
| Container host       | Docker, disposable container per run                                     |
| Integration          | repository `custom_components/` mounted into `/config/custom_components` |
| Test entities        | `demo:` integration (6 lights)                                           |
| Browser              | Google Chrome 149 headless, driven over the DevTools Protocol            |
| Node                 | v22.x (built-in WebSocket, no browser test dependency added)             |
| Python               | 3.14                                                                     |

## Commands and results

| Command                      | Result                                                                |
| ---------------------------- | --------------------------------------------------------------------- |
| `python -m pytest tests/ -q` | **2575 passed**                                                       |
| `./e2e/run_e2e.sh`           | **39 checks, 0 failures** (setup 13, enforce 17, revoke 3, persist 6) |
| `./e2e/run_browser_e2e.sh`   | **28 checks, 0 failures, 2 known issues**                             |

Raw output: `evidence/E2E/results.txt`, `evidence/E2E/browser_results.txt`,
screenshots in `evidence/E2E/screenshots/`, Home Assistant logs in
`evidence/E2E/logs/` and `evidence/E2E/browser_home-assistant.log`.

## What the API end-to-end suite proves

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

## What the browser end-to-end suite proves

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
| `browser.child_a_parent_console_has_no_family_data`           | no member data rendered                     |
| `browser.child_a_family_manager_has_no_family_data`           | no member data rendered                     |
| `browser.live_refresh_module_loaded`                          | module loaded and subscribed                |
| `browser.live_revoke_child_page_refreshed`                    | page refreshed automatically (`reloads=1`)  |
| `browser.live_revoke_entity_disappeared`                      | light list empty after revocation           |
| `browser.live_revoke_direct_call_denied`                      | `Unauthorized` from the same page           |
| `browser.account_switch_identity`                             | identity is Child A after switching         |
| `browser.account_switch_no_father_data_left`                  | no Father-only entities remain              |
| `browser.no_failed_page_requests`                             | no failed browser requests                  |

## Known issues (non-security)

- **F-4** — Father-only panels ("Parent Console", "Family Manager") are listed
  in every sidebar. Home Assistant registers panels globally and offers no
  per-user gate. Opening them as a Child exposes no data (proven above).
- **F-5** — Home Assistant's generated overview renders one "Entity not found"
  tile for Children because the "Devices" tile targets `zone.home`, which
  deny-by-default hides. No name, state, or attribute is disclosed.

## Documented coverage limitation

- **T3.3** — entity and area **registry names** are not permission-filtered by
  Home Assistant core. A Child sees that an area exists (for example
  "Kitchen"), but receives no state, attribute, history, or control for hidden
  entities in it. Fixing this requires a registry proxy; it is out of scope for
  the entity-visibility promise, which is met.

## Reopen list (previously blocking, now closed)

- T2.2 — server-side service guard implemented (`service_guard.py`) and proven
  against native WebSocket, REST, script, automation, scene and mediated paths.
- T10.3 — `assert True` placeholders replaced with behavioural tests.
- T1.2 — pure resolver extracted (`resolver.py`); evaluator is a thin adapter.
- T3.2 — history/logbook read-channel guard implemented and proven.

## What was NOT verified

- Soak, mutation, coverage measurement, kill -9 crash drills, red-team
  exercises (T5.x, T7.x, T10.4, T10.5, T11.3-T11.6, T12.x).
- The LC-01..22 scenario matrix is not mapped 1:1 to E2E checks (T11.2).
- Preview-as-Child in the Father console (T14.2) is not implemented.
