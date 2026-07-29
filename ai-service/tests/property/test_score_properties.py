# pyrefly: ignore [missing-import]
from hypothesis import given, strategies as st
# pyrefly: ignore [missing-import]
import pytest

# pyrefly: ignore [missing-import]
from app.schemas.matching import CandidateSkill, EvaluationRequest, JobRequiredSkill, WorkExperience
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.property
@given(
    years=st.floats(min_value=0.0, max_value=40.0),
    level=st.sampled_from(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
)
def test_hypothesis_skill_score_invariants(years: float, level: str):
    skill = CandidateSkill(
        skill_name="NestJS",
        proficiency_level=level,
        years_experience=years,
    )
    req_skill = JobRequiredSkill(
        skill_name="NestJS",
        is_mandatory=True,
        minimum_level="INTERMEDIATE",
        minimum_years=1.0,
    )
    # pyrefly: ignore [missing-import]
    from app.services.matching.skills_matcher import SkillsMatcher
    matcher = SkillsMatcher()
    score, _, _, _ = matcher.evaluate([skill], [req_skill])
    assert 0.0 <= score <= 100.0


# pyrefly: ignore [missing-import]
from hypothesis import HealthCheck, settings, given, strategies as st

# pyrefly: ignore [missing-import]
@pytest.mark.property
@settings(suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    skill_name=st.text(min_size=1, max_size=50),
    unicode_desc=st.text(min_size=0, max_size=200),
)
def test_hypothesis_arbitrary_unicode_text_no_crash(mock_semantic_matcher, skill_name: str, unicode_desc: str):
    payload = make_evaluation_payload()
    payload["candidate_profile"]["profile"]["professional_summary"] = unicode_desc
    payload["candidate_profile"]["skills"][0]["skill_name"] = skill_name

    try:
        request = EvaluationRequest.model_validate(payload)
        response = matching_engine.evaluate(request)
        assert 0.0 <= response.overall_score <= 100.0
    except Exception as exc:
        # Schema validation errors for empty strings are expected, unhandled crashes are not
        assert "validation" in str(exc).lower()
