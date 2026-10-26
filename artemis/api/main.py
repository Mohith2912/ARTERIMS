from __future__ import annotations

from fastapi import FastAPI, Header, HTTPException, Query

from artemis.api.contracts import ProductServices
from artemis.api.fixture_gateways import FixtureCaseGateway
from artemis.api.live_gateways import AuditSinkAdapter, LiveAgentGateway, LiveBatchGateway
from artemis.api.policy import review
from artemis.audit.ledger import AuditLedger
from artemis.fakes.core import FixtureCore
from artemis.fakes.policy import FakePolicy
from artemis.fakes.store import InMemoryRunStore
from artemis.models import AuditVerification, BatchProgress, CaseDetail, CaseSummary, Metrics, ReviewRequest, ReviewResponse
from artemis.wiring import Deps, Settings

app = FastAPI(title="Artemis API", version="0.2.0")
ledger = AuditLedger()

def _create_services(current_ledger: AuditLedger) -> tuple[ProductServices, Deps]:
    audit_sink = AuditSinkAdapter(current_ledger)
    store = InMemoryRunStore()
    core = FixtureCore("fixtures")
    policy = FakePolicy(audit_sink)
    deps = Deps(core=core, policy=policy, audit=audit_sink, store=store, settings=Settings.from_env())
    case_gw = FixtureCaseGateway()
    batch_gw = LiveBatchGateway(deps, current_ledger)
    agent_gw = LiveAgentGateway(deps)
    return ProductServices(case_gw, batch_gw, agent_gw), deps

services, app_deps = _create_services(ledger)
REVIEWERS = {"analyst": False, "controller": True}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "lane_b_status": "active", "audit_ledger": "anchored"}


@app.post("/batch/run", response_model=BatchProgress)
def run_batch() -> BatchProgress:
    batch = services.batch.run()
    ledger.append(None, "BATCH_STARTED", "system", {"batch_id": batch.id, "replay": batch.replay})
    return batch


@app.get("/batch/{batch_id}", response_model=BatchProgress)
def get_batch(batch_id: str) -> BatchProgress:
    try:
        return services.batch.get(batch_id)
    except KeyError:
        raise HTTPException(404, "Batch not found")


@app.get("/cases", response_model=list[CaseSummary])
def list_cases(status: str | None = None, state: str | None = None) -> list[CaseSummary]:
    return services.cases.list_cases(status, state)


@app.get("/cases/{case_id}", response_model=CaseDetail)
def get_case(case_id: str) -> CaseDetail:
    try:
        return services.cases.get_case(case_id)
    except KeyError:
        raise HTTPException(404, "Case not found")


@app.get("/cases/{case_id}/trace")
def trace(case_id: str) -> dict:
    get_case(case_id)
    return services.agent.trace(case_id)


@app.get("/cases/{case_id}/narrative")
def narrative(case_id: str) -> dict:
    get_case(case_id)
    if hasattr(services.agent, "narrative"):
        return services.agent.narrative(case_id)
    return {"case_id": case_id, "narrative": "Standard policy clearance", "source": "template"}


@app.get("/cases/{case_id}/graph")
def graph(case_id: str) -> dict:
    case = get_case(case_id)
    nodes = [
        {"id": "receipt", "kind": "receipt", "label": case.utr},
        {"id": "INV-1042", "kind": "invoice", "label": "INV-1042"},
        {"id": "INV-1043", "kind": "invoice", "label": "INV-1043"}
    ]
    nodes += [{"id": item.id, "kind": "evidence", "tier": item.tier, "label": item.kind} for item in case.evidence]
    return {
        "nodes": nodes,
        "edges": [
            {"source": "receipt", "target": "INV-1042", "label": "₹11,80,000"},
            {"source": "receipt", "target": "INV-1043", "label": "₹3,54,000"},
            {"source": "EVD-0003", "target": "receipt", "label": "supports"}
        ]
    }


@app.post("/cases/{case_id}/review", response_model=ReviewResponse)
def review_case(case_id: str, body: ReviewRequest, x_reviewer_id: str = Header(...)) -> ReviewResponse:
    if x_reviewer_id not in REVIEWERS:
        raise HTTPException(403, "Unknown reviewer")
    try:
        updated, message = review(services.cases.get_case(case_id), x_reviewer_id, REVIEWERS[x_reviewer_id], body.decision, body.comment)
    except KeyError:
        raise HTTPException(404, "Case not found")
    except ValueError as error:
        raise HTTPException(409, str(error))
    services.cases.save_case(updated)
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
    return services.agent.metrics()


@app.post("/reset")
def reset() -> dict[str, str]:
    global ledger, services, app_deps
    ledger = AuditLedger()
    ledger.append(None, "BATCH_STARTED", "system", {"action": "reset", "mode": "fixture"})
    services, app_deps = _create_services(ledger)
    return {"status": "reset"}
