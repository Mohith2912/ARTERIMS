"""An in-memory reference implementation of Artemis's append-only audit chain."""
from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
import json
from threading import Lock
from typing import Any

from artemis.models import AuditEvent, AuditVerification

GENESIS_HASH = "0" * 64


def _canonical(value: dict[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


class AuditLedger:
    """Serialises audit writes so the hash chain cannot fork in-process."""

    def __init__(self) -> None:
        self._events: list[AuditEvent] = []
        self._lock = Lock()

    def append(self, case_id: str | None, event_type: str, actor: str, payload: dict[str, Any]) -> AuditEvent:
        with self._lock:
            seq = len(self._events) + 1
            created_at = datetime.now(UTC)
            prev_hash = self._events[-1].hash if self._events else GENESIS_HASH
            body = {
                "seq": seq,
                "case_id": case_id,
                "event_type": event_type,
                "actor": actor,
                "payload": payload,
                "created_at": created_at.isoformat(),
            }
            digest = sha256((prev_hash + _canonical(body)).encode("utf-8")).hexdigest()
            event = AuditEvent(prev_hash=prev_hash, hash=digest, **body)
            self._events.append(event)
            return event

    def events(self, case_id: str | None = None) -> list[AuditEvent]:
        return [event for event in self._events if case_id is None or event.case_id == case_id]

    def verify(self) -> AuditVerification:
        previous = GENESIS_HASH
        for event in self._events:
            body = {
                "seq": event.seq,
                "case_id": event.case_id,
                "event_type": event.event_type,
                "actor": event.actor,
                "payload": event.payload,
                "created_at": event.created_at.isoformat(),
            }
            expected = sha256((previous + _canonical(body)).encode("utf-8")).hexdigest()
            if event.prev_hash != previous or event.hash != expected:
                return AuditVerification(ok=False, first_broken_seq=event.seq)
            previous = event.hash
        return AuditVerification(ok=True)
