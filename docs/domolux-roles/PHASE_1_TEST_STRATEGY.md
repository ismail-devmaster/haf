# Domolux Roles — Phase 1 Test Strategy

## 1. Evaluator & Storage Tests (H-1 Harness)

### Golden Vectors (must pass)

- All 20 examples from §8.8 of the master specification.
- Every edge case from §6.7 and §7.4.

### Property-Based Invariants

- **Determinism:** Same inputs ⇒ same output across runs.
- **Rule-Order Independence:** Permission decisions are independent of rule evaluation order.
- **Default Deny:** Empty profile ⇒ `N` (none) for every resource.
- **Deny Supremacy:** A locked deny always wins, regardless of broader grants or bulk actions.
- **No Escalation:** Removing any rule never raises any level; adding a view grant never raises a level above the baseline cap.
- **Monotonic Caps:** Never exceeds capability ceiling (e.g., `control` on a sensor collapses to `read`).
- **Idempotent Migration:** Second migration pass changes nothing.
- **Family Partition:** No decision for family A ever reads family B data.

### Differential Tests

- Over generated and real v2 rule shapes: new access must never exceed old access (no widening). Any narrowing is listed and justified.

### Fuzz Tests

- Malformed/huge/unicode/nested/mistyped payloads for every command and service target (lists, comma strings, `all`, labels, groups, templates).
- Clean rejection; no exception leak; no partial writes.

### Concurrency Tests

- Two simultaneous profile saves ⇒ exactly one succeeds, the other gets `revision_conflict`; storage never corrupted.
- Crash-restart durability for revocations.

## 2. API Authorization Matrix (T-ROLE)

| ID        | Scenario                                                           | Admin                 | Father   | Child    | Standard User | Unauth |
| --------- | ------------------------------------------------------------------ | --------------------- | -------- | -------- | ------------- | ------ |
| T-ROLE-01 | For every command in §9.2                                          | ✔                     | ✔ (own)  | ✘        | ✘             | ✘      |
| T-ROLE-02 | `user_id`, `role`, `family_id` in payloads of self-scoped commands | Ignored               | Ignored  | Ignored  | Ignored       | ✘      |
| T-ROLE-03 | Standard user (no family) calls family/permission commands         | Denied                | Denied   | Denied   | Denied        | ✘      |
| T-ROLE-04 | Unauthenticated WS/REST to Domolux endpoints                       | Rejected by transport | Rejected | Rejected | Rejected      | ✘      |

## 3. Account Lifecycle (T-ACCT)

| ID        | Scenario                                            | Expected                                                                                            |
| --------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| T-ACCT-01 | Father creates Child                                | Non-admin HA user, active, empty deny-all profile, event + audit                                    |
| T-ACCT-02 | Create with existing HA username                    | Rejected, no side effects, no takeover                                                              |
| T-ACCT-03 | Failure injected mid-creation                       | Full rollback, no orphan HA user/profile                                                            |
| T-ACCT-04 | Edit Child: allowed fields only                     | Allowed fields applied; others rejected                                                             |
| T-ACCT-05 | Delete Child                                        | Tokens revoked (incl. long-lived); HA user + profile removed; audit tombstone; idempotent on repeat |
| T-ACCT-06 | Disable/enable Child                                | Disabled ⇒ all calls denied and WS connections closed; enable restores profile                      |
| T-ACCT-07 | Revoke a view/device/entity/dashboard/whole profile | Next request already denied (T-REV)                                                                 |

## 4. Dashboard/View (T-DASH)

| ID        | Scenario                                 | Expected                                                              |
| --------- | ---------------------------------------- | --------------------------------------------------------------------- |
| T-DASH-01 | Dashboard assigned vs not assigned       | `can_open` true/false accordingly                                     |
| T-DASH-02 | View assigned vs unassigned              | Only assigned openable; others uniform "not available"                |
| T-DASH-04 | Read Only view                           | Opens; confers no control (§6.4); service calls needing it are denied |
| T-DASH-05 | Read & Control view                      | Structured entities get baseline C within caps                        |
| T-DASH-09 | View renamed/re-pathed/reordered/removed | Grant orphaned (inert); no silent re-bind                             |

## 5. Device/Entity (T-DEV)

| ID          | Scenario                                    | Expected                                                                          |
| ----------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| T-DEV-01…03 | No access / Read Only / Read & Control      | Backend level + service outcome as §7.2                                           |
| T-DEV-04    | Device inheritance incl. caps               | §8.8 #7                                                                           |
| T-DEV-05    | Entity override both directions             | §8.8 #4, #8, #9                                                                   |
| T-DEV-08    | Unassigned / newly discovered device/entity | Denied by default; new entity on granted device inherits with caps and is flagged |

## 6. Security Suite (T-SEC)

| ID       | Scenario                                                                                                     | Expected                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| T-SEC-01 | Child WS `call_service` on denied entity                                                                     | Rejected; entity state unchanged                                            |
| T-SEC-02 | Same via REST `/api/services`                                                                                | Rejected; unchanged                                                         |
| T-SEC-04 | Mediated `service/call` matrix across levels and domains                                                     | Per §10.3                                                                   |
| T-SEC-05 | Multi-target: entity list, comma string, `all`, mixed allowed+denied                                         | All-or-nothing; nothing executes on partial denial; `all` denied            |
| T-SEC-07 | Scripts: bounded reach (allowed/denied), unbounded (denied unless delegated), nested, cyclic                 | Per §10.4                                                                   |
| T-SEC-08 | Scenes: member containment, `scene.apply`, `scene.create`                                                    | Per §10.4                                                                   |
| T-SEC-11 | Cross-family: Father A reads/edits B1; Child A1 reads B-data                                                 | Denied/absent                                                               |
| T-SEC-12 | Escalation: Father grants above own ceiling                                                                  | Rejected; no state change                                                   |
| T-SEC-13 | Stale permissions: revoke while Child has open WS and cached lists                                           | Next call denied; push update received; connection closed on delete/disable |
| T-SEC-14 | Identity spoofing: forged payload identity; another user's `person` linkage; replayed/expired/removed tokens | No effect; removed tokens rejected                                          |
| T-SEC-15 | Long-lived tokens minted by Child before revocation                                                          | Revoked with the user                                                       |

## 7. Negative Controls (prove tests can fail)

- Test-only switch that disables enforcement (allow-all evaluator) demonstrates tests turn red; switch must not exist in production code (R-16).
- Mutation sample on evaluator (flip a comparison, drop a cap) demonstrates tests fail.

## 8. Performance Tests (T-PERF)

- Evaluator decision p95 latency with 1,000+ entities and large profiles (cached and uncached).
- Catalog build time on 780 KB fixture; tree node fetch latency; storage write time; memory growth.
- UI budgets of §11.5 on throttled profile.
