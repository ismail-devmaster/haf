"""Bounded, redacted audit trail for Domolux security events (T4.2/T6.3).

The audit log is intentionally *not* persisted in Domolux storage: security
events must never smuggle credentials into ``.storage/domolux_auth``. Entries
live in memory (bounded) and are also fired on the Home Assistant event bus as
``domolux_audit`` so an external recorder can persist them if desired.
"""

from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
import itertools
import logging
from typing import Any, Optional

_LOGGER = logging.getLogger(__name__)

AUDIT_EVENT = "domolux_audit"
AUDIT_MAX_ENTRIES = 500

# Keys that must never appear in an audit entry, at any nesting depth.
_REDACTED_KEYS = frozenset(
    {
        "password",
        "passwd",
        "token",
        "access_token",
        "refresh_token",
        "auth_token",
        "secret",
        "hash",
        "credential",
        "credentials",
    }
)
_REDACTED = "***redacted***"


def _redact(value: Any) -> Any:
    """Recursively redact credential-like keys."""
    if isinstance(value, dict):
        return {
            key: (_REDACTED if str(key).lower() in _REDACTED_KEYS else _redact(val))
            for key, val in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_redact(item) for item in value]
    return value


class DomoluxAuditLog:
    """A bounded, redacted, in-memory audit trail."""

    def __init__(self, hass: Any = None, max_entries: int = AUDIT_MAX_ENTRIES) -> None:
        self.hass = hass
        self._entries: deque[dict[str, Any]] = deque(maxlen=max_entries)
        self._ids = itertools.count(1)

    def record(
        self,
        action: str,
        *,
        actor_id: Optional[str] = None,
        target_user_id: Optional[str] = None,
        outcome: str = "allowed",
        details: Optional[dict[str, Any]] = None,
        reason: Optional[str] = None,
    ) -> dict[str, Any]:
        """Record a security-relevant event and return the stored entry.

        ``action`` is a stable machine-readable string such as
        ``permission.revoke`` or ``command.denied``. ``outcome`` is one of
        ``allowed``/``denied``/``failed``. Details are redacted before storage.
        """
        entry = {
            "id": next(self._ids),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "actor_id": actor_id,
            "target_user_id": target_user_id,
            "outcome": outcome,
            "reason": reason,
            "details": _redact(details) if details else {},
        }
        self._entries.append(entry)
        self._fire(entry)
        return entry

    def _fire(self, entry: dict[str, Any]) -> None:
        """Fire the audit event on the Home Assistant bus (best effort)."""
        bus = getattr(self.hass, "bus", None)
        if bus is None or not hasattr(bus, "async_fire"):
            return
        try:
            bus.async_fire(AUDIT_EVENT, dict(entry))
        except Exception as err:  # pragma: no cover - defensive
            _LOGGER.warning("Could not fire Domolux audit event: %s", err)

    def entries(self) -> list[dict[str, Any]]:
        """Return a copy of all entries, oldest first."""
        return list(self._entries)

    def entries_for_user(self, user_id: str) -> list[dict[str, Any]]:
        """Return entries that target or were performed by ``user_id``."""
        return [
            entry
            for entry in self._entries
            if entry.get("target_user_id") == user_id
            or entry.get("actor_id") == user_id
        ]

    def denied(self) -> list[dict[str, Any]]:
        """Return every denied entry (used by escalation tests)."""
        return [entry for entry in self._entries if entry["outcome"] == "denied"]

    def clear(self) -> None:
        """Drop all entries."""
        self._entries.clear()

    def __len__(self) -> int:
        return len(self._entries)


def get_audit_log(hass: Any) -> DomoluxAuditLog:
    """Return the process-wide audit log for this hass instance.

    The log is created lazily so unit tests and early setup failures still get
    auditing, and it is keyed on ``hass.data`` so unloading the integration does
    not detach it mid-operation.
    """
    from .const import DOMAIN

    domain_data = getattr(hass, "data", None)
    if domain_data is None:
        return DomoluxAuditLog(hass)

    try:
        container = domain_data.setdefault(DOMAIN, {})
    except Exception:  # pragma: no cover - non-mapping mock
        return DomoluxAuditLog(hass)

    if not isinstance(container, dict):
        return DomoluxAuditLog(hass)

    audit_log = container.get("audit_log")
    if not isinstance(audit_log, DomoluxAuditLog):
        audit_log = DomoluxAuditLog(hass)
        container["audit_log"] = audit_log
    return audit_log
