from artemis.audit.ledger import AuditLedger


def test_hash_chain_verifies_and_detects_tampering() -> None:
    ledger = AuditLedger()
    ledger.append("CASE-0001", "CASE_CREATED", "system", {"utr": "UTR839201"})
    ledger.append("CASE-0001", "GRADED", "system", {"status": "VERIFIED"})
    assert ledger.verify().ok

    ledger._events[1].payload["status"] = "CONFLICTING"  # simulated privileged tamper
    result = ledger.verify()
    assert not result.ok
    assert result.first_broken_seq == 2
