# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
import time

# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.performance
def test_batch_evaluation_latency_benchmarks(mock_semantic_matcher):
    """
    Performance Test: Evaluates 100 mock requests and computes latency metrics
    (Average, Median, P95 percentile).
    """
    payloads = [make_evaluation_payload() for _ in range(100)]
    latencies = []

    for p in payloads:
        req = EvaluationRequest.model_validate(p)
        t0 = time.perf_counter()
        res = matching_engine.evaluate(req)
        t_elapsed = (time.perf_counter() - t0) * 1000.0
        latencies.append(t_elapsed)
        assert res.overall_score >= 0.0

    avg_lat = float(np.mean(latencies))
    med_lat = float(np.median(latencies))
    p95_lat = float(np.percentile(latencies, 95))

    print(f"\n--- PERFORMANCE LATENCY BENCHMARK ---")
    print(f"Total Requests: {len(latencies)}")
    print(f"Average Latency: {avg_lat:.2f} ms")
    print(f"Median Latency:  {med_lat:.2f} ms")
    print(f"P95 Latency:     {p95_lat:.2f} ms")

    assert avg_lat < 200.0, f"Average latency ({avg_lat:.2f} ms) exceeded 200ms threshold"
