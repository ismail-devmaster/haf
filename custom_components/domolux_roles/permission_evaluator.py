"""Permission evaluator module for Domolux Roles.

Implements Phase 3 Rule Evaluation Hierarchy:
1. Father / Admin / Owner Override -> Full Control (ACCESS_LEVEL_CONTROL) / ALLOW.
2. Entity Rule (target_type="entity", target_id=entity_id).
3. Device Rule (target_type="device", target_id=device_id).
4. Area Rule (target_type="area", target_id=area_id).
5. Default Access Level Fallback (default: ACCESS_LEVEL_NONE -> Deny).
"""

from dataclasses import dataclass
import logging
from typing import Any, Optional

from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
    EFFECT_ALLOW,
    EFFECT_DENY,
    TARGET_AREA,
    TARGET_DEVICE,
    TARGET_ENTITY,
)
from .models import (
    DomoluxAuthState,
    EntityPermissionRule,
    UserPermissionSet,
    ViewPermissionRule,
)
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)

# Numeric mapping for access level hierarchy comparison
ACCESS_LEVEL_ORDER = {
    ACCESS_LEVEL_NONE: 0,
    ACCESS_LEVEL_READ: 1,
    ACCESS_LEVEL_CONTROL: 2,
}


@dataclass
class EvaluationResult:
    """Result of an entity access evaluation."""

    user_id: str
    target_id: str
    access_level: str
    granted: bool
    matching_rule_type: str  # "father_override", "admin_override", "entity", "device", "area", "default"
    matching_rule_id: Optional[str] = None


@dataclass
class ViewEvaluationResult:
    """Result of a view access evaluation."""

    user_id: str
    view_path: str
    effect: str
    allowed: bool
    matching_rule_type: str  # "father_override", "admin_override", "view_rule", "default"


