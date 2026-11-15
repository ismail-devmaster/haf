# Domolux Roles Threat Model

## Actors

- **Father**: Single administrative controller for the family domain.
- **Child**: Restricted family member with fine-grained per-entity/area grants.
- **Ex-Father / Removed Child**: Former accounts whose sessions and tokens must be invalidated.
- **Curious Child with Raw WS Client**: Attacker using raw WebSocket connections to bypass UI controls.

## Trust Boundaries

- Between Father and Child users.
- Between Home Assistant Core admin capabilities and Domolux role enforcement.
- Between UI presentation layer and backend server-side authorization enforcement.

## STRIDE Analysis

- **Spoofing**: Prevented by HA auth and single-Father invariant.
- **Tampering**: Prevented by strict storage validation and atomic writes.
- **Repudiation**: Addressed by structured audit logging.
- **Information Disclosure**: Addressed by server-side read/visibility filtering (Phase 3).
- **Denial of Service**: Addressed by rate limiting and bounded resource checks.
- **Elevation of Privilege**: Addressed by strict service-call enforcement and privilege escalation tests (Phase 2 & 6).
