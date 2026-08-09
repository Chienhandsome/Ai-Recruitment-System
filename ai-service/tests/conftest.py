# pyrefly: ignore [missing-import]
from copy import deepcopy
import json
from pathlib import Path
from unittest.mock import MagicMock
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
import pytest

# pyrefly: ignore [missing-import]
from app.main import app
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest

DATA_DIR = Path(r"d:\DATN\Du_lieu_gia_AI_Service_Tuyen_dung")


@pytest.fixture(scope="session")
def raw_mock_tables():
    file_path = DATA_DIR / "all_tables_mock_data.json"
    if file_path.exists():
        return json.loads(file_path.read_text(encoding="utf-8"))
    return {}


@pytest.fixture(scope="session")
def raw_evaluation_requests():
    file_path = DATA_DIR / "evaluation_requests.json"
    return json.loads(file_path.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def raw_expected_ranges():
    file_path = DATA_DIR / "expected_score_ranges.json"
    return json.loads(file_path.read_text(encoding="utf-8"))


@pytest.fixture
def evaluation_requests(raw_evaluation_requests):
    """Returns a fresh deepcopy of the 15 evaluation requests."""
    return deepcopy(raw_evaluation_requests)


@pytest.fixture
def expected_ranges(raw_expected_ranges):
    """Returns a fresh deepcopy of expected score ranges."""
    return deepcopy(raw_expected_ranges)


@pytest.fixture
def valid_payload(raw_evaluation_requests):
    """Returns a fresh deepcopy of the first valid payload."""
    return deepcopy(raw_evaluation_requests[0])


@pytest.fixture
def valid_evaluation_request(valid_payload):
    """Returns a validated Pydantic EvaluationRequest object."""
    return EvaluationRequest.model_validate(valid_payload)


@pytest.fixture
def api_client():
    """FastAPI TestClient instance."""
    return TestClient(app)


@pytest.fixture
def mock_semantic_matcher(monkeypatch):
    """
    Mocks SemanticMatcher for unit tests so they execute instantly
    without HuggingFace model loading overhead.
    """
    fake_model = MagicMock()

    def fake_similarity(text1, text2):
        if not text1 or not text2:
            return 0.0
        t1, t2 = text1.lower(), text2.lower()
        if t1 == t2:
            return 1.0
        # Simple word intersection score for unit tests
        w1, w2 = set(t1.split()), set(t2.split())
        if not w1 or not w2:
            return 0.0
        return len(w1.intersection(w2)) / float(len(w1.union(w2)))

    def fake_best_similarity(target, candidates):
        if not candidates:
            return 0.0
        return max([fake_similarity(target, c) for c in candidates if c])

    from app.services.matching.semantic import semantic_matcher
    monkeypatch.setattr(semantic_matcher, "compute_similarity", fake_similarity)
    monkeypatch.setattr(semantic_matcher, "compute_best_similarity", fake_best_similarity)
    monkeypatch.setattr(semantic_matcher, "prefetch", lambda texts: None)
    monkeypatch.setattr(semantic_matcher, "clear_cache", lambda: None)
    return semantic_matcher
