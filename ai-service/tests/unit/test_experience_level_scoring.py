import pytest

from app.schemas.matching import EvaluationRequest
from app.services.matching.matching_engine import matching_engine


def payload(*, include_level: bool) -> dict:
    job = {
        "id": "job-1",
        "title": "Backend Developer",
        "required_experience_years": 2,
        "description": "Develop backend services",
        "requirements": "Backend engineering experience",
        "required_skills": [],
        "required_certificates": [],
        "ai_weights_config": {
            "skills": 40,
            "experience": 30,
            "education": 15,
            "other": 15,
        },
    }
    if include_level:
        job.update(
            {
                "experience_level": "MIDDLE",
                "level_requirement_mode": "ADVISORY",
                "evaluation_date": "2026-08-16T00:00:00Z",
            }
        )

    return {
        "application_id": "application-1",
        "schema_version": 2 if include_level else 1,
        "candidate_profile": {
            "profile": {"desired_title": "Backend Developer"},
            "work_experiences": [
                {
                    "position_title": "Junior Backend Developer",
                    "start_date": "2023-01-01",
                    "end_date": "2025-07-01",
                    "is_current": False,
                    "description": "Developed backend services",
                }
            ],
            "educations": [],
            "projects": [],
            "certificates": [],
            "skills": [],
        },
        "job": job,
        "weights": {
            "skills": 40,
            "experience": 30,
            "education": 15,
            "other": 15,
        },
    }


@pytest.mark.unit
def test_snapshot_v2_returns_level_assessment(mock_semantic_matcher):
    request = EvaluationRequest.model_validate(payload(include_level=True))

    result = matching_engine.evaluate(request)

    assert result.experience_assessment is not None
    assert result.experience_assessment.candidate_level == "JUNIOR"
    assert result.experience_assessment.required_level == "MIDDLE"
    assert result.experience_assessment.level_gap == 1
    assert result.experience_assessment.level_fit_score == 70
    assert result.experience_assessment.level_eligible is False
    assert 0 <= result.experience_score <= 100


@pytest.mark.unit
def test_snapshot_v1_preserves_legacy_experience_scoring(mock_semantic_matcher):
    request = EvaluationRequest.model_validate(payload(include_level=False))

    result = matching_engine.evaluate(request)

    assert result.experience_assessment is None
