# ADR 004: Native Home Assistant Authorization & Enforcement

## Status

Accepted

## Context

Home Assistant Core's native permission checks and group policies can allow non-admin users to control entities. We must ensure robust enforcement across all ingress paths.

## Decision

1. **Phase 1 Enforcement (O-1 Floor + Mediation):** Child accounts are placed in Home Assistant's read-only floor group (or restricted via native configuration), effectively revoking native control. All authorized control requests are channeled through Domolux's mediated service path (`service/call`).
2. **Mediated Execution:** The mediated service path validates the request against the Domolux evaluator before executing with system or parent context.
3. **Fail Closed:** Any evaluator error, unknown target, or unauthorized action results in immediate denial.

## Consequences

- Closes native control bypass vectors for Child accounts.
- Establishes a clear security boundary for service execution.
