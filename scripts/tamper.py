"""Demonstrate that a privileged mutation is detectable by the audit verifier."""
from artemis.api.main import ledger

if not ledger.events():
    ledger.append("CASE-DEMO", "CASE_CREATED", "system", {"amount_paise": 150800000})

event = ledger.events()[0]
event.payload["amount_paise"] = 1
result = ledger.verify()
print({"ok": result.ok, "first_broken_seq": result.first_broken_seq})
