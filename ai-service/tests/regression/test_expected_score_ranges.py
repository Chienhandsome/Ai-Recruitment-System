# pyrefly: ignore [missing-import]
import json
from pathlib import Path
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine

DATA_DIR = Path(r"d:\DATN\Du_lieu_gia_AI_Service_Tuyen_dung")
EVAL_REQUESTS_FILE = DATA_DIR / "evaluation_requests.json"
EXPECTED_SCORES_FILE = DATA_DIR / "expected_score_ranges.json"


def load_regression_cases():
    reqs = json.loads(EVAL_REQUESTS_FILE.read_text(encoding="utf-8"))
    exp = json.loads(EXPECTED_SCORES_FILE.read_text(encoding="utf-8"))
    exp_map = {item["application_id"]: item for item in exp}
    return [(req, exp_map[req["application_id"]]) for req in reqs]


REGRESSION_CASES = load_regression_cases()


@pytest.mark.regression
@pytest.mark.parametrize("payload, expected_info", REGRESSION_CASES)
def test_regression_evaluation_match_ranges(payload, expected_info):
    request = EvaluationRequest.model_validate(payload)
    response = matching_engine.evaluate(request)

    exp_level = expected_info["expected_match_level"]
    exp_min = float(expected_info["expected_score_min"])
    exp_max = float(expected_info["expected_score_max"])

    assert response.match_level == exp_level, (
        f"App {payload['application_id']}: Expected level {exp_level}, got {response.match_level} "
        f"(Overall Score: {response.overall_score})"
    )
    assert exp_min <= response.overall_score <= exp_max, (
        f"App {payload['application_id']}: Expected score range [{exp_min}-{exp_max}], got {response.overall_score}"
    )
