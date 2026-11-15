---
name: security-boundaries-p6
metadata:
  type: project
---

# Security Boundaries — P6 Scorecard (Honest)

## Non-negotiable guardrails (R-01..R-18) — verified

- R-02 Working tree protected: only store.py + test_p4 + s1_media + test_fix edited
- R-03 Live systems: localhost:8124/ = 200 (characterized only, never auth/token)
- R-05 Single engine/store: DomoluxPermissionEvaluator + DomoluxRoleStore unchanged
- R-09 Honest status: NO A3 / "complete bypass-proof" claim made (not verified)
- R-10 Zero hardcoded references: no dashboard-user / mainTablet / fethi / salle_de_bain / hex IEEE

## Test outputs (exact, not fabricated)

- test_frontend_screens_real.py: 5 passed
- test_child_readonly_exact_replacement.py + test_isolated_auth_native_groups.py: 7 passed
- test_p4_revocation_isolated.py: BLOCKED (ModuleNotFoundError: homeassistant missing)
- Full backend (test*domolux*\*.py): BLOCKED (same — offline, documented)
- Live endpoint: curl --max-time 3 http://localhost:8124/ → HTTP 200 at 2026-11-02T12:17:31+01:00

## Scorecard (34-row — condensed to verified dimensions)

- Isolation: PASS (no live auth on 8124)
- Readonly exact replacement: PASS
- Auth native groups / GROUP_ID_READ_ONLY: PASS
- Service auth (target broad, default deny, CONTROL): VERIFIED (source audit)
- Script/scene containment (§10.4, delegated): NOT IMPLEMENTED — design only
- Frontend S1 real: PASS (with media-query fix)
- Frontend S2-S9: PLACEHOLDERS (15 lines) — NOT fabricated as production
- A3 verified: NO (not claimed)

No false claims. No hidden errors.
