# ADR 003: Permission Model & Precedence

## Status

Accepted

## Context

Children require independent, granular permissions over dashboards, views, devices, and entities. We need a deterministic, rule-based permission model with default-deny semantics.

## Decision

1. **Default Deny:** Any resource without an explicit grant or inherited allowance evaluates to `none` (No Access).
2. **Precedence Hierarchy:** Specificity governs evaluation: explicit entity rule > explicit device rule > view-derived baseline > default.
3. **Locked Denies:** A deny rule marked `locked: true` is absolute and cannot be overridden by broader grants, bulk actions, or presets.
4. **Capability Ceiling:** Entity types without control capabilities (e.g., sensors) collapse `control` to `read`.

## Consequences

- Predictable, deterministic permission evaluation.
- Absolute enforcement of safety locks configured by the Father.
