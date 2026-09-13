import asyncio
import hashlib
import hmac
import json
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi.testclient import TestClient

import online_interviews
from app import app

client = TestClient(app)
SYSTEM_HEADERS = {"X-Interview-System-Key": "dev-interview-system-key"}


def create_payload() -> dict:
    return {
        "recruitment_application_id": "application-1",
        "candidate": {"id": "candidate-1", "email": "candidate@example.com", "display_name": "Nguyen Van A"},
        "cv": {"summary": "Backend developer with Java and Spring Boot experience."},
        "jd": {"title": "Backend Developer"},
        "config": {"opening_questions": ["Hay gioi thieu ban than"], "competencies": ["technical"], "max_questions": 1},
        "expires_in_hours": 72,
        "callback_url": "http://localhost:3001/api/interview-events",
    }


def test_one_time_link_otp_and_candidate_flow(monkeypatch, tmp_path) -> None:
    delivered: dict = {}

    async def fake_transcribe(audio: bytes) -> str:
        assert audio == b"wav"
        return "Tôi đã xây dựng REST API."

    async def fake_synthesize(text: str) -> bytes:
        assert text == "Hay gioi thieu ban than"
        return b"mp3"

    async def fake_callback(url: str, body: bytes, headers: dict[str, str]) -> None:
        delivered.update(url=url, body=body, headers=headers)

    monkeypatch.setattr(online_interviews.secrets, "randbelow", lambda _: 123456)
    monkeypatch.setattr(online_interviews, "VIDEO_ROOT", tmp_path)
    monkeypatch.setattr(online_interviews, "azure_speech_is_configured", lambda: True)
    monkeypatch.setattr(online_interviews, "transcribe_with_azure", fake_transcribe)
    monkeypatch.setattr(online_interviews, "synthesize_with_azure", fake_synthesize)
    monkeypatch.setattr(online_interviews, "send_callback_http", fake_callback)
    monkeypatch.setenv("INTERVIEW_CALLBACK_SECRET", "unit-test-callback-secret")
    created = client.post("/v1/internal/interviews", json=create_payload(), headers=SYSTEM_HEADERS)
    assert created.status_code == 201
    interview_id = created.json()["interview_id"]
    launch_token = parse_qs(urlparse(created.json()["launch_url"]).query)["launch"][0]

    assert client.post(f"/v1/public/launch/{launch_token}/otp", json={"email": "candidate@example.com"}).status_code == 200
    verified = client.post(f"/v1/public/launch/{launch_token}/verify", json={"email": "candidate@example.com", "code": "123456"})
    assert verified.status_code == 200
    access_headers = {"Authorization": f"Bearer {verified.json()['access_token']}"}
    assert client.get(f"/v1/public/launch/{launch_token}").status_code == 410

    started = client.post("/v1/participant/start", headers=access_headers)
    assert started.status_code == 200
    assert started.json()["prepare_seconds"] == 5
    tts = client.post("/v1/participant/speech/synthesize", json={"question_number": 1}, headers=access_headers)
    assert tts.status_code == 200 and tts.content == b"mp3" and tts.headers["content-type"] == "audio/mpeg"
    stt = client.post("/v1/participant/speech/transcribe", content=b"wav", headers={**access_headers, "Content-Type": "audio/wav", "X-Interview-Question-Number": "1"})
    assert stt.status_code == 200 and stt.json()["text"] == "Tôi đã xây dựng REST API."
    ended = client.post("/v1/participant/answers", json=stt.json(), headers=access_headers)
    assert ended.status_code == 200
    assert ended.json()["status"] == "COMPLETED"

    uploaded = client.post("/v1/participant/videos", content=b"video", headers={**access_headers, "Content-Type": "video/webm", "X-Interview-Question-Number": "1"})
    assert uploaded.status_code == 202

    asyncio.run(online_interviews.deliver_due_callbacks())
    callback_payload = json.loads(delivered["body"])
    assert delivered["url"] == "http://localhost:3001/api/interview-events"
    assert callback_payload["event_type"] == "interview.completed"
    assert callback_payload["data"]["recruitment_application_id"] == "application-1"
    timestamp = delivered["headers"]["X-Interview-Timestamp"]
    expected = hmac.new(
        b"unit-test-callback-secret",
        timestamp.encode() + b"." + delivered["body"],
        hashlib.sha256,
    ).hexdigest()
    assert delivered["headers"]["X-Interview-Signature"] == f"v1={expected}"
    report = client.get(f"/v1/internal/interviews/{interview_id}/report", headers=SYSTEM_HEADERS)
    assert report.json()["callback"]["status"] == "DELIVERED"

    async def unavailable_callback(url: str, body: bytes, headers: dict[str, str]) -> None:
        raise httpx.ConnectError("recruitment system unavailable")

    monkeypatch.setattr(online_interviews, "send_callback_http", unavailable_callback)
    retried = client.post(f"/v1/internal/interviews/{interview_id}/callback/retry", headers=SYSTEM_HEADERS)
    assert retried.status_code == 202
    asyncio.run(online_interviews.deliver_due_callbacks())
    report = client.get(f"/v1/internal/interviews/{interview_id}/report", headers=SYSTEM_HEADERS)
    assert report.json()["callback"]["status"] == "PENDING"
    assert report.json()["callback"]["attempts"] == 1
    assert report.json()["callback"]["next_attempt_at"] is not None
