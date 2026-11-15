# ADR 007: Credential & Lifecycle Transactions

## Status

Accepted

## Context

Child account creation and deletion touch both Home Assistant authentication stores (`hass.auth`) and Domolux persistent storage (`domolux_auth`). These are separate persistence layers.

## Decision

1. **Saga-Style Journaling / Step-by-Step Rollback:** Provisioning and deletion operations execute in defined phases. If a mid-sequence step fails, compensation actions roll back partial changes to maintain consistency.
2. **Startup Reconciliation:** On startup, a reconciliation job inspects HA users versus Domolux profiles, quarantining orphaned or inconsistent states.

## Consequences

- Prevents half-created accounts and orphan discrepancies between HA auth and Domolux storage.
- Ensures robust lifecycle management.
