"""Pure permission resolver for Domolux Roles.

This module contains ONLY decision logic. It has no dependency on Home
Assistant, performs no I/O, holds no global mutable state and contains no
``async`` code. All inputs are immutable snapshots; the output is a decision.

The :class:`DomoluxPermissionEvaluator` in ``permission_evaluator.py`` is a
thin adapter that gathers I/O (HA auth, registries, store) and delegates
the actual decision to the functions here.
"""

from dataclasses import dataclass
from typing import Any, Mapping, Optional, Tuple

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
    EntityPermissionRule,
    UserPermissionSet,
)

ACCESS_LEVEL_ORDER = {
    ACCESS_LEVEL_NONE: 0,
    ACCESS_LEVEL_READ: 1,
    ACCESS_LEVEL_CONTROL: 2,
}


@dataclass(frozen=True)
class EvaluationResult:
    user_id: str
    target_id: str
    access_level: str
    granted: bool
    matching_rule_type: str
    matching_rule_id: Optional[str] = None


@dataclass(frozen=True)
class ViewEvaluationResult:
    user_id: str
    view_path: str
    effect: str
    allowed: bool
    matching_rule_type: str


def _entity_device_area(
    registry_snapshot: Mapping[str, Tuple[Optional[str], Optional[str]]],
    entity_id: str,
) -> Tuple[Optional[str], Optional[str]]:
    return registry_snapshot.get(entity_id, (None, None))


def resolve_entity_access(
    grants: UserPermissionSet,
    registry_snapshot: Mapping[str, Tuple[Optional[str], Optional[str]]],
    user_id: str,
    entity_id: str,
    required_level: str = ACCESS_LEVEL_READ,
    *,
    is_father: bool = False,
    is_admin: bool = False,
    view_entity_map: Optional[Mapping[str, Any]] = None,
) -> EvaluationResult:
    """Pure entity-access decision."""
    if is_father:
        return EvaluationResult(
            user_id=user_id,
            target_id=entity_id,
            access_level=ACCESS_LEVEL_CONTROL,
            granted=True,
            matching_rule_type="father_override",
        )
    if is_admin:
        return EvaluationResult(
            user_id=user_id,
            target_id=entity_id,
            access_level=ACCESS_LEVEL_CONTROL,
            granted=True,
            matching_rule_type="admin_override",
        )

    device_id, area_id = _entity_device_area(registry_snapshot, entity_id)

    # 1. Entity explicit rule (highest precedence - explicit DENY halts immediately)
    for rule in grants.entity_rules.values():
        if rule.target_type == TARGET_ENTITY and rule.target_id == entity_id:
            granted = ACCESS_LEVEL_ORDER.get(rule.access_level, 0) >= ACCESS_LEVEL_ORDER.get(
                required_level, 1
            )
            return EvaluationResult(
                user_id=user_id,
                target_id=entity_id,
                access_level=rule.access_level,
                granted=granted,
                matching_rule_type=TARGET_ENTITY,
                matching_rule_id=rule.rule_id,
            )

    # 2. Device explicit rule (explicit device DENY/READ/CONTROL)
    if device_id:
        for rule in grants.entity_rules.values():
            if rule.target_type == TARGET_DEVICE and rule.target_id == device_id:
                granted = ACCESS_LEVEL_ORDER.get(rule.access_level, 0) >= ACCESS_LEVEL_ORDER.get(
                    required_level, 1
                )
                return EvaluationResult(
                    user_id=user_id,
                    target_id=entity_id,
                    access_level=rule.access_level,
                    granted=granted,
                    matching_rule_type=TARGET_DEVICE,
                    matching_rule_id=rule.rule_id,
                )

    # 3. Area explicit rule
    if area_id:
        for rule in grants.entity_rules.values():
            if rule.target_type == TARGET_AREA and rule.target_id == area_id:
                granted = ACCESS_LEVEL_ORDER.get(rule.access_level, 0) >= ACCESS_LEVEL_ORDER.get(
                    required_level, 1
                )
                return EvaluationResult(
                    user_id=user_id,
                    target_id=entity_id,
                    access_level=rule.access_level,
                    granted=granted,
                    matching_rule_type=TARGET_AREA,
                    matching_rule_id=rule.rule_id,
                )

    # 4. View inherited rule (inherited from permitted dashboard views)
    if view_entity_map:
        matching_view_paths = []
        for v_path, v_ents in view_entity_map.items():
            if isinstance(v_ents, (set, list, tuple)) and entity_id in v_ents:
                matching_view_paths.append(v_path)
            elif v_path == entity_id and isinstance(v_ents, (set, list, tuple)):
                matching_view_paths.extend(v_ents)

        highest_inherited = None
        matching_v_rule_id = None
        for v_path in matching_view_paths:
            v_rule = grants.view_rules.get(v_path)
            if v_rule and (
                v_rule.effect == EFFECT_ALLOW
                or getattr(v_rule, "access_level", "") in (ACCESS_LEVEL_READ, ACCESS_LEVEL_CONTROL)
            ):
                v_level = getattr(v_rule, "access_level", None) or (
                    ACCESS_LEVEL_CONTROL if v_rule.effect == EFFECT_ALLOW else ACCESS_LEVEL_NONE
                )
                if highest_inherited is None or ACCESS_LEVEL_ORDER.get(
                    v_level, 0
                ) > ACCESS_LEVEL_ORDER.get(highest_inherited, 0):
                    highest_inherited = v_level
                    matching_v_rule_id = v_path

        if highest_inherited is not None and highest_inherited != ACCESS_LEVEL_NONE:
            granted = ACCESS_LEVEL_ORDER.get(highest_inherited, 0) >= ACCESS_LEVEL_ORDER.get(
                required_level, 1
            )
            return EvaluationResult(
                user_id=user_id,
                target_id=entity_id,
                access_level=highest_inherited,
                granted=granted,
                matching_rule_type="view_inherited",
                matching_rule_id=matching_v_rule_id,
            )

    default_level = grants.default_access_level
    granted = ACCESS_LEVEL_ORDER.get(default_level, 0) >= ACCESS_LEVEL_ORDER.get(required_level, 1)
    return EvaluationResult(
        user_id=user_id,
        target_id=entity_id,
        access_level=default_level,
        granted=granted,
        matching_rule_type="default",
    )


