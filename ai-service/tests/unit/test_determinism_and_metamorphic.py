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
def test_evaluation_determinism(mock_semantic_matcher, valid_payload):
    """
    Determinism Test: Executing the same evaluation payload 10 consecutive times
    must return identical overall scores, component scores, match levels, and summaries.
    """
    request = EvaluationRequest.model_validate(valid_payload)

    first_result = matching_engine.evaluate(request)

    for i in range(9):
        current_result = matching_engine.evaluate(request)
        assert current_result.overall_score == pytest.approx(first_result.overall_score, abs=1e-5)
        assert current_result.skills_score == pytest.approx(first_result.skills_score, abs=1e-5)
        assert current_result.experience_score == pytest.approx(first_result.experience_score, abs=1e-5)
        assert current_result.education_score == pytest.approx(first_result.education_score, abs=1e-5)
        assert current_result.project_score == pytest.approx(first_result.project_score, abs=1e-5)
        assert current_result.match_level == first_result.match_level
        assert current_result.missing_required_skills == first_result.missing_required_skills


@pytest.mark.unit
def test_metamorphic_skill_list_reordering(mock_semantic_matcher, valid_payload):
    """Metamorphic Test: Reordering the candidate's skill list must NOT alter the matching score."""
    p1 = deepcopy(valid_payload)
    p2 = deepcopy(valid_payload)

    p2["candidate_profile"]["skills"] = list(reversed(p1["candidate_profile"]["skills"]))

    r1 = matching_engine.evaluate(EvaluationRequest.model_validate(p1))
    r2 = matching_engine.evaluate(EvaluationRequest.model_validate(p2))

    assert r1.overall_score == pytest.approx(r2.overall_score, abs=1e-5)
    assert r1.skills_score == pytest.approx(r2.skills_score, abs=1e-5)
