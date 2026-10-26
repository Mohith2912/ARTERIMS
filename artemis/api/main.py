from __future__ import annotations

from collections import Counter
from fastapi import FastAPI, Header, HTTPException, Query

from artemis.api.fixtures import sample_cases
from artemis.api.policy import review
from artemis.audit.ledger import AuditLedger
from artemis.models import AuditVerification, BatchProgress, CaseDetail, CaseSummary, Metrics, ReviewRequest, ReviewResponse

app = FastAPI(title="Artemis API", version="0.1.0")
ledger = AuditLedger()
cases = sample_cases()
batch = BatchProgress(id="BATCH-DEMO", status="complete", processed=40, total=40, counts={"AUTO_CLOSED": 10, "VERIFIED": 16, "PROBABLE": 6, "INSUFFICIENT": 4, "CONFLICTING": 4}, replay=True)
REVIEWERS = {"analyst": False, "controller": True}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/batch/run", response_model=BatchProgress)
def run_batch() -> BatchProgress:
    ledger.append(None, "BATCH_STARTED", "system", {"batch_id": batch.id, "replay": batch.replay})
    return batch


@app.get("/batch/{batch_id}", response_model=BatchProgress)
def get_batch(batch_id: str) -> BatchProgress:
    if batch_id != batch.id:
        raise HTTPException(404, "Batch not found")
    return batch


@app.get("/cases", response_model=list[CaseSummary])
def list_cases(status: str | None = None, state: str | None = None) -> list[CaseSummary]:
    results = list(cases.values())
    if status:
        results = [case for case in results if case.evidence_status == status]
    if state:
        results = [case for case in results if case.state == state]
    return results


@app.get("/cases/{case_id}", response_model=CaseDetail)
def get_case(case_id: str) -> CaseDetail:
    if case_id not in cases:
        raise HTTPException(404, "Case not found")
    return cases[case_id]


@app.get("/cases/{case_id}/trace")
def trace(case_id: str) -> dict:
    get_case(case_id)
    return {"case_id": case_id, "steps": [{"step": 1, "hypothesis": "TDS deducted", "tool": "search_remittance_email"}, {"step": 2, "hypothesis": "TDS confirmed", "tool": "compute_withholding"}, {"step": 3, "hypothesis": "TDS confirmed", "tool": "get_authorized_tax_credit_extract"}, {"step": 4, "hypothesis": "Allocation closed", "tool": "propose_allocation"}]}


@app.get("/cases/{case_id}/graph")
def graph(case_id: str) -> dict:
    case = get_case(case_id)
    nodes = [{"id": "receipt", "kind": "receipt", "label": case.utr}, {"id": "INV-1042", "kind": "invoice", "label": "INV-1042"}, {"id": "INV-1043", "kind": "invoice", "label": "INV-1043"}]
    nodes += [{"id": item.id, "kind": "evidence", "tier": item.tier, "label": item.kind} for item in case.evidence]
    return {"nodes": nodes, "edges": [{"source": "receipt", "target": "INV-1042", "label": "₹11,80,000"}, {"source": "receipt", "target": "INV-1043", "label": "₹3,54,000"}, {"source": "EVD-0003", "target": "receipt", "label": "supports"}]}


@app.post("/cases/{case_id}/review", response_model=ReviewResponse)
def review_case(case_id: str, body: ReviewRequest, x_reviewer_id: str = Header(...)) -> ReviewResponse:
    if x_reviewer_id not in REVIEWERS:
        raise HTTPException(403, "Unknown reviewer")
    try:
        updated, message = review(cases[case_id], x_reviewer_id, REVIEWERS[x_reviewer_id], body.decision, body.comment)
    except KeyError:
        raise HTTPException(404, "Case not found")
    except ValueError as error:
        raise HTTPException(409, str(error))
    cases[case_id] = updated
    event = ledger.append(case_id, "REVIEW_DECIDED", f"reviewer:{x_reviewer_id}", {"decision": body.decision, "comment": body.comment})
    if updated.state.value == "APPLIED":
        ledger.append(case_id, "APPLIED", f"reviewer:{x_reviewer_id}", {"case_id": case_id})
    return ReviewResponse(case=updated, audit_seq=event.seq, message=message)


@app.get("/audit")
def audit(case_id: str | None = Query(default=None)) -> list:
    return ledger.events(case_id)


@app.get("/audit/verify", response_model=AuditVerification)
def verify_audit() -> AuditVerification:
    return ledger.verify()


@app.get("/metrics", response_model=Metrics)
def metrics() -> Metrics:
    return Metrics(verified_precision=1.0, evidence_coverage=1.0, abstention_accuracy=1.0, tool_path_diversity=8, mean_steps=5.4)


@app.post("/reset")
def reset() -> dict[str, str]:
    global cases
    cases = sample_cases()
    ledger.append(None, "BATCH_COMPLETED", "system", {"action": "reset"})
    return {"status": "reset"}