class DomoluxPermissionEvaluator:
    """Evaluates Domolux entity and view permissions based on user rules."""

    def __init__(self, hass: Any, store: DomoluxRoleStore) -> None:
        self.hass = hass
        self.store = store

    def _is_father(self, user_id: str) -> bool:
        """Check if user_id is the active Father."""
        father = self.store.get_father()
        return father is not None and father.user_id == user_id

    async def _is_admin_or_owner(self, user_id: str) -> bool:
        """Check if user_id is a Home Assistant Core Administrator or Owner."""
        if not hasattr(self.hass, "auth") or self.hass.auth is None:
            return False
        user = await self.hass.auth.async_get_user(user_id)
        if user is None:
            return False
        return bool(user.is_admin or user.is_owner)

    def _get_entity_device_and_area(
        self, entity_id: str
    ) -> tuple[Optional[str], Optional[str]]:
        """Resolve device_id and area_id for an entity using HA Registries."""
        device_id: Optional[str] = None
        area_id: Optional[str] = None

        try:
            from homeassistant.helpers import area_registry as ar
            from homeassistant.helpers import device_registry as dr
            from homeassistant.helpers import entity_registry as er

            ent_reg = er.async_get(self.hass)
            entity_entry = ent_reg.async_get(entity_id)

            if entity_entry:
                area_id = entity_entry.area_id
                device_id = entity_entry.device_id

                if device_id and not area_id:
                    dev_reg = dr.async_get(self.hass)
                    device_entry = dev_reg.async_get(device_id)
                    if device_entry:
                        area_id = device_entry.area_id
        except Exception as err:
            _LOGGER.debug("Error resolving HA registries for entity %s: %s", entity_id, err)

        return device_id, area_id

    async def evaluate_entity_access(
        self, user_id: str, entity_id: str, required_level: str = ACCESS_LEVEL_READ
    ) -> EvaluationResult:
        """Evaluate access level for user_id on entity_id.

        Evaluation Order:
        1. Father Override -> ACCESS_LEVEL_CONTROL
        2. HA Admin / Owner Override -> ACCESS_LEVEL_CONTROL
        3. Entity Explicit Rule
        4. Device Explicit Rule
        5. Area Explicit Rule
        6. User Default Access Level (Fallback)
        """
        # 1. Father Override
        if self._is_father(user_id):
            return EvaluationResult(
                user_id=user_id,
                target_id=entity_id,
                access_level=ACCESS_LEVEL_CONTROL,
                granted=True,
                matching_rule_type="father_override",
            )

        # 2. HA Admin / Owner Override
        if await self._is_admin_or_owner(user_id):
            return EvaluationResult(
                user_id=user_id,
                target_id=entity_id,
                access_level=ACCESS_LEVEL_CONTROL,
                granted=True,
                matching_rule_type="admin_override",
            )

        user_perm = self.store.get_user_permissions(user_id)

        # Resolve entity target hierarchy
        device_id, area_id = self._get_entity_device_and_area(entity_id)

        # 3. Check Entity explicit rule
        for rule in user_perm.entity_rules.values():
            if rule.target_type == TARGET_ENTITY and rule.target_id == entity_id:
                granted = ACCESS_LEVEL_ORDER.get(
                    rule.access_level, 0
                ) >= ACCESS_LEVEL_ORDER.get(required_level, 1)
                return EvaluationResult(
                    user_id=user_id,
                    target_id=entity_id,
                    access_level=rule.access_level,
                    granted=granted,
                    matching_rule_type=TARGET_ENTITY,
                    matching_rule_id=rule.rule_id,
                )

        # 4. Check Device explicit rule
        if device_id:
            for rule in user_perm.entity_rules.values():
                if rule.target_type == TARGET_DEVICE and rule.target_id == device_id:
                    granted = ACCESS_LEVEL_ORDER.get(
                        rule.access_level, 0
                    ) >= ACCESS_LEVEL_ORDER.get(required_level, 1)
                    return EvaluationResult(
                        user_id=user_id,
                        target_id=entity_id,
                        access_level=rule.access_level,
                        granted=granted,
                        matching_rule_type=TARGET_DEVICE,
                        matching_rule_id=rule.rule_id,
                    )

        # 5. Check Area explicit rule
        if area_id:
            for rule in user_perm.entity_rules.values():
                if rule.target_type == TARGET_AREA and rule.target_id == area_id:
                    granted = ACCESS_LEVEL_ORDER.get(
                        rule.access_level, 0
                    ) >= ACCESS_LEVEL_ORDER.get(required_level, 1)
                    return EvaluationResult(
                        user_id=user_id,
                        target_id=entity_id,
                        access_level=rule.access_level,
                        granted=granted,
                        matching_rule_type=TARGET_AREA,
                        matching_rule_id=rule.rule_id,
                    )

        # 6. Default Fallback
        default_level = user_perm.default_access_level
        granted = ACCESS_LEVEL_ORDER.get(
            default_level, 0
        ) >= ACCESS_LEVEL_ORDER.get(required_level, 1)
        return EvaluationResult(
            user_id=user_id,
            target_id=entity_id,
            access_level=default_level,
            granted=granted,
            matching_rule_type="default",
        )

    async def evaluate_view_access(
        self, user_id: str, view_path: str
    ) -> ViewEvaluationResult:
        """Evaluate view access (allowed / denied) for user_id on view_path."""
        # 1. Father Override
        if self._is_father(user_id):
            return ViewEvaluationResult(
                user_id=user_id,
                view_path=view_path,
                effect=EFFECT_ALLOW,
                allowed=True,
                matching_rule_type="father_override",
            )

        # 2. HA Admin / Owner Override
        if await self._is_admin_or_owner(user_id):
            return ViewEvaluationResult(
                user_id=user_id,
                view_path=view_path,
                effect=EFFECT_ALLOW,
                allowed=True,
                matching_rule_type="admin_override",
            )

        user_perm = self.store.get_user_permissions(user_id)

        # 3. Check explicit view rule
        if view_path in user_perm.view_rules:
            rule = user_perm.view_rules[view_path]
            allowed = rule.effect == EFFECT_ALLOW
            return ViewEvaluationResult(
                user_id=user_id,
                view_path=view_path,
                effect=rule.effect,
                allowed=allowed,
                matching_rule_type="view_rule",
            )

        # 4. Default Fallback: Default ALLOW unless default_access_level is none
        default_effect = (
            EFFECT_ALLOW
            if user_perm.default_access_level != ACCESS_LEVEL_NONE
            else EFFECT_DENY
        )
        return ViewEvaluationResult(
            user_id=user_id,
            view_path=view_path,
            effect=default_effect,
            allowed=(default_effect == EFFECT_ALLOW),
            matching_rule_type="default",
        )
