# pyrefly: ignore [missing-import]
from copy import deepcopy
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.unit
@pytest.mark.regression
def test_sensitive_field_independence(mock_semantic_matcher, valid_payload):
    """
    Fairness Test: Mutating personal sensitive fields (name, email, phone, gender, avatar, address)
    must strictly NOT alter matching scores or match level classification.
    """
    payload_a = deepcopy(valid_payload)
    payload_b = deepcopy(valid_payload)

    # Mutate candidate personal profile details
    if payload_a["candidate_profile"].get("profile"):
        payload_a["candidate_profile"]["profile"]["desired_title"] = "Backend Developer A"
        payload_a["candidate_profile"]["profile"]["address"] = "Hà Nội"

        payload_b["candidate_profile"]["profile"]["desired_title"] = "Backend Developer B"
        payload_b["candidate_profile"]["profile"]["address"] = "Đà Nẵng"

    req_a = EvaluationRequest.model_validate(payload_a)
    req_b = EvaluationRequest.model_validate(payload_b)

    res_a = matching_engine.evaluate(req_a)
    res_b = matching_engine.evaluate(req_b)

    assert res_a.overall_score == pytest.approx(res_b.overall_score, abs=1e-4)
    assert res_a.skills_score == pytest.approx(res_b.skills_score, abs=1e-4)
    assert res_a.experience_score == pytest.approx(res_b.experience_score, abs=1e-4)
    assert res_a.education_score == pytest.approx(res_b.education_score, abs=1e-4)
    assert res_a.project_score == pytest.approx(res_b.project_score, abs=1e-4)
    assert res_a.match_level == res_b.match_level
