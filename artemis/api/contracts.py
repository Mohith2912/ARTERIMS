"""Stable boundary between the product lane and the deterministic/agent lanes.

Member 3 calls these capabilities instead of importing Member 1 or 2 internals.  The
fixture implementation keeps the product demonstrable before the integration gates.
"""
from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

from artemis.models import BatchProgress, CaseDetail, Metrics


class CaseGateway(Protocol):
    def list_cases(self, status: str | None = None, state: str | None = None) -> list[CaseDetail]: ...
    def get_case(self, case_id: str) -> CaseDetail: ...
    def save_case(self, case: CaseDetail) -> None: ...
    def reset(self) -> None: ...


class BatchGateway(Protocol):
    def run(self) -> BatchProgress: ...
    def get(self, batch_id: str) -> BatchProgress: ...


class AgentGateway(Protocol):
    def trace(self, case_id: str) -> dict: ...
    def metrics(self) -> Metrics: ...


class ProductServices:
    """Dependency container. Replace fixture callables with Lane A/B adapters at Day 4/7."""

    def __init__(self, cases: CaseGateway, batch: BatchGateway, agent: AgentGateway) -> None:
        self.cases = cases
        self.batch = batch
        self.agent = agent
