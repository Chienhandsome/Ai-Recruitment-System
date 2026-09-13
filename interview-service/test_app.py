from fastapi.testclient import TestClient

import app as app_module
from app import app

client = TestClient(app)


def test_interview_runs_to_report_without_llm_key(monkeypatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    started = client.post(
        "/v1/interviews",
        json={
            "cv": {"full_name": "Nguyen Van A", "skills": ["Python", "FastAPI"]},
            "jd": {"title": "Backend Intern", "requirements": ["Python"]},
            "config": {"opening_questions": ["Ban hay gioi thieu ban than"], "max_questions": 2},
        },
    )
    assert started.status_code == 201
    session_id = started.json()["session_id"]
    assert started.json()["question"]["source"] == "opening"

    follow_up = client.post(
        f"/v1/interviews/{session_id}/answers", json={"text": "Toi da lam API FastAPI."}
    )
    assert follow_up.status_code == 200
    assert follow_up.json()["question"]["source"] == "fallback"

    completed = client.post(
        f"/v1/interviews/{session_id}/answers", json={"text": "Toi da toi uu truy van."}
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert completed.json()["report"]["answered_questions"] == 2


def test_demo_origin_is_allowed_by_cors() -> None:
    response = client.options(
        "/v1/interviews",
        headers={
            "Origin": "http://127.0.0.1:4173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:4173"


def test_video_can_upload_before_answer_completes(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(app_module, "VIDEO_STORAGE_ROOT", tmp_path)
    started = client.post(
        "/v1/interviews",
        json={"cv": {}, "jd": {}, "config": {"max_questions": 1}},
    )
    session_id = started.json()["session_id"]

    uploaded = client.post(
        f"/v1/interviews/{session_id}/videos",
        content=b"demo-video-bytes",
        headers={
            "Content-Type": "video/webm",
            "X-Interview-Question-Number": "1",
        },
    )

    assert uploaded.status_code == 202
    assert uploaded.json()["status"] == "stored"
    assert len(list((tmp_path / session_id).glob("*.webm"))) == 1


def test_timeout_can_submit_an_empty_transcript() -> None:
    started = client.post(
        "/v1/interviews",
        json={"cv": {}, "jd": {}, "config": {"max_questions": 1}},
    )
    session_id = started.json()["session_id"]
    completed = client.post(f"/v1/interviews/{session_id}/answers", json={"text": ""})

    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
