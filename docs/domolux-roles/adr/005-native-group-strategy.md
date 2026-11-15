# ADR 005: Native Group Strategy & Limitations

## Status

Accepted

## Context

Home Assistant group policies use permissive-wins merging. Mixing read-write and read-only groups can compromise security boundaries.

## Decision

1. **Explicit Group Membership Replacement:** When configuring Child accounts, Domolux must explicitly set group memberships to prevent privilege accumulation from residual groups.
2. **Documented Limitations:** Native group membership restricts broad actions but does not guarantee per-entity read confidentiality across all side-channel APIs (such as raw template rendering or history endpoints). These limitations are explicitly documented.

## Consequences

- Clean separation of user privilege levels without unexpected permission inheritance.
- Honest, transparent security posture documentation.
