"""Fixture-backed product data used before the deterministic and agent lanes integrate."""
from __future__ import annotations

from artemis.models import Adjustment, CaseDetail, CaseState, EvidenceItem, EvidenceStatus


def hero_case() -> CaseDetail:
    return CaseDetail(
        id="CASE-0007", utr="UTR839201", customer_name="ABC Infra Private Limited",
        receipt_paise=150800000, variance_paise=2600000, invoices_paise=153400000,
        evidence_status=EvidenceStatus.VERIFIED, state=CaseState.PENDING_APPROVAL, steps_taken=6,
        alias_score=100,
        adjustments=[Adjustment(kind="tds", amount_paise=2600000, validated=True, evidence_ids=["EVD-0003"])],
        evidence=[
            EvidenceItem(id="EVD-0001", kind="bank_receipt", tier="primary", source="bank_statement.csv", excerpt="UTR839201 credited for ₹15,08,000."),
            EvidenceItem(id="EVD-0002", kind="remittance_email", tier="supporting", source="EML-0031", excerpt="Payment covers INV-1042 and INV-1043; TDS deducted."),
            EvidenceItem(id="EVD-0003", kind="tax_credit", tier="primary", source="tax_credit_extract.csv", excerpt="Q2 credit of ₹26,000 from ABC Infra TAN."),
        ],
        narrative="Receipt UTR839201 closes INV-1042 and INV-1043 after validated TDS of ₹26,000. Primary bank and tax-credit evidence support the result.",
    )


def sample_cases() -> dict[str, CaseDetail]:
    hero = hero_case()
    probable = hero.model_copy(update={"id": "CASE-0008", "utr": "UTR839202", "evidence_status": EvidenceStatus.PROBABLE, "state": CaseState.AWAITING_EVIDENCE, "steps_taken": 7})
    conflict = hero.model_copy(update={"id": "CASE-0009", "utr": "UTR839203", "evidence_status": EvidenceStatus.CONFLICTING, "state": CaseState.NEEDS_REVIEW, "steps_taken": 5, "contradiction": {"left": "Computed TDS ₹26,000", "right": "Tax credit ₹20,000"}})
    insufficient = hero.model_copy(update={"id": "CASE-0010", "utr": "UTR839204", "evidence_status": EvidenceStatus.INSUFFICIENT, "state": CaseState.NEEDS_REVIEW, "steps_taken": 4, "variance_paise": 125000})
    auto = hero.model_copy(update={"id": "CASE-0001", "utr": "UTR839101", "evidence_status": None, "state": CaseState.AUTO_CLOSED, "steps_taken": 0, "variance_paise": 0})
    return {case.id: case for case in (hero, probable, conflict, insufficient, auto)}
