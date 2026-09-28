---
name: domolux-phase1-release
description: Phase 1 release documentation for Domolux Father Role system
metadata:
  type: project
---

# Domolux Father Role - Phase 1 Release

Phase 1 delivers: server-side RBAC for a single Household Father role (`father`), isolated storage, secure WebSocket API, administrator UI panel, and developer identity API.

**What exists:** Custom integration `custom_components/domolux_roles/`, persistent storage `.storage/domolux_auth`, 4 WebSocket endpoints (`domolux/role/get`, `domolux/users/list`, `domolux/role/set_father`, `domolux/role/remove_father`), admin panel `ha-config-domolux-roles`, frontend identity helper `src/data/domolux_roles.ts`.

**Invariants enforced:** Non-admin/non-owner only; UUID-bound identity; exactly one Father; fail-closed evaluation; server-side authorization; no `.storage/auth` modifications.

**Phase 2 safe build targets:** Family manager, multi-user permissions, device/entity authorization, room-based permission UI, expanded event system. Phase 1 identity layer (`getDomoluxRole`, `subscribeDomoluxRole`) is the stable contract.
