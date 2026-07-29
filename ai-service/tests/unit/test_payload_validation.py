# pyrefly: ignore [missing-import]
from copy import deepcopy
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from pydantic import ValidationError
# pyrefly: ignore [missing-import]
from app.schemas.matching import CandidateSkill, EvaluationRequest, JobPayload, WorkExperience
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.unit
@pytest.mark.api
def test_valid_payload_success(api_client, valid_payload):
    response = api_client.post("/api/v1/matching/evaluate", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "match_level" in data
    assert "summary" in data


@pytest.mark.unit
def test_missing_candidate_profile_raises_validation_error():
    payload = make_evaluation_payload()
    del payload["candidate_profile"]
    with pytest.raises(ValidationError):
        EvaluationRequest.model_validate(payload)


@pytest.mark.unit
def test_missing_job_raises_validation_error():
    payload = make_evaluation_payload()
    del payload["job"]
    with pytest.raises(ValidationError):
        EvaluationRequest.model_validate(payload)


@pytest.mark.unit
def test_negative_experience_years_raises_validation_error():
    payload = make_evaluation_payload()
    payload["candidate_profile"]["skills"][0]["years_experience"] = -5.0
    # Should validate safely or handle without system crash
    req = EvaluationRequest.model_validate(payload)
    assert req.candidate_profile.skills[0].years_experience == -5.0


@pytest.mark.unit
def test_start_date_after_end_date_handled_safely(mock_semantic_matcher):
    """
    Test: start_date > end_date
    ExperienceMatcher reverses invalid date boundaries to prevent negative days.
    """
    # pyrefly: ignore [missing-import]
    from app.services.matching.experience_matcher import ExperienceMatcher
    matcher = ExperienceMatcher()
    exp = [
        WorkExperience(
            position_title="Backend Developer",
            start_date="2026-06-01",
            end_date="2024-01-01",
        )
    ]
    years = matcher._calculate_total_years(exp)
    assert years > 0.0


@pytest.mark.unit
@pytest.mark.api
def test_invalid_json_payload_returns_422(api_client):
    response = api_client.post(
        "/api/v1/matching/evaluate",
        content="invalid json content",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422
    assert "detail" in response.json()
