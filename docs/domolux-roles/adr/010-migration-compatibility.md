# ADR 010: Migration & Compatibility

## Status

Accepted

## Context

Existing v2 storage records must be migrated safely to v3 without widening access or corrupting data.

## Decision

1. **Idempotent Dry-Run Migration:** Migration supports a dry-run mode reporting exact transformation diffs before committing.
2. **Zero-Widening Guarantee:** Migration can narrow or preserve permissions, but must never automatically widen access.
3. **Quarantine on Corruption:** Corrupt storage files are isolated and renamed rather than overwritten or defaulted to allow.

## Consequences

- Safe upgrade path for existing deployments.
- Absolute protection against data corruption or unintended permission widening.
