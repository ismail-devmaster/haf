"""Permission evaluator adapter for Domolux Roles.

Thin I/O adapter around the pure resolver in ``resolver.py``. Public names
(``DomoluxPermissionEvaluator``, ``EvaluationResult``, ``ViewEvaluationResult``)
are preserved for backwards compatibility.
"""

import inspect
import logging
from typing import Any, Optional

from .const import (
    ACCESS_LEVEL_CONTROL,
    ACCESS_LEVEL_NONE,
    ACCESS_LEVEL_READ,
)
from .dependency_discovery import extract_entities_from_card
from .models import UserPermissionSet
from .resolver import (
    EvaluationResult,
    ViewEvaluationResult,
    resolve_entity_access,
    resolve_view_access,
)
from .store import DomoluxRoleStore

_LOGGER = logging.getLogger(__name__)

# Re-export for compatibility
__all__ = ["DomoluxPermissionEvaluator", "EvaluationResult", "ViewEvaluationResult"]


class DomoluxPermissionEvaluator:
    """Evaluates Domolux entity and view permissions (I/O adapter)."""

    def __init__(self, hass: Any, store: DomoluxRoleStore) -> None:
        self.hass = hass
        self.store = store

    def _is_father(self, user_id: str) -> bool:
        father = self.store.get_father()
        return father is not None and father.user_id == user_id

    async def _is_admin_or_owner(self, user_id: str) -> bool:
        if not hasattr(self.hass, "auth") or self.hass.auth is None:
            return False
        try:
            res = self.hass.auth.async_get_user(user_id)
            if inspect.isawaitable(res):
                user = await res
            else:
                user = res
        except Exception:
            return False
        if user is None:
            return False
        is_admin = getattr(user, "is_admin", False)
        is_owner = getattr(user, "is_owner", False)
        return bool((is_admin is True) or (is_owner is True))

    def _get_entity_device_and_area(self, entity_id: str):
        device_id = None
        area_id = None
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

    def _get_view_entity_map(self) -> dict[str, set[str]]:
        """Return view_path -> set of referenced entity IDs mapping."""
        mapping: dict[str, set[str]] = {}
        try:
            domain_data = getattr(self.hass, "data", {}).get("domolux_roles", {})
            # 1. From DomoluxViewStore if loaded
            view_store = None
            if isinstance(domain_data, dict):
                if "view_store" in domain_data:
                    view_store = domain_data["view_store"]
                else:
                    for val in domain_data.values():
                        if isinstance(val, dict) and "view_store" in val:
                            view_store = val["view_store"]
                            break
            if view_store is not None:
                for v in view_store.list_views():
                    entities = set()
                    for card in getattr(v, "cards", []):
                        card_dict = card.to_dict() if hasattr(card, "to_dict") else (card if isinstance(card, dict) else {})
                        entities.update(extract_entities_from_card(card_dict))
                        for b in getattr(card, "entities", []):
                            if hasattr(b, "entity_id") and b.entity_id:
                                entities.add(b.entity_id.strip().lower())
                    if entities:
                        mapping[v.view_path.strip().lower()] = entities

            # 2. From cached dashboard view entities
            if isinstance(domain_data, dict):
                cached = domain_data.get("dashboard_view_entities")
                if isinstance(cached, dict):
                    for path, ents in cached.items():
                        norm_p = str(path).strip().lower()
                        if norm_p not in mapping:
                            mapping[norm_p] = set(ents)
                        else:
                            mapping[norm_p].update(ents)
        except Exception as err:
            _LOGGER.debug("Error loading view entities for evaluator: %s", err)
        return mapping

    async def evaluate_entity_access(self, user_id, entity_id, required_level=ACCESS_LEVEL_READ):
        is_father = self._is_father(user_id)
        is_admin = await self._is_admin_or_owner(user_id)
        grants = self.store.get_user_permissions(user_id)
        device_id, area_id = self._get_entity_device_and_area(entity_id)
        registry_snapshot = {entity_id: (device_id, area_id)}
        view_entity_map = self._get_view_entity_map()
        return resolve_entity_access(
            grants,
            registry_snapshot,
            user_id,
            entity_id,
            required_level,
            is_father=is_father,
            is_admin=is_admin,
            view_entity_map=view_entity_map,
        )

    async def evaluate_view_access(self, user_id, view_path):
        is_father = self._is_father(user_id)
        is_admin = await self._is_admin_or_owner(user_id)
        grants = self.store.get_user_permissions(user_id)
        return resolve_view_access(
            grants,
            user_id,
            view_path,
            is_father=is_father,
            is_admin=is_admin,
        )
