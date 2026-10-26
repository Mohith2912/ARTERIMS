"""Product-side review policy adapter; the deterministic policy engine remains authoritative."""
from artemis.models import CaseDetail, CaseState, EvidenceStatus, ReviewDecision


def review(case: CaseDetail, reviewer_id: str, is_controller: bool, decision: ReviewDecision, comment: str) -> tuple[CaseDetail, str]:
    if decision != ReviewDecision.APPROVE and not comment.strip():
        raise ValueError("A comment is required when requesting evidence or rejecting a case.")
    if decision == ReviewDecision.APPROVE:
        if case.evidence_status != EvidenceStatus.VERIFIED:
            raise ValueError(f"{case.evidence_status or 'Ungraded'}: waiting for sufficient verified evidence.")
        if case.receipt_paise > 100000000 and not is_controller:
            raise ValueError("Controller approval is required above ₹10,00,000.")
        return case.model_copy(update={"state": CaseState.APPLIED}), "Case approved and allocations applied."
    if decision == ReviewDecision.REQUEST_EVIDENCE:
        return case.model_copy(update={"state": CaseState.AWAITING_EVIDENCE}), "Evidence request recorded."
    return case.model_copy(update={"state": CaseState.REJECTED}), "Case rejected and retained for investigation."
