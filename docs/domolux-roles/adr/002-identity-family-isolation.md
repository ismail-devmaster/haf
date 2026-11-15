# ADR 002: Identity & Family Isolation

## Status

Accepted

## Context

Domolux manages households partitioned into families, each managed by a single Father, with multiple Child accounts. We must prevent cross-family data access and privilege escalation.

## Decision

1. **Authenticated Principal Resolution:** Principal identity (`admin`, `father`, `child`, `standard_user`) is derived exclusively from the authenticated transport connection (`connection.user`), never from payload arguments.
2. **Family Partitioning:** Every Child profile belongs to exactly one `family_id`. All query and mutation APIs enforce `object.family_id == caller.family_id` (with Admin exemption).
3. **Uniform Denials:** Any attempt to access resources across family boundaries or non-existent targets must return a uniform `not_found`/`unauthorized` response, preventing existence oracles.

## Consequences

- Strong multi-tenant isolation within a single Home Assistant instance.
- Prevents IDOR and privilege escalation across family partitions.