def resolve_view_access(
    grants: UserPermissionSet,
    user_id: str,
    view_path: str,
    *,
    is_father: bool = False,
    is_admin: bool = False,
) -> ViewEvaluationResult:
    if is_father:
        return ViewEvaluationResult(
            user_id=user_id,
            view_path=view_path,
            effect=EFFECT_ALLOW,
            allowed=True,
            matching_rule_type="father_override",
        )
    if is_admin:
        return ViewEvaluationResult(
            user_id=user_id,
            view_path=view_path,
            effect=EFFECT_ALLOW,
            allowed=True,
            matching_rule_type="admin_override",
        )

    if view_path in grants.view_rules:
        rule = grants.view_rules[view_path]
        allowed = rule.effect == EFFECT_ALLOW
        return ViewEvaluationResult(
            user_id=user_id,
            view_path=view_path,
            effect=rule.effect,
            allowed=allowed,
            matching_rule_type="view_rule",
        )

    default_effect = (
        EFFECT_ALLOW if grants.default_access_level != ACCESS_LEVEL_NONE else EFFECT_DENY
    )
    return ViewEvaluationResult(
        user_id=user_id,
        view_path=view_path,
        effect=default_effect,
        allowed=(default_effect == EFFECT_ALLOW),
        matching_rule_type="default",
    )


def resolve(
    grants: Any,
    registry_snapshot: Any,
    subject: Any,
    action: Any,
    data: Any,
    *,
    is_father: bool = False,
    is_admin: bool = False,
    view_entity_map: Optional[Mapping[str, Any]] = None,
) -> Any:
    """Generic entry point used by callers and tests.

    ``action`` is either an access level (entity access) or ``"view"``.
    """
    user_id = subject if isinstance(subject, str) else getattr(subject, "user_id", str(subject))
    if action == "view":
        return resolve_view_access(grants, user_id, str(data), is_father=is_father, is_admin=is_admin)
    return resolve_entity_access(
        grants,
        registry_snapshot if registry_snapshot is not None else {},
        user_id,
        str(data),
        required_level=str(action) if action else ACCESS_LEVEL_READ,
        is_father=is_father,
        is_admin=is_admin,
        view_entity_map=view_entity_map,
    )
