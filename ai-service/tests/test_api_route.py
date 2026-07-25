import json
from pathlib import Path
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

# pyrefly: ignore [missing-import]
from app.main import app

client = TestClient(app)

MOCK_DATA_DIR = Path(r"d:\DATN\Du_lieu_gia_AI_Service_Tuyen_dung")
EVAL_REQUESTS_FILE = MOCK_DATA_DIR / "evaluation_requests.json"


def test_api_evaluate_endpoint():
    payloads = json.loads(EVAL_REQUESTS_FILE.read_text(encoding="utf-8"))
    payload = payloads[0]

    response = client.post("/api/v1/matching/evaluate", json=payload)
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"

    data = response.json()
    assert "overall_score" in data
    assert "match_level" in data
    assert "skills_score" in data
    assert "experience_score" in data
    assert "education_score" in data
    assert "project_score" in data
    assert "strengths" in data
    assert "gaps" in data
    assert "missing_required_skills" in data
    assert "summary" in data
    assert data["match_level"] in ["HIGH", "MEDIUM", "LOW"]
