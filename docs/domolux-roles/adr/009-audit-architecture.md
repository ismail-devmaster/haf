# ADR 009: Audit Architecture

## Status

Accepted

## Context

We need a reliable audit trail for permission mutations, role changes, and security denials without bloating the primary permission store.

## Decision

1. **Actor/Subject Separation:** Audit records explicitly separate the `actor` (who performed the action) from the `subject` (affected user/resource).
2. **Ring Buffer / Bounded Log:** Audit records are stored in a separate, bounded ring-buffer store to prevent unbounded disk growth.
3. **Rate-Limited Denies:** Deny decisions are logged with rate-limiting to prevent log spamming.

## Consequences

- Clear accountability and forensic visibility.
- Bounded storage usage for audit logs.
