# Domolux Roles — Phase 1 Security Analysis

## Ingress Coverage Matrix

| #   | Ingress                              | Expected Enforcement                           | Coverage                                 | Status                                |
| --- | ------------------------------------ | ---------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| 1   | WS `call_service`                    | Mediated via `service_auth_api.py` + evaluator | Control denied for Child                 | O-1 Floor+Median                      |
| 2   | REST `/api/services`                 | Same as WS `call_service`                      | Control denied for Child                 | O-1 Floor+Median                      |
| 3   | WS `execute_script`                  | Admin-only by Core                             | Child denied                             | ✅ Verified                           |
| 4   | REST template / render_template      | Read side-channel                              | Read permitted unless gated              | ⚠️ Unverified — documented limitation |
| 5   | WS `fire_event` / REST `/api/events` | Admin-only                                     | Child denied                             | ✅ Verified                           |
| 6   | Voice / Assist pipelines             | Household-level trust                          | No per-Child isolation                   | ⚠️ ⚠️ — documented limitation         |
| 7   | MQTT / Zigbee2MQTT broker UI         | Not enforceable                                | No integration-level control             | ⚠️⚠️ — documented limitation          |
| 8   | `lovelace/config` (native)           | Admin-only per Core (unverified)               | Child may read config if O-1 not applied | ⚠️ — documented, E-06 needed          |
| 9   | Mediated `domolux/service/call`      | Evaluator + authorization                      | Control only for authorized entities     | ✅ O-1                                |
| 10  | Frontend `hass.callService` (fork)   | Routes to Mediated or native per O-1 config    | Configurable per O-1                     | ✅ O-1                                |

## Threat Boundaries & Known Limitations

1. **Native Read Paths:** State subscriptions (`subscribe_entities`), REST `/api/states`, history, logbook, camera/media, statistics, and `render_template` / template rendering can leak entity states and attributes to non-admin users unless Core policy changes per O-2/O-3. The read-only floor group closes some paths but not all.

2. **Cross-Platform Control:** Scripts, scenes, automations, and MQTT/Zigbee2MQTT fall outside Domolux's direct enforcement. Mitigation: containment through `service_policy`, explicit delegation badges, and ambient-risk warnings in the UI.

3. **IDOR on User/Profile IDs:** Cross-family user/profile/view/dashboard ID access must return uniform `not_found` errors (per R-15 and ADR 002).

4. **Refresh Token Revocation:** Token revocation requires removing all refresh tokens (interactive + long-lived) and closing active WebSocket connections (per §9.5 and T-REV / T-SEC-13 / T-SEC-15).

5. **Composite Target Services:** Multi-target service calls follow all-or-nothing evaluation — a single entity denial rejects the entire call (per ADR 006).

6. **Script Containment:** Script reach is determined by static analysis with cycle detection and a depth limit. A Child may run a script only if they hold `control` on the script entity and either: (a) the reach set is bounded and they hold `control` on every reached entity, or (b) the script's rule has `delegated: true` with Father confirmation and audit (per §10.4 / ADR 007).

## Fail-Closed Rules

- **Any evaluator exception** ⇒ deny (default deny).
- **Unknown / unresolvable targets** ⇒ deny.
- **Cross-family access attempts** ⇒ uniform `not_found` denial (no existence oracle).
- **Payload-supplied identity** (user_id, family_id, role) ⇒ ignored; identity derived from `connection.user` only.
- **Storage corruption / parse error** ⇒ file quarantined, integration degraded, Admin alerted.
- **Revision conflict** ⇒ 409 error; UI merge/refresh dialog presented.
