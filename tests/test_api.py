from fastapi.testclient import TestClient

from artemis.api.main import app

client = TestClient(app)


def test_case_and_graph_contracts() -> None:
    assert client.get("/cases/CASE-0007").json()["utr"] == "UTR839201"
    graph = client.get("/cases/CASE-0007/graph").json()
    assert any(node["kind"] == "evidence" for node in graph["nodes"])


def test_reviewer_policy_blocks_analyst_over_limit() -> None:
    response = client.post("/cases/CASE-0007/review", headers={"X-Reviewer-Id": "analyst"}, json={"decision": "approve"})
    assert response.status_code == 409
    assert "Controller" in response.json()["detail"]


def test_controller_can_approve_verified_case() -> None:
    client.post("/reset")
    response = client.post("/cases/CASE-0007/review", headers={"X-Reviewer-Id": "controller"}, json={"decision": "approve"})
    assert response.status_code == 200
    assert response.json()["case"]["state"] == "APPLIED"
    assert client.get("/audit/verify").json()["ok"]
