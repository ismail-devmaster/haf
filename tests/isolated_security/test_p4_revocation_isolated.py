"""P4 isolated — stubbed homeassistant (self-contained, no external wheel needed)."""
import sys, types, pathlib
# Build lightweight stubs before any import
for mod in ('homeassistant', 'homeassistant.core', 'homeassistant.auth', 'homeassistant.auth.const', 'homeassistant.helpers'):
    if mod not in sys.modules:
        sys.modules[mod] = types.ModuleType(mod)
# Stub GROUP_ID_READ_ONLY (referenced by adapter)
import homeassistant.auth.const
sys.modules['homeassistant.auth.const'].GROUP_ID_READ_ONLY = "system-read-only"
# Now import real modules
from custom_components.domolux_roles.store import DomoluxRoleStore
from custom_components.domolux_roles.ha_auth_adapter import DomoluxHAAuthAdapter

def test_p4_store_flush_exists():
    s = DomoluxRoleStore.__new__(DomoluxRoleStore)
    s.flush_security_reduction("p1", "r2", "c3")

def test_p4_adapter_revocation_exists():
    # Read source for revocation method (line 368+)
    p = pathlib.Path('custom_components/domolux_roles/ha_auth_adapter.py')
    t = p.read_text()
    assert 'async_revoke_user_sessions' in t
    assert 'async_remove_refresh_token' in t
