import json
import time
from pathlib import Path
# pyrefly: ignore [missing-import]
import pytest

# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine

MOCK_DATA_DIR = Path(r"d:\DATN\Du_lieu_gia_AI_Service_Tuyen_dung")
EVAL_REQUESTS_FILE = MOCK_DATA_DIR / "evaluation_requests.json"
EXPECTED_SCORES_FILE = MOCK_DATA_DIR / "expected_score_ranges.json"


def load_test_data():
    reqs_data = json.loads(EVAL_REQUESTS_FILE.read_text(encoding="utf-8"))
    exp_data = json.loads(EXPECTED_SCORES_FILE.read_text(encoding="utf-8"))

    exp_map = {item["application_id"]: item for item in exp_data}
    test_cases = []
    for req in reqs_data:
        app_id = req["application_id"]
        exp_item = exp_map.get(app_id)
        test_cases.append((req, exp_item))
    return test_cases


TEST_CASES = load_test_data()


@pytest.mark.parametrize("payload, expected_info", TEST_CASES)
def test_candidate_matching_evaluation(payload, expected_info):
    assert expected_info is not None, f"No expected result for app {payload['application_id']}"

    # Parse Pydantic request
    request = EvaluationRequest.model_validate(payload)

    start_time = time.perf_counter()
    response = matching_engine.evaluate(request)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    exp_level = expected_info["expected_match_level"]
    exp_min = float(expected_info["expected_score_min"])
    exp_max = float(expected_info["expected_score_max"])

    actual_level = response.match_level
    actual_score = response.overall_score

    # Verification criteria:
    # 1. Match Level matches expected match level
    # 2. Score falls within expected score range [exp_min, exp_max]
    is_level_pass = actual_level == exp_level
    is_score_pass = exp_min <= actual_score <= exp_max
    is_pass = is_level_pass and is_score_pass

    print(
        f"\nApp ID: {payload['application_id'][:8]} | "
        f"Exp Level: {exp_level:<6} | Actual Level: {actual_level:<6} | "
        f"Exp Range: [{exp_min:5.1f}-{exp_max:5.2f}] | Actual Score: {actual_score:6.2f} | "
        f"Time: {elapsed_ms:5.1f}ms | RESULT: {'PASS' if is_pass else 'FAIL'}"
    )

    assert is_level_pass, (
        f"Match level mismatch for app {payload['application_id']}: "
        f"Expected {exp_level}, got {actual_level} (Score: {actual_score})"
    )
    assert is_score_pass, (
        f"Score out of range for app {payload['application_id']}: "
        f"Expected [{exp_min}-{exp_max}], got {actual_score}"
    )


def test_batch_summary_statistics():
    """Runs all 15 cases in batch and prints formatted benchmark statistics."""
    reqs_data = json.loads(EVAL_REQUESTS_FILE.read_text(encoding="utf-8"))
    exp_data = json.loads(EXPECTED_SCORES_FILE.read_text(encoding="utf-8"))
    exp_map = {item["application_id"]: item for item in exp_data}

    total_requests = len(reqs_data)
    pass_count = 0
    fail_count = 0
    total_time_ms = 0.0

    print("\n" + "=" * 110)
    print(f"{'APPLICATION ID':<38} | {'EXP LEVEL':<9} | {'ACT LEVEL':<9} | {'EXPECTED RANGE':<15} | {'ACT SCORE':<9} | {'STATUS':<6}")
    print("=" * 110)

    for req in reqs_data:
        app_id = req["application_id"]
        exp_item = exp_map[app_id]
        request = EvaluationRequest.model_validate(req)

        t0 = time.perf_counter()
        resp = matching_engine.evaluate(request)
        t_elapsed = (time.perf_counter() - t0) * 1000.0
        total_time_ms += t_elapsed

        exp_level = exp_item["expected_match_level"]
        exp_min = exp_item["expected_score_min"]
        exp_max = exp_item["expected_score_max"]

        is_pass = (resp.match_level == exp_level) and (exp_min <= resp.overall_score <= exp_max)

        if is_pass:
            pass_count += 1
            status_str = "PASS"
        else:
            fail_count += 1
            status_str = "FAIL"

        print(
            f"{app_id:<38} | {exp_level:<9} | {resp.match_level:<9} | "
            f"[{exp_min:5.1f} - {exp_max:5.2f}] | {resp.overall_score:<9.2f} | {status_str:<6}"
        )

    avg_time_ms = total_time_ms / total_requests if total_requests > 0 else 0.0

    print("=" * 110)
    print(" BÁO CÁO THỐNG KÊ BENCHMARK BÁO CÁO:")
    print(f"  - Số request:           {total_requests}")
    print(f"  - Số PASS:              {pass_count}")
    print(f"  - Số FAIL:              {fail_count}")
    print(f"  - Tỷ lệ thành công:     {(pass_count / total_requests) * 100:.1f}%")
    print(f"  - Thời gian trung bình: {avg_time_ms:.2f} ms / request")
    print("=" * 110 + "\n")

    assert fail_count == 0, f"{fail_count} out of {total_requests} test cases failed standard validation."
