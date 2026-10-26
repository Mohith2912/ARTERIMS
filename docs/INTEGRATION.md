# Artemis lane integration contract

## Audit result

The repository currently contains only the Member 3 product lane. No Member 1 (`ingest`, `matching`, `rules`, `grading`) or Member 2 (`agent`, `tools`, `eval`) source is present on `main`, so production data cannot yet be substituted for fixtures. This is an integration dependency, not a UI defect.

## Ready integration points

| Product capability | Owning lane | Required capability | Product use |
| --- | --- | --- | --- |
| Case list/detail and variance | Member 1 | shared models plus loaded case, allocation, adjustment and evidence rows | dashboard and case view |
| Review transition and application | Member 1 | `grading.policy.transition` and one transaction for allocations + state | `POST /cases/{id}/review` |
| Investigation trace and graph inputs | Member 2 | agent runs, hypotheses, tool calls and evidence provenance | trace timeline and graph |
| Batch progress and metrics | Member 2 | batch status plus `eval/report.json` | batch polling and metrics panel |
| Audit append | Member 3 | event references emitted from all lanes | ledger verifier and audit view |

## Swap plan

1. Implement `CaseGateway` with Member 1's shared models/repository.
2. Implement `AgentGateway` and `BatchGateway` over Member 2's runner and report.
3. Inject those gateways in `artemis.api.main`; remove fixture mode only after the 40-case benchmark passes.
4. Keep API response schemas unchanged. This prevents frontend and integration drift.

## Non-negotiable safeguards

- The API never calculates paise, eligibility, or tax.
- The product lane delegates every state transition to Member 1's policy engine.
- Member 2 outputs are displayed as evidence and traces; they never apply allocations directly.
- Audit events contain references and hashes, never raw email bodies or prompts.
