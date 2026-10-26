# Artemis

Artemis is an evidence-first accounts-receivable reconciliation workspace for a synthetic Indian AR environment. It turns bank receipts, invoices, remittance evidence, tax credits, and credit notes into reviewable reconciliation cases. An AI proposal never applies money directly: deterministic rules validate the numbers, a named reviewer approves the outcome, and a tamper-evident ledger records every step.

> **Delivery status:** this repository contains the completed Member 3 product, audit, and demo lane. It is executable with representative fixtures while Member 1's deterministic core and Member 2's agent code are merged. Stable gateways are already in place so those lanes can be connected without changing API or UI contracts.

## Quick start

```powershell
py -3 -m pip install -r requirements.txt
make demo
```

Open `http://127.0.0.1:8000/docs` for the API. The React dashboard lives in `web/` and uses the same API contracts.

## Demo controls

- `POST /batch/run` starts the fixture-backed demo batch.
- Review `CASE-0007` with `X-Reviewer-Id: controller` to apply the verified hero case.
- `GET /audit/verify` validates the complete event chain.
- `py -3 scripts/tamper.py` demonstrates that a changed historical payload is detected.

For containers, run `docker compose -f deploy/docker-compose.yml up --build`. The fixture demo reads safe defaults from `.env.example`; create `.env` only to override a value locally.

## Hosted dashboard

The GitHub Pages workflow publishes the fixture-backed dashboard at
`https://mohith2912.github.io/ARTERIMS/` after GitHub Pages is enabled in the repository's **Settings → Pages → Source: GitHub Actions**. This public demo intentionally contains no API credentials or customer data.

## Product guarantees

- Review decisions are attributable to a named reviewer.
- Every state-changing action is recorded in a hash-chained ledger.
- The reviewer API never bypasses the policy engine.
- Amounts are represented in integer paise at the API boundary.

## Member 3 integration points

The product lane consumes the shared models and policy engine supplied by the other lanes. Until those dependencies land, the included fixture repository makes the dashboard and API runnable in isolation.

## What Artemis solves

AR teams regularly receive incomplete or conflicting payment information: one transfer may cover multiple invoices, TDS may explain a shortfall, a credit note may exist only in an email, and duplicate receipts must not be cleared incorrectly. Artemis converts each exception into an evidence-backed case and routes it through a controlled review workflow.

The target demonstration contains 40 synthetic cases covering exact matches, customer aliases, TDS confirmation and conflict, split payments, multi-invoice payments, ERP and email-only credit notes, bank charges, rounding, duplicates, and deliberately conflicting evidence.

## Architecture and workflow

| Lane | Owner | Responsibility | Main folders |
| --- | --- | --- | --- |
| A — Data and deterministic core | Member 1 | Ingestion, entity matching, TDS rules, variance, grading, and policy transitions | `data/`, `artemis/ingest/`, `artemis/matching/`, `artemis/rules/`, `artemis/grading/` |
| B — Agent and investigation | Member 2 | Evidence tools, investigation loop, hypotheses, replay, and evaluation | `artemis/agent/`, `artemis/tools/`, `eval/` |
| C — Product, audit and demo | Member 3 | API, audit, dashboard, reviewer flow, evidence graph, and delivery | `artemis/api/`, `artemis/audit/`, `web/`, `deploy/` |

The intended technical flow is:

1. Member 1 loads the source environment and auto-closes only exact, policy-compliant matches.
2. Member 2 investigates each remaining exception through evidence tools and records hypotheses/tool calls.
3. Member 1 validates allocations, adjustments, variance, contradictions, and evidence grade.
4. Member 3 exposes the case, evidence, trace, graph data, audit history, and metrics in the dashboard.
5. A named analyst or controller approves, rejects, or requests evidence.
6. Member 1 applies approved allocations atomically while Member 3 records and verifies the audit chain.

## Member 3 delivery detail

### Product API

