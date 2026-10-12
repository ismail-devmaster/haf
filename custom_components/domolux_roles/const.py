"""Constants for the Domolux Roles integration."""
from typing import Final

DOMAIN: Final = "domolux_roles"
STORAGE_KEY: Final = "domolux_auth"
STORAGE_VERSION: Final = 2

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

# Phase 3 Permission Constants
ACCESS_LEVEL_NONE: Final = "none"
ACCESS_LEVEL_READ: Final = "read"
ACCESS_LEVEL_CONTROL: Final = "control"

EFFECT_ALLOW: Final = "allow"
EFFECT_DENY: Final = "deny"

TARGET_ENTITY: Final = "entity"
TARGET_DEVICE: Final = "device"
TARGET_AREA: Final = "area"

# Event Names
EVENT_DOMOLUX_ROLE_CHANGED: Final = "domolux_role_changed"

# Phase 3.2 View Storage
VIEWS_STORAGE_KEY: Final = "domolux_views_data"
VIEWS_STORAGE_VERSION: Final = 1
