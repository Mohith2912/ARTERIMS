"""Product-lane schemas shared by the fixture API and web client."""
from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class EvidenceStatus(StrEnum):
    VERIFIED = "VERIFIED"
    PROBABLE = "PROBABLE"
    INSUFFICIENT = "INSUFFICIENT"
    CONFLICTING = "CONFLICTING"


class CaseState(StrEnum):
    NEW = "NEW"
    AUTO_CLOSED = "AUTO_CLOSED"
    INVESTIGATING = "INVESTIGATING"
    GRADED = "GRADED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    AWAITING_EVIDENCE = "AWAITING_EVIDENCE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    REJECTED = "REJECTED"
    APPLIED = "APPLIED"


class ReviewDecision(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_EVIDENCE = "request_evidence"


class CaseSummary(BaseModel):
    id: str
    utr: str
    customer_name: str
    receipt_paise: int
    variance_paise: int
    evidence_status: EvidenceStatus | None = None
    state: CaseState
    steps_taken: int = 0


class Adjustment(BaseModel):
    kind: str
    amount_paise: int
    validated: bool
    evidence_ids: list[str] = Field(default_factory=list)


class EvidenceItem(BaseModel):
    id: str
    kind: str
    tier: str
    source: str
    excerpt: str
    tool_call_id: str | None = None


class CaseDetail(CaseSummary):
    invoices_paise: int
    adjustments: list[Adjustment] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    narrative: str = ""
    alias_score: int | None = None
    contradiction: dict[str, Any] | None = None


class ReviewRequest(BaseModel):
    decision: ReviewDecision
    comment: str = Field(default="", max_length=1000)


class ReviewResponse(BaseModel):
    case: CaseSummary
    audit_seq: int
    message: str


class AuditEvent(BaseModel):
    seq: int
    case_id: str | None
    event_type: str
    actor: str
    payload: dict[str, Any]
    prev_hash: str
    hash: str
    created_at: datetime


class AuditVerification(BaseModel):
    ok: bool
    first_broken_seq: int | None = None


class BatchProgress(BaseModel):
    id: str
    status: str
    processed: int
    total: int
    counts: dict[str, int]
    replay: bool = False


class Metrics(BaseModel):
    verified_precision: float
    evidence_coverage: float
    abstention_accuracy: float
    tool_path_diversity: int
    mean_steps: float