| Endpoint group | Purpose |
| --- | --- |
| `/health` | Service health status. |
| `/batch/run`, `/batch/{id}` | Starts and monitors the reconciliation batch. |
| `/cases`, `/cases/{id}` | Lists cases and retrieves complete case detail. |
| `/cases/{id}/trace` | Returns the investigation timeline. |
| `/cases/{id}/graph` | Returns evidence graph nodes and edges. |
| `/cases/{id}/review` | Records named-reviewer approval, rejection, or evidence request. |
| `/audit`, `/audit/verify` | Reads and verifies the tamper-evident ledger. |
| `/metrics`, `/reset` | Exposes evaluation measures and repeatable demo reset. |

### Review safety controls

- Only `VERIFIED` cases can be approved.
- The demonstration analyst is limited to ₹10,00,000; controller approval has no configured cap.
- Rejections and evidence requests require an explanatory comment.
- Every decision writes an audit event; successful approval additionally writes an application event.
- When Member 1 merges, its policy engine remains the final authority for legal state transitions and allocation application.

### Audit integrity

Every audit event carries a predecessor hash and a SHA-256 hash of canonical event content. Canonical content includes the sequence, case ID, event type, actor, payload, and timestamp. The chain starts from 64 zeroes. `GET /audit/verify` recomputes the chain and returns either success or the first broken event. `scripts/tamper.py` alters an earlier amount to demonstrate that verification detects the tampering.

### Dashboard

The React/Vite dashboard contains batch progress, replay indication, five outcome tiles, exposure and quality metrics, a case queue, status/state filtering, and an audit-health control. It uses a finance-oriented responsive design with accessible labels, visible keyboard focus, text as well as colour for status, and reduced-motion support.

## Current fixture demo

The hero fixture is `CASE-0007` / `UTR839201`. Its invoices total ₹15,34,000, the receipt is ₹15,08,000, and primary tax-credit evidence validates a ₹26,000 TDS adjustment. A controller can approve it through the API. Other fixtures represent probable, conflicting, insufficient, and auto-closed outcomes so the product lane remains demonstrable before upstream code is merged.

## Integration status

| Capability | Current state | Owner |
| --- | --- | --- |
| Product API, dashboard, reviewer controls, audit ledger | Complete and fixture-backed | Member 3 |
| Deterministic environment, matcher, variance, grading, policy | Awaiting source merge | Member 1 |
| Agent runner, evidence tools, traces, replay, metrics | Awaiting source merge | Member 2 |
| Integration boundary | Complete: `CaseGateway`, `BatchGateway`, `AgentGateway` | Member 3 |

The product lane does not import upstream internals directly. `CaseGateway` will be replaced by a Member 1 database/model adapter; `BatchGateway` and `AgentGateway` will be replaced by Member 2 adapters. This protects the dashboard and API contracts during integration. See [docs/INTEGRATION.md](docs/INTEGRATION.md) for the handoff sequence and safety rules.

## Technology flow

| Layer | Technology | Role |
| --- | --- | --- |
| Backend | Python, FastAPI, Pydantic | Typed product API and contract validation. |
| Audit | SHA-256, canonical JSON, thread-safe ledger | Append-only hash chain and tamper detection. |
| Frontend | React 18, TypeScript, Vite, Lucide | Responsive reconciliation workspace. |
| Delivery | Docker Compose, GitHub Actions, GitHub Pages | Local runtime and static dashboard publishing. |
| Integrated target | SQLAlchemy 2, PostgreSQL 16, React Flow, TanStack Query | Database, graph, and query functionality after Member 1/2 merge. |

## Verification and next milestones

Verified so far:

- API, audit-ledger, review-policy, and gateway tests pass.
- The React TypeScript production build passes.
- The tamper script detects modifications to historical audit data.

Next steps:

1. Merge Member 1's models, database, matcher, variance engine, grader, and policy engine.
2. Replace `FixtureCaseGateway` with the Member 1 adapter.
3. Merge Member 2's agent, tools, runner, replay, and evaluation report.
4. Replace fixture batch/agent gateways with Member 2 adapters.
5. Run the real 40-case benchmark, verify zero false clears, and show measured metrics.
6. Deploy the combined backend and dashboard to a backend-capable host; GitHub Pages remains a static fixture-dashboard demonstration.
