# Artemis

Artemis is a demonstrable accounts-receivable reconciliation workspace. This repository starts with the Member 3 product lane: API contracts, audit integrity, review workflow, dashboard, and local demo tooling.

## Quick start

```powershell
py -3 -m pip install -r requirements.txt
make demo
```

Open `http://127.0.0.1:8000/docs` for the API. The React dashboard lives in `web/` and uses the same API contracts.

## Product guarantees

- Review decisions are attributable to a named reviewer.
- Every state-changing action is recorded in a hash-chained ledger.
- The reviewer API never bypasses the policy engine.
- Amounts are represented in integer paise at the API boundary.

## Member 3 integration points

The product lane consumes the shared models and policy engine supplied by the other lanes. Until those dependencies land, the included fixture repository makes the dashboard and API runnable in isolation.
