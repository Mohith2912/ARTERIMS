# Artemis

Artemis is a demonstrable accounts-receivable reconciliation workspace. This repository starts with the Member 3 product lane: API contracts, audit integrity, review workflow, dashboard, and local demo tooling.

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

For containers, copy `.env.example` to `.env` and run `docker compose -f deploy/docker-compose.yml up --build`.

## Product guarantees

- Review decisions are attributable to a named reviewer.
- Every state-changing action is recorded in a hash-chained ledger.
- The reviewer API never bypasses the policy engine.
- Amounts are represented in integer paise at the API boundary.

## Member 3 integration points

The product lane consumes the shared models and policy engine supplied by the other lanes. Until those dependencies land, the included fixture repository makes the dashboard and API runnable in isolation.
