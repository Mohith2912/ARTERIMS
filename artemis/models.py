"""Shared contracts across Lane A, B, and C. Money = integer paise."""
from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


# --- Shared Enums ---
class CaseState(StrEnum):
    NEW = "NEW"
    AUTO_CLOSED = "AUTO_CLOSED"
    INVESTIGATING = "INVESTIGATING"
    GRADED = "GRADED"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    AWAITING_EVIDENCE = "AWAITING_EVIDENCE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    APPLIED = "APPLIED"
    REJECTED = "REJECTED"
    MERGED = "MERGED"


class EvidenceStatus(StrEnum):
    VERIFIED = "VERIFIED"
    PROBABLE = "PROBABLE"
    INSUFFICIENT = "INSUFFICIENT"
    CONFLICTING = "CONFLICTING"


class Tier(StrEnum):
    PRIMARY = "primary"
    SUPPORTING = "supporting"
    DERIVED = "derived"


class AdjustmentKind(StrEnum):
    TDS = "tds"
    CREDIT_NOTE = "credit_note"
    BANK_CHARGE = "bank_charge"
    ROUNDING = "rounding"


class HypothesisKind(StrEnum):
    TDS = "tds"
    SPLIT_PAYMENT = "split_payment"
    MULTI_INVOICE = "multi_invoice"
    CREDIT_NOTE = "credit_note"
    BANK_CHARGE = "bank_charge"
    ROUNDING = "rounding"
    TIMING = "timing"
    WRONG_CUSTOMER = "wrong_customer"
    DUPLICATE = "duplicate"
    UNEXPLAINED = "unexplained"


class HypothesisStatus(StrEnum):
    OPEN = "open"
    SUPPORTED = "supported"
    REJECTED = "rejected"


class StopReason(StrEnum):
    FINISHED = "finished"
    MAX_STEPS = "max_steps"
    TIMEOUT = "timeout"
    TOKEN_CAP = "token_cap"
    LOOP = "loop"
    ERROR = "error"


class ReviewDecision(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    REQUEST_EVIDENCE = "request_evidence"


# --- allocation / adjustment inputs & results (propose_allocation) ---
class AllocationLine(BaseModel):
    invoice_id: str
    amount_paise: int


class AdjustmentProposal(BaseModel):
    kind: AdjustmentKind
    amount_paise: int
    evidence_ids: list[str] = Field(default_factory=list)
    credit_note_id: str | None = None


class AdjustmentResult(AdjustmentProposal):
    validated: bool
    validated_by_rule: str = ""


class AllocationResult(BaseModel):
    case_id: str
    utrs: list[str]
    allocations: list[AllocationLine]
    adjustments: list[AdjustmentResult]
    invoiced_paise: int
    received_paise: int
    variance_paise: int
    unexplained_paise: int


# --- provenance ---
class EvidenceRef(BaseModel):
    """What Lane A's code reports it found; the tool wrapper turns these into Evidence rows."""
    kind: str
    tier: Tier
    source_table: str
    source_id: str
    excerpt: str = ""


class Evidence(EvidenceRef):
    id: str
    case_id: str
    retrieved_by_tool_call_id: str | None = None


class CoreResult(BaseModel):
    data: dict[str, Any]
    refs: list[EvidenceRef] = Field(default_factory=list)


class ContradictionFlag(BaseModel):
    code: int  # 1-7, spec A7
    detail: str
    evidence_a: str
    evidence_b: str


class Grade(BaseModel):
    status: EvidenceStatus
    unexplained_paise: int | None
    flags: list[ContradictionFlag] = Field(default_factory=list)
    duplicate: bool = False
    recommendation: str | None = None


# --- agent bookkeeping (B writes) ---
class Hypothesis(BaseModel):
    id: str
    run_id: str
    step: int
    text: str
    kind: HypothesisKind
    status: HypothesisStatus
    reason: str = ""


class ToolCall(BaseModel):
    id: str
    run_id: str
    step: int
    tool_name: str
    args_json: dict[str, Any]
    result_json: dict[str, Any]
    latency_ms: int = 0


class AgentRun(BaseModel):
    id: str
    case_id: str
    model: str
    model_version: str = ""
    prompt_version: str
    started_at: str
    ended_at: str | None = None
    steps: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    stop_reason: StopReason | None = None
    replay_of: str | None = None


class CoreError(Exception):
    """Raised by CoreService for expected failures; tool wrappers turn it into error-as-data."""

    def __init__(self, code: str, detail: str):
        super().__init__(f"{code}: {detail}")
        self.code, self.detail = code, detail


class CaseOutcome(BaseModel):
    """What B hands to the API/UI per investigated case (stored via RunStore)."""
    case_id: str
    run_id: str
    grade: Grade | None  # None only when the run errored
    allocation: AllocationResult | None = None
    narrative: str = ""
    narrative_source: str = "template"  # "llm" | "template"
    final_state: CaseState | None = None
    stop_reason: StopReason | None = None
    tool_path: list[str] = Field(default_factory=list)


# --- Product / API Schemas (Lane C) ---
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
