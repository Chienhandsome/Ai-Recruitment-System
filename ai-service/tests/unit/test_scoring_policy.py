# pyrefly: ignore [missing-import]
import pytest

# pyrefly: ignore [missing-import]
from app.services.matching.generic_matcher import GenericMatchingEngine

# pyrefly: ignore [missing-import]
from app.services.matching.score_engine import ScoreEngine

# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest

# pyrefly: ignore [missing-import]
from tests.fixtures.payload_factory import make_evaluation_payload


def make_metrics(mandatory_ratio: float, evidence_confidence: float) -> dict:
    return {
        "skills": {"score": 0.8, "mandatory_ratio": mandatory_ratio},
        "experience": {"score": 0.8},
        "education": {"score": 0.8},
        "other": {"score": 0.8},
        "domain_compatibility": 0.15,
        "audit": {"evidence_confidence": evidence_confidence},
    }


def make_request() -> EvaluationRequest:
    return EvaluationRequest.model_validate(make_evaluation_payload())


@pytest.mark.unit
def test_mandatory_gap_caps_score_and_breakdown():
    result = ScoreEngine().calculate(
        make_metrics(mandatory_ratio=0.5, evidence_confidence=0.5),
        make_request(),
    )

    assert result["base_score"] == 80.0
    assert result["mandatory_score_cap"] == 59.0
    assert result["overall_score"] == 59.0
    assert sum(
        pillar["earned_points"] for pillar in result["score_breakdown"].values()
    ) == pytest.approx(result["overall_score"])


@pytest.mark.unit
def test_domain_and_evidence_confidence_are_not_global_multipliers():
    result = ScoreEngine().calculate(
        make_metrics(mandatory_ratio=1.0, evidence_confidence=0.5),
        make_request(),
    )

    assert result["mandatory_score_cap"] is None
    assert result["overall_score"] == 80.0


@pytest.mark.unit
def test_flutter_and_mobile_taxonomy():
    matcher = GenericMatchingEngine()

    assert matcher._detect_subdomain("Flutter Intern sử dụng Dart") == "IT_MOBILE_APP"
    assert matcher._detect_subdomain("React Native Mobile Developer") == "IT_MOBILE_APP"
    assert (
        matcher._calc_domain_compatibility("IT_MOBILE_APP", "IT_FRONTEND_WEB") == 0.95
    )
