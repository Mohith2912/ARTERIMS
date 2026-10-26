from artemis.api.fixture_gateways import FixtureAgentGateway, FixtureBatchGateway, FixtureCaseGateway
from artemis.api.contracts import ProductServices


def test_fixture_services_fulfil_product_integration_contract() -> None:
    services = ProductServices(FixtureCaseGateway(), FixtureBatchGateway(), FixtureAgentGateway())
    hero = services.cases.get_case("CASE-0007")
    assert hero.utr == "UTR839201"
    assert services.batch.run().total == 40
    assert services.agent.metrics().verified_precision == 1.0
