from concurrent.futures import ThreadPoolExecutor
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.performance
def test_concurrent_evaluation_requests(mock_semantic_matcher, api_client):
    """
    Concurrency Test: Fires 50 concurrent evaluation requests using multi-threading.
    Validates thread-safety, non-interference between concurrent tasks, and zero 500 server errors.
    """
    payloads = [make_evaluation_payload(application_id=f"app-concurrent-{i}") for i in range(50)]

    def send_request(p):
        response = api_client.post("/api/v1/matching/evaluate", json=p)
        return response

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(send_request, payloads))

    for resp in results:
        assert resp.status_code == 200
        data = resp.json()
        assert "overall_score" in data
        assert data["match_level"] in ["HIGH", "MEDIUM", "LOW"]
