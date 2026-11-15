# ADR 008: Persistence & Concurrency

## Status

Accepted

## Context

Multiple Fathers or administrative actions might attempt to update permissions concurrently. We must prevent race conditions and lost updates.

## Decision

1. **Optimistic Concurrency Control:** Every profile update requires an `expected_revision`. Mismatches trigger a `revision_conflict` error (HTTP 409 equivalent).
2. **Immediate Flashing for Security Actions:** Security-reducing mutations (revocations, disables, deletes) write to disk immediately rather than relying on debounced batching.

## Consequences

- Protection against lost updates during concurrent edits.
- Immediate revocation persistence for critical security events.
