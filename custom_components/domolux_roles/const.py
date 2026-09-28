"""Constants for the Domolux Roles integration."""
from typing import Final

DOMAIN: Final = "domolux_roles"
STORAGE_KEY: Final = "domolux_auth"
STORAGE_VERSION: Final = 1

# Domolux Application Roles
ROLE_FATHER: Final = "father"
ROLE_USER: Final = "user"

# Father Role Lifecycle States
STATUS_UNASSIGNED: Final = "UNASSIGNED"
STATUS_ACTIVE: Final = "ACTIVE"
STATUS_SUSPENDED_ADMIN: Final = "SUSPENDED_ADMIN"
STATUS_SUSPENDED_DISABLED: Final = "SUSPENDED_DISABLED"
STATUS_ORPHANED_DELETED: Final = "ORPHANED_DELETED"
STATUS_CORRUPTED: Final = "CORRUPTED"

# Event Names
EVENT_DOMOLUX_ROLE_CHANGED: Final = "domolux_role_changed"
