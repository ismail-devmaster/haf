# ADR 006: Service Target Resolution

## Status

Accepted

## Context

Service calls in Home Assistant can target entities directly, via device IDs, areas, floors, labels, or composite selectors.

## Decision

1. **Core Helper Reuse:** Domolux service authorization must reuse Home Assistant Core's native target-expansion helpers to ensure semantic parity and prevent parser divergence.
2. **All-or-Nothing Evaluation:** Multi-target service calls must evaluate every resolved entity to `control`. A single unauthorized target rejects the entire call.
3. **Unresolvable Targets:** Any unresolvable target identifier defaults to fail-closed (`deny`).

## Consequences

- Perfect alignment with Home Assistant Core target parsing.
- Prevention of partial-execution bypasses on multi-target service calls.
