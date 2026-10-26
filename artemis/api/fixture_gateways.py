"""Temporary gateways used by the demo until the Member 1/2 services merge."""
from __future__ import annotations

from artemis.api.fixtures import sample_cases
from artemis.models import BatchProgress, CaseDetail, Metrics


class FixtureCaseGateway:
    def __init__(self) -> None:
        self._cases = sample_cases()

    def list_cases(self, status: str | None = None, state: str | None = None) -> list[CaseDetail]:
        cases = list(self._cases.values())
        if status:
            cases = [case for case in cases if case.evidence_status == status]
        if state:
            cases = [case for case in cases if case.state == state]
        return cases

    def get_case(self, case_id: str) -> CaseDetail:
        return self._cases[case_id]

    def save_case(self, case: CaseDetail) -> None:
        self._cases[case.id] = case

    def reset(self) -> None:
        self._cases = sample_cases()


class FixtureBatchGateway:
    def __init__(self) -> None:
        self._batch = BatchProgress(
            id="BATCH-DEMO", status="complete", processed=40, total=40,
            counts={"AUTO_CLOSED": 10, "VERIFIED": 16, "PROBABLE": 6, "INSUFFICIENT": 4, "CONFLICTING": 4}, replay=True,
        )

    def run(self) -> BatchProgress:
        return self._batch

    def get(self, batch_id: str) -> BatchProgress:
        if batch_id != self._batch.id:
            raise KeyError(batch_id)
        return self._batch


class FixtureAgentGateway:
    def trace(self, case_id: str) -> dict:
        return {"case_id": case_id, "steps": [
            {"step": 1, "hypothesis": "TDS deducted", "tool": "search_remittance_email"},
            {"step": 2, "hypothesis": "TDS confirmed", "tool": "compute_withholding"},
            {"step": 3, "hypothesis": "TDS confirmed", "tool": "get_authorized_tax_credit_extract"},
            {"step": 4, "hypothesis": "Allocation closed", "tool": "propose_allocation"},
        ]}

    def metrics(self) -> Metrics:
        return Metrics(verified_precision=1.0, evidence_coverage=1.0, abstention_accuracy=1.0, tool_path_diversity=8, mean_steps=5.4)
