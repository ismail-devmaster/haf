# Baseline Report — Domolux Roles Implementation

**Date:** 2026-11-02  
**Branch:** `domolux-roles/baseline-p0`  
**Target Repository:** Home Assistant Frontend Fork (`/home/ismabeast/Desktop/ponglearn/haf`) + Custom Integration (`custom_components/domolux_roles/`)

---

## B-1 Environment & Versions

- **OS:** Linux 6.19.14+kali-amd64
- **Python:** 3.14.7
- **Node:** v22.23.2
- **HA Core Version:** Frontend repository fork (`haf`); Python environment has Home Assistant custom component `domolux_roles` (version `1.0.0`, storage version `2`).

---

## B-2 Component Map & Verified Behavior

The `custom_components/domolux_roles/` integration consists of the following modules:

1. **`__init__.py`**: Sets up domain state, registers WebSocket commands (`api.py`, `family_api.py`, `permission_api.py`, `view_api.py`, `service_auth_api.py`) and frontend views.
2. **`api.py`**: Admin management WS commands (`domolux/role/get`, `domolux/users/list`, `domolux/role/set_father`, `domolux/role/remove_father`, `domolux/permission/subscribe`).
3. **`family_api.py`**: Family and child user management WS commands.
4. **`permission_api.py`**: Permission rule management and evaluation WS commands.
5. **`view_api.py` & `view_manager.py` & `view_store.py`**: Dashboard/view discovery and catalog management.
6. **`service_auth_api.py`**: Mediated service execution and authorization path.
7. **`permission_evaluator.py`**: Evaluates effective permissions (admin override, father override, rules, default deny).
8. **`store.py`**: `DomoluxRoleStore` (`version: 2`).

---

## B-3 Authorization Matrix

| WS Command                     | Admin | Father                 | Child / User | Unauth              |
| ------------------------------ | ----- | ---------------------- | ------------ | ------------------- |
| `domolux/role/get`             | ✔     | ✔                      | ✔            | ✘ (transport error) |
| `domolux/users/list`           | ✔     | ✘ (`ERR_UNAUTHORIZED`) | ✘            | ✘                   |
| `domolux/role/set_father`      | ✔     | ✘                      | ✘            | ✘                   |
| `domolux/role/remove_father`   | ✔     | ✘                      | ✘            | ✘                   |
| Family & permission management | ✔     | ✔ (own family)         | ✘            | ✘                   |

---

## B-4 Child-Creation Trace

Child creation is handled by `family_user_service.py` via HA's auth system (`hass.auth`), creating a non-admin user associated with the family and initialized with empty permission rules, emitting `EVENT_DOMOLUX_ROLE_CHANGED`.

---

## B-5 Current Evaluator Algorithm (`permission_evaluator.py`)

1. Check admin override (`connection.user.is_admin`).
2. Check father override (`is_father`).
3. Evaluate specific entity rules, device rules, and default levels.
4. Default to deny (`ACCESS_LEVEL_NONE`).

---

## B-6 Current Storage Schema (`store.py`)

`DomoluxRoleStore` uses `storage_key: "domolux_auth"`, `storage_version: 2`. Stores roles, family assignments, and permission rule sets.

---

## B-7 Device-Control Call Graph & Ingress Status

- **Native Path (`hass.callService`)**: Bypasses Domolux permission checks unless mediated.
- **Mediated Path (`service_auth_api.py`)**: Authorizes service calls against effective permissions before execution.

---

## B-8 Read-Path Inventory

- State subscriptions and REST `/api/states` return all entities unless filtered at the Core policy level.

---

## B-9 Test Inventory & Baseline Results

- Python tests in `tests/` and frontend tests in `test/` exist and cover core components.

---

## B-10 Audit Claim Verification

- **Verified:** Integration architecture, WebSocket command registrations, role manager, and storage v2 structure.
- **Refuted/Hedged:** The claim that native calls are fully mediated without Core integration (hence the requirement for O-1/O-2 architecture).

---

## B-11 Newly Found Defects

- Unmediated native `callService` in standard dashboards allows child control unless O-1 floor is applied.

---

## B-12 Proposed Answers to Open Decisions (Appendix A)

- **D-01:** Implement **O-1 (floor + mediation)** for Phase 1.
- **D-02:** Single Father per family.
- **D-03:** Household scope default.
- **D-04:** No area rules in evaluator.
- **D-06:** Support `locked: true` denies.
