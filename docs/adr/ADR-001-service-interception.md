# ADR-001: Service-Call Interception & Enforcement Architecture

## Status

ACCEPTED

## Context

Domolux Roles needs to prevent Child users from executing unauthorized service calls (D1 critical vulnerability). A Child allowed to control a specific living room light must not be able to control curtains, air conditioning, locks, or arbitrary services.

## Decision

We implement a **Defense-in-Depth Service Guard**:

1. **Layer 1: WebSocket & REST Service Authorization Gate** (`domolux/service/authorize`, `domolux/service/enforce`), validating domain/service allowlists and concrete entity controls.
2. **Layer 2: Service Registry / Context Guard** intercepting service execution requests originating from Child sessions, validating all target expansions (entities, devices, areas, labels, service_data payloads, templates, nested script/scene/automation calls).
3. **Layer 3: Atomic Evaluation & Fail-Closed Policy** ensuring any unauthorized target in a batch or expansion results in total request denial with zero side effects.

## Consequences

- Complete elimination of D1 bypass vectors.
- Zero partial execution on multi-target or group calls.
- High performance via caching and fast-path for Father/Admin users.
