import asyncio
import hashlib
import hmac
import json
import os
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi.testclient import TestClient

import online_interviews
from app import app

client = TestClient(app)
SYSTEM_HEADERS = {
    "X-Interview-System-Key": os.getenv(
        "INTERVIEW_SYSTEM_API_KEY",
        "dev-interview-system-key",
    )
}


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


def test_verify_otp_request_accepts_local_and_supabase_lengths() -> None:
    assert online_interviews.VerifyOtpRequest(email="candidate@example.com", code="123456").code == "123456"
    assert online_interviews.VerifyOtpRequest(email="candidate@example.com", code="12345678").code == "12345678"


def test_fallback_questions_are_unique_with_nested_recruitment_cv() -> None:
    interview = online_interviews.OnlineInterview(
        id="interview-unique",
        recruitment_application_id="application-unique",
        candidate={"id": "candidate-unique", "email": "candidate@example.com", "display_name": "Candidate"},
        cv={"candidate_profile": {"professional_summary": "Flutter developer with three years of mobile application experience."}},
        jd={"title": "Flutter Developer"},
        config={"opening_questions": ["Giới thiệu bản thân"], "competencies": ["technical", "problem_solving"], "max_questions": 6},
        callback_url=None,
        launch_token_hash="hash",
        expires_at=online_interviews.now(),
    )

    questions: list[str] = []
    for _ in range(5):
        question = online_interviews.fallback_question(interview)
        questions.append(question.text)
        interview.turns.append(
            online_interviews.Turn(question=question, transcript="Candidate answer", answered_at=online_interviews.now())
        )

    assert len(questions) == len(set(questions))
    assert "Flutter developer" in questions[0]


def test_fallback_question_ignores_ids_urls_and_prefers_project_evidence() -> None:
    opaque_id = "a60bf078-c16c-450a-a437-507c4adec2c0"
    interview = online_interviews.OnlineInterview(
        id="interview-clean-evidence",
        recruitment_application_id="application-clean-evidence",
        candidate={"id": "candidate-clean", "email": "candidate@example.com", "display_name": "Candidate"},
        cv={
            "profile_snapshot": {
                "id": opaque_id,
                "candidate_profile_id": "a920a99f-a4cf-4b20-857c-d37ec9c91eb0",
            },
            "candidate_profile": {
                "professional_summary": "Backend developer with three years of product experience.",
                "projects": [{
                    "id": "e304b198-d45e-4cd6-9327-2ce7d86c8ab7",
                    "project_name": "SmartRecruit AI",
                    "project_url": "https://example.com/internal-project",
                    "description": "Built an AI recruitment platform with asynchronous interview processing.",
                }],
            },
        },
        jd={"title": "Backend Developer"},
        config={"opening_questions": ["Giới thiệu bản thân"], "competencies": ["technical"], "max_questions": 3},
        callback_url=None,
        launch_token_hash="hash",
        expires_at=online_interviews.now(),
    )

    question = online_interviews.fallback_question(interview)
    evidence = online_interviews.nested_evidence(interview.cv)

    assert evidence[0] == "SmartRecruit AI"
    assert opaque_id not in " ".join(evidence)
    assert "example.com" not in " ".join(evidence)
    assert "SmartRecruit AI" in question.text
    assert opaque_id not in question.text


def test_duplicate_question_detection_ignores_case_and_punctuation() -> None:
    interview = online_interviews.OnlineInterview(
        id="interview-duplicate",
        recruitment_application_id="application-duplicate",
        candidate={"id": "candidate-duplicate", "email": "candidate@example.com", "display_name": "Candidate"},
        cv={},
        jd={},
        config={"opening_questions": ["Giới thiệu bản thân"], "competencies": ["technical"], "max_questions": 2},
        callback_url=None,
        launch_token_hash="hash",
        expires_at=online_interviews.now(),
        turns=[{
            "question": {"number": 1, "text": "Bạn hãy mô tả dự án gần đây?", "competency": "technical", "source": "opening"},
            "transcript": "Candidate answer",
            "answered_at": online_interviews.now(),
        }],
    )

    assert online_interviews.question_is_duplicate("BẠN HÃY MÔ TẢ DỰ ÁN GẦN ĐÂY!", interview)
    assert not online_interviews.question_is_duplicate("Bạn xử lý bất đồng trong nhóm như thế nào?", interview)


def test_supabase_media_storage_creates_signed_playback_url() -> None:
    class FakeBucket:
        def create_signed_url(self, path: str, expires_in: int) -> dict[str, str]:
            assert path == "interviews/session/answers/question-1.webm"
            assert expires_in == 900
            return {"signedURL": "https://storage.example.test/signed/video"}

    storage = object.__new__(online_interviews.SupabaseMediaStorage)
    storage.bucket = FakeBucket()

    assert storage.create_playback_url(
        "interviews/session/answers/question-1.webm",
        900,
    ) == "https://storage.example.test/signed/video"


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
    monkeypatch.setattr(online_interviews, "speech_is_configured", lambda: True)
    monkeypatch.setattr(online_interviews, "transcribe_speech", fake_transcribe)
    monkeypatch.setattr(online_interviews, "synthesize_speech", fake_synthesize)
    monkeypatch.setattr(online_interviews, "send_otp", lambda _interview, _otp: "test")
    monkeypatch.setattr(online_interviews, "send_callback_http", fake_callback)
    monkeypatch.setenv("INTERVIEW_CALLBACK_SECRET", "unit-test-callback-secret")
    created = client.post("/v1/internal/interviews", json=create_payload(), headers=SYSTEM_HEADERS)
    assert created.status_code == 201
    interview_id = created.json()["interview_id"]
    launch_token = parse_qs(urlparse(created.json()["launch_url"]).query)["launch"][0]

    launch_details = client.get(f"/v1/public/launch/{launch_token}")
    assert launch_details.status_code == 200
    assert launch_details.json()["max_questions"] == 1
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

    upload_headers = {
        **access_headers,
        "Content-Type": "video/webm",
        "X-Interview-Question-Number": "1",
        "X-Interview-Upload-Id": "7e6d1139-6a5d-4fb5-849d-a03cb53cbce2",
    }
    uploaded = client.post("/v1/participant/videos", content=b"video", headers=upload_headers)
    assert uploaded.status_code == 202
    duplicate_upload = client.post("/v1/participant/videos", content=b"video", headers=upload_headers)
    assert duplicate_upload.status_code == 202
    assert len(online_interviews.store.get(interview_id).videos) == 1

    asyncio.run(online_interviews.deliver_due_callbacks())
    callback_payload = json.loads(delivered["body"])
    assert delivered["url"] == "http://localhost:3001/api/interview-events"
    assert callback_payload["event_type"] == "interview.completed"
    assert callback_payload["data"]["recruitment_application_id"] == "application-1"
    assert "T" in callback_payload["data"]["started_at"]
    assert "T" in callback_payload["data"]["completed_at"]
    assert "T" in callback_payload["data"]["transcript"][0]["answered_at"]
    assert "T" in callback_payload["data"]["videos"][0]["created_at"]
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
