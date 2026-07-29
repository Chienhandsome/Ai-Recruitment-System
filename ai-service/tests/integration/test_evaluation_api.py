# pyrefly: ignore [missing-import]
import pytest


@pytest.mark.integration
@pytest.mark.api
def test_evaluate_api_contract(api_client, valid_payload):
    response = api_client.post("/api/v1/matching/evaluate", json=valid_payload)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")

    data = response.json()
    expected_keys = {
        "overall_score",
        "match_level",
        "skills_score",
        "experience_score",
        "education_score",
        "project_score",
        "strengths",
        "gaps",
        "missing_required_skills",
        "summary",
    }
    assert expected_keys.issubset(data.keys())
    assert isinstance(data["overall_score"], (int, float))
    assert isinstance(data["strengths"], list)
    assert isinstance(data["gaps"], list)
    assert isinstance(data["missing_required_skills"], list)
