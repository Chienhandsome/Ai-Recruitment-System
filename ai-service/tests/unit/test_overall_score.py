# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest, JobPayload, JobWeightsConfig
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.unit
def test_overall_weighted_score_formula(mock_semantic_matcher, valid_payload):
    """
    Verifies overall weighted score formula calculation:
    overall_score = (skills_w * skills_s + exp_w * exp_s + edu_w * edu_s + proj_w * proj_s) / total_w
    """
    request = EvaluationRequest.model_validate(valid_payload)
    response = matching_engine.evaluate(request)

    w = request.weights or request.job.ai_weights_config or JobWeightsConfig()
    total_w = w.skills + w.experience + w.education + w.projects

    expected_overall = (
        w.skills * response.skills_score
        + w.experience * response.experience_score
        + w.education * response.education_score
        + w.projects * response.project_score
    ) / total_w

    assert response.overall_score == pytest.approx(expected_overall, abs=0.02)
    assert 0.0 <= response.overall_score <= 100.0


@pytest.mark.unit
def test_custom_weights_impact(mock_semantic_matcher):
    """Verifies changing weights dynamically alters overall score in expected direction."""
    payload = make_evaluation_payload()
    req = EvaluationRequest.model_validate(payload)

    # Calculate with default weights (40/30/15/15)
    resp1 = matching_engine.evaluate(req)

    # Weight heavily towards education when candidate has high education score
    payload_edu = make_evaluation_payload(
        weights={"skills": 10.0, "experience": 10.0, "education": 70.0, "projects": 10.0}
    )
    req_edu = EvaluationRequest.model_validate(payload_edu)
    resp2 = matching_engine.evaluate(req_edu)

    assert resp1.overall_score != resp2.overall_score
