# ADR 001: System Architecture & Component Ownership

## Status

Accepted

## Context

The Domolux Roles integration provides family and child permission management for Home Assistant. We must establish a clear architectural boundary where `DomoluxRoleStore` is the single authoritative persistent store, `DomoluxPermissionEvaluator` is the sole authorization decision engine, and `service_auth_api.py` / `ha_auth_adapter.py` handle integration points with Home Assistant Core.

## Decision

1. **Single Authoritative Store:** All role, family, and permission data resides in `.storage/domolux_auth` governed by `DomoluxRoleStore`. No parallel permission store (such as uncoordinated view stores) may exist.
2. **Single Evaluator Engine:** `DomoluxPermissionEvaluator` is the sole authority for permission decisions. All APIs and enforcement paths must invoke this evaluator.
3. **Strict Boundaries:** Identity is resolved exclusively via `connection.user`. Payload-supplied user or role claims are ignored.

## Consequences

- Eliminates split-brain permission state.
- Ensures consistent evaluation across all UI and backend paths.
