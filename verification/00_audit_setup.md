# Audit Setup

- Audited branch: domolux-roles/hardening-p1
- Audited commit (HEAD): ab5e8be15974782f2bd788d22b09fb9bb943af62
- Baseline branch: domolux-roles/baseline-p0 @ bc7decf51c9264e97668d1d4314c82a61c92b7ce
- Clean worktree: /tmp/verify_main (git status --porcelain empty: yes)
- Baseline worktree: /tmp/verify_baseline (git status --porcelain empty: yes)
- Commits baseline..HEAD: 14 (see git log)
- Python: 3.13.14 (venv /home/ismabeast/hoco/venv, python3.13)
- HA Core installed: 2026.2.3
- pytest: 9.1.1 (venv) / 9.2.0 (system)
- OS: Linux
- Full suite on audited commit: 2506 passed in 5.96s
- Isolated security on audited commit: 14/14 passed
- Isolated security on baseline: directory absent (tests added in work branch) -> cannot reproduce original claim on baseline; documented as gap.
