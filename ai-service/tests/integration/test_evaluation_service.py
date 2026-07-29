# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest, EvaluationResponse
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine
# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


@pytest.mark.integration
def test_evaluation_service_end_to_end(valid_payload):
    request = EvaluationRequest.model_validate(valid_payload)
    response = matching_engine.evaluate(request)

    assert isinstance(response, EvaluationResponse)
    assert 0.0 <= response.overall_score <= 100.0
    assert response.match_level in ["HIGH", "MEDIUM", "LOW"]
    assert isinstance(response.strengths, list)
    assert isinstance(response.gaps, list)
    assert isinstance(response.missing_required_skills, list)
    assert isinstance(response.summary, str)
    assert len(response.summary) > 0
