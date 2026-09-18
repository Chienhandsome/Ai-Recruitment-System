"""Independent online-AI-interview workflow.

This module intentionally owns no Recruitment System records.  The caller sends
snapshots and correlation IDs, while this service owns the invitation, OTP,
interview runtime, media metadata and report.
"""

from __future__ import annotations

import asyncio
import base64
from difflib import SequenceMatcher
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import smtplib
import sqlite3
import ssl
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger("interview-service.online")
router = APIRouter(tags=["Online AI interviews"])

DEFAULT_SYSTEM_KEY = "dev-interview-system-key"
DEFAULT_WEB_ORIGIN = "http://127.0.0.1:4174"
MAX_EXPIRY_HOURS = 10 * 24
VIDEO_ROOT = Path(os.getenv("INTERVIEW_VIDEO_STORAGE_PATH", str(Path(__file__).parent / "private-media"))).resolve()
DATABASE_PATH = Path(os.getenv("INTERVIEW_DATABASE_PATH", str(Path(__file__).parent / "data" / "interviews.sqlite3"))).resolve()
MAX_VIDEO_BYTES = int(os.getenv("INTERVIEW_VIDEO_MAX_BYTES", str(50 * 1024 * 1024)))
SPEECH_PROVIDER = os.getenv("INTERVIEW_SPEECH_PROVIDER", "google").strip().lower()
MAX_SPEECH_BYTES = int(os.getenv("INTERVIEW_SPEECH_MAX_AUDIO_BYTES", str(3 * 1024 * 1024)))
GOOGLE_SPEECH_LANGUAGE = os.getenv("GOOGLE_SPEECH_LANGUAGE", "vi-VN").strip()
GOOGLE_TTS_LANGUAGE_CODE = os.getenv("GOOGLE_TTS_LANGUAGE_CODE", "vi-VN").strip()
GOOGLE_TTS_VOICE = os.getenv("GOOGLE_TTS_VOICE", "").strip()
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "").strip()
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "").strip()
AZURE_SPEECH_LANGUAGE = os.getenv("AZURE_SPEECH_LANGUAGE", "vi-VN").strip()
AZURE_SPEECH_VOICE = os.getenv("AZURE_SPEECH_VOICE", "vi-VN-HoaiMyNeural").strip()
CALLBACK_MAX_ATTEMPTS = int(os.getenv("INTERVIEW_CALLBACK_MAX_ATTEMPTS", "8"))
CALLBACK_TIMEOUT_SECONDS = float(os.getenv("INTERVIEW_CALLBACK_TIMEOUT_SECONDS", "10"))
CALLBACK_MEDIA_GRACE_SECONDS = int(os.getenv("INTERVIEW_CALLBACK_MEDIA_GRACE_SECONDS", "60"))
CALLBACK_RETRY_SECONDS = (0, 10, 30, 120, 300, 900, 3600, 10800)
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "").strip()
SUPABASE_INTERVIEW_BUCKET = os.getenv("SUPABASE_INTERVIEW_BUCKET", "interview-videos").strip()
OTP_PROVIDER = os.getenv(
    "INTERVIEW_OTP_PROVIDER",
    "supabase_auth" if SUPABASE_PUBLISHABLE_KEY else "smtp",
).strip().lower()


def supabase_is_configured() -> bool:
    """Use Supabase only when both server-side credentials are configured."""
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def azure_speech_is_configured() -> bool:
    return bool(AZURE_SPEECH_KEY and AZURE_SPEECH_REGION)


def google_speech_is_configured() -> bool:
    """Google Cloud clients use Application Default Credentials."""
    credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    return bool(credential_path and Path(credential_path).is_file())


def speech_is_configured() -> bool:
    if SPEECH_PROVIDER == "google":
        return google_speech_is_configured()
    if SPEECH_PROVIDER == "azure":
        return azure_speech_is_configured()
    return False


def create_supabase_client() -> Any:
    """Create the admin-only client lazily so the offline demo has no SDK dependency."""
    try:
        from supabase import create_client
    except ImportError as exc:
        raise RuntimeError("Cần cài package 'supabase' khi cấu hình SUPABASE_URL") from exc
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def now() -> datetime:
    return datetime.now(timezone.utc)


def secret_value(name: str, fallback: str) -> bytes:
    return os.getenv(name, fallback).encode("utf-8")


def digest(value: str, secret_name: str) -> str:
    return hmac.new(secret_value(secret_name, "local-development-secret"), value.encode(), hashlib.sha256).hexdigest()


def encode_access_token(interview_id: str, expires_at: datetime) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"iid": interview_id, "exp": expires_at.timestamp()}).encode()).decode().rstrip("=")
    signature = digest(payload, "INTERVIEW_ACCESS_TOKEN_SECRET")
    return f"{payload}.{signature}"


def decode_access_token(token: str) -> str:
    try:
        payload, signature = token.split(".", 1)
        if not hmac.compare_digest(signature, digest(payload, "INTERVIEW_ACCESS_TOKEN_SECRET")):
            raise ValueError("invalid signature")
        decoded = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        data = json.loads(decoded)
        if float(data["exp"]) < now().timestamp():
            raise ValueError("expired")
        return str(data["iid"])
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=401, detail="Candidate access token không hợp lệ hoặc đã hết hạn") from exc


class CandidateSnapshot(BaseModel):
    id: str
    email: str
    display_name: str = Field(min_length=1, max_length=160)


class InterviewConfig(BaseModel):
    opening_questions: list[str] = Field(min_length=1, max_length=2)
    competencies: list[str] = Field(min_length=1, max_length=10)
    max_questions: int = Field(default=6, ge=1, le=12)


class CreateInterviewRequest(BaseModel):
    recruitment_application_id: str
    candidate: CandidateSnapshot
    cv: dict[str, Any]
    jd: dict[str, Any]
    config: InterviewConfig
    expires_in_hours: int = Field(default=72, ge=1, le=MAX_EXPIRY_HOURS)
    callback_url: str | None = None

    @field_validator("callback_url")
    @classmethod
    def validate_callback_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("callback_url phải là URL HTTP(S) hợp lệ và không chứa credentials")
        is_local = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
        if parsed.scheme != "https" and not is_local and os.getenv("INTERVIEW_ALLOW_INSECURE_CALLBACKS", "false").lower() != "true":
            raise ValueError("callback_url phải dùng HTTPS (HTTP chỉ được phép cho localhost)")
        allowed_hosts = {host.strip().lower() for host in os.getenv("INTERVIEW_CALLBACK_ALLOWED_HOSTS", "").split(",") if host.strip()}
        if allowed_hosts and parsed.hostname.lower() not in allowed_hosts:
            raise ValueError("Host callback không nằm trong INTERVIEW_CALLBACK_ALLOWED_HOSTS")
        return value


class CreateInterviewResponse(BaseModel):
    interview_id: str
    launch_url: str
    expires_at: datetime
    status: str


class OtpRequest(BaseModel):
    email: str


class VerifyOtpRequest(OtpRequest):
    # Local/SMTP OTP uses 6 digits; Supabase Auth can be configured for 8.
    code: str = Field(pattern=r"^(?:\d{6}|\d{8})$")


class AnswerRequest(BaseModel):
    text: str = Field(default="", max_length=8_000)

    @field_validator("text")
    @classmethod
    def normalize(cls, value: str) -> str:
        return value.strip()


class TerminateRequest(BaseModel):
    reason: Literal["TAB_HIDDEN", "FULLSCREEN_EXIT", "NETWORK_LOSS", "CANDIDATE_EXIT"]


class SynthesisRequest(BaseModel):
    question_number: int = Field(ge=1)


class Question(BaseModel):
    number: int
    text: str
    competency: str
    source: Literal["opening", "llm", "fallback"]


class LlmQuestion(BaseModel):
    text: str = Field(min_length=10, max_length=320)
    competency: str = Field(min_length=1, max_length=100)


class Turn(BaseModel):
    question: Question
    transcript: str
    answered_at: datetime


class SecurityEvent(BaseModel):
    type: str
    happened_at: datetime


class VideoAsset(BaseModel):
    id: str
    question_number: int
    path: str
    content_type: str = "video/webm"
    size_bytes: int
    created_at: datetime


class OnlineInterview(BaseModel):
    id: str
    recruitment_application_id: str
    candidate: CandidateSnapshot
    cv: dict[str, Any]
    jd: dict[str, Any]
    config: InterviewConfig
    callback_url: str | None
    status: Literal["CREATED", "AWAITING_OTP", "VERIFIED", "IN_PROGRESS", "COMPLETED", "EXPIRED", "TERMINATED"] = "CREATED"
    launch_token_hash: str
    link_consumed: bool = False
    expires_at: datetime
    otp_hash: str | None = None
    otp_expires_at: datetime | None = None
    otp_attempts: int = 0
    active_question: Question | None = None
    turns: list[Turn] = Field(default_factory=list)
    videos: list[VideoAsset] = Field(default_factory=list)
    events: list[SecurityEvent] = Field(default_factory=list)
    started_at: datetime | None = None
    last_heartbeat_at: datetime | None = None
    completed_at: datetime | None = None
    termination_reason: str | None = None
    callback_status: Literal["NOT_CONFIGURED", "PENDING", "DELIVERED", "FAILED"] = "NOT_CONFIGURED"
    callback_event_id: str | None = None
    callback_attempts: int = 0
    callback_next_attempt_at: datetime | None = None
    callback_last_attempt_at: datetime | None = None
    callback_delivered_at: datetime | None = None
    callback_last_error: str | None = None


class OnlineStore:
    def __init__(self) -> None:
        self.items: dict[str, OnlineInterview] = {}
        self.supabase = create_supabase_client() if supabase_is_configured() else None
        self.using_supabase = self.supabase is not None
        if self.using_supabase:
            self.connection = None
            try:
                response = self.supabase.table("online_interviews").select("id,payload").execute()
                for record in response.data or []:
                    self.items[str(record["id"])] = OnlineInterview.model_validate(record["payload"])
            except Exception as exc:
                raise RuntimeError("Không thể tải dữ liệu từ Supabase. Hãy chạy migration SQL trước.") from exc
            logger.info("Interview persistence: Supabase Postgres")
            return
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        self.connection.execute("CREATE TABLE IF NOT EXISTS online_interviews (id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        self.connection.commit()
        for interview_id, payload in self.connection.execute("SELECT id, payload FROM online_interviews"):
            self.items[interview_id] = OnlineInterview.model_validate_json(payload)
        logger.warning("Interview persistence: local SQLite fallback. Configure Supabase before deployment.")

    def save(self, interview: OnlineInterview) -> None:
        self.items[interview.id] = interview
        if self.using_supabase:
            self.supabase.table("online_interviews").upsert(
                {"id": interview.id, "payload": interview.model_dump(mode="json")}, on_conflict="id"
            ).execute()
            return
        payload = interview.model_dump_json()
        assert self.connection is not None
        self.connection.execute("INSERT OR REPLACE INTO online_interviews (id, payload) VALUES (?, ?)", (interview.id, payload))
        self.connection.commit()

    def get(self, interview_id: str) -> OnlineInterview:
        try:
            return self.items[interview_id]
        except KeyError as exc:
            raise HTTPException(status_code=404, detail="Không tìm thấy cuộc phỏng vấn") from exc

    def find_by_launch_token(self, token: str) -> OnlineInterview:
        token_hash = digest(token, "INTERVIEW_LAUNCH_TOKEN_SECRET")
        for item in self.items.values():
            if hmac.compare_digest(item.launch_token_hash, token_hash):
                return item
        raise HTTPException(status_code=404, detail="Link phỏng vấn không hợp lệ")


store = OnlineStore()


class MediaStorage:
    """Keeps media private. The browser never receives a storage credential."""

    async def upload(self, interview_id: str, question_number: int, extension: str, content_type: str, request: Request) -> tuple[str, int]:
        raise NotImplementedError

    def download(self, object_key: str) -> bytes | None:
        raise NotImplementedError

    def create_playback_url(self, object_key: str, expires_in: int) -> str | None:
        """Return a short-lived URL when the storage provider supports streaming."""
        return None


class LocalMediaStorage(MediaStorage):
    async def upload(self, interview_id: str, question_number: int, extension: str, content_type: str, request: Request) -> tuple[str, int]:
        destination = VIDEO_ROOT / interview_id
        destination.mkdir(parents=True, exist_ok=True)
        target = destination / f"question-{question_number}-{uuid4()}{extension}"
        size = 0
        try:
            with target.open("xb") as output:
                async for chunk in request.stream():
                    size += len(chunk)
                    if size > MAX_VIDEO_BYTES:
                        raise HTTPException(status_code=413, detail="Video vượt giới hạn 50 MB")
                    output.write(chunk)
        except HTTPException:
            target.unlink(missing_ok=True)
            raise
        return str(target), size

    def download(self, object_key: str) -> bytes | None:
        path = Path(object_key)
        return path.read_bytes() if path.is_file() else None


class SupabaseMediaStorage(MediaStorage):
    def __init__(self) -> None:
        self.bucket = create_supabase_client().storage.from_(SUPABASE_INTERVIEW_BUCKET)

    async def upload(self, interview_id: str, question_number: int, extension: str, content_type: str, request: Request) -> tuple[str, int]:
        content = bytearray()
        async for chunk in request.stream():
            content.extend(chunk)
            if len(content) > MAX_VIDEO_BYTES:
                raise HTTPException(status_code=413, detail="Video vượt giới hạn 50 MB")
        object_key = f"interviews/{interview_id}/answers/question-{question_number}-{uuid4()}{extension}"
        try:
            self.bucket.upload(
                path=object_key,
                file=bytes(content),
                file_options={"content-type": content_type, "upsert": "false"},
            )
        except Exception as exc:
            logger.exception("Supabase video upload failed")
            raise HTTPException(status_code=502, detail="Không thể lưu video. Vui lòng thử lại.") from exc
        return object_key, len(content)

    def download(self, object_key: str) -> bytes | None:
        try:
            return self.bucket.download(object_key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Supabase video download failed: %s", exc)
            return None

    def create_playback_url(self, object_key: str, expires_in: int) -> str | None:
        try:
            result = self.bucket.create_signed_url(object_key, expires_in)
            if isinstance(result, dict):
                value = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
            else:
                value = getattr(result, "signed_url", None) or getattr(result, "signedURL", None)
            return str(value) if value else None
        except Exception as exc:  # noqa: BLE001
            logger.exception("Supabase playback URL creation failed")
            raise HTTPException(status_code=502, detail="Không thể tạo đường dẫn phát video.") from exc


media_storage: MediaStorage = SupabaseMediaStorage() if supabase_is_configured() else LocalMediaStorage()


def video_metadata(video: VideoAsset) -> dict[str, Any]:
    return {
        "id": video.id,
        "question_number": video.question_number,
        "content_type": video.content_type,
        "size_bytes": video.size_bytes,
        "created_at": video.created_at.isoformat(),
    }


def report_payload(interview: OnlineInterview) -> dict[str, Any]:
    return {
        "interview_id": interview.id,
        "recruitment_application_id": interview.recruitment_application_id,
        "status": interview.status,
        "started_at": interview.started_at.isoformat() if interview.started_at else None,
        "completed_at": interview.completed_at.isoformat() if interview.completed_at else None,
        "transcript": [turn.model_dump(mode="json") for turn in interview.turns],
        "videos": [video_metadata(video) for video in interview.videos],
        "security_events": [event.model_dump(mode="json") for event in interview.events],
        "termination_reason": interview.termination_reason,
    }


def mark_callback_pending(interview: OnlineInterview) -> None:
    if not interview.callback_url:
        interview.callback_status = "NOT_CONFIGURED"
        return
    if interview.callback_status == "DELIVERED":
        return
    interview.callback_status = "PENDING"
    interview.callback_event_id = interview.callback_event_id or str(uuid4())
    interview.callback_next_attempt_at = now()
    interview.callback_last_error = None


def callback_request(interview: OnlineInterview) -> tuple[bytes, dict[str, str]]:
    event_type = {
        "COMPLETED": "interview.completed",
        "TERMINATED": "interview.terminated",
        "EXPIRED": "interview.expired",
    }.get(interview.status, "interview.updated")
    payload = {
        "event_id": interview.callback_event_id,
        "event_type": event_type,
        "occurred_at": (interview.completed_at or now()).isoformat(),
        "data": report_payload(interview),
    }
    body = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    timestamp = str(int(now().timestamp()))
    signed = timestamp.encode("ascii") + b"." + body
    signature = hmac.new(secret_value("INTERVIEW_CALLBACK_SECRET", "dev-callback-secret"), signed, hashlib.sha256).hexdigest()
    return body, {
        "Content-Type": "application/json",
        "User-Agent": "smartrecruit-interview-service/1.0",
        "X-Interview-Event-Id": interview.callback_event_id or "",
        "X-Interview-Timestamp": timestamp,
        "X-Interview-Signature": f"v1={signature}",
    }


async def send_callback_http(url: str, body: bytes, headers: dict[str, str]) -> None:
    async with httpx.AsyncClient(timeout=CALLBACK_TIMEOUT_SECONDS, follow_redirects=False) as client:
        response = await client.post(url, content=body, headers=headers)
    response.raise_for_status()


async def deliver_callback(interview: OnlineInterview) -> None:
    if not interview.callback_url or interview.callback_status != "PENDING":
        return
    if interview.callback_attempts >= CALLBACK_MAX_ATTEMPTS:
        interview.callback_status = "FAILED"
        interview.callback_next_attempt_at = None
        store.save(interview)
        return
    body, headers = callback_request(interview)
    interview.callback_attempts += 1
    interview.callback_last_attempt_at = now()
    store.save(interview)
    try:
        await send_callback_http(interview.callback_url, body, headers)
    except httpx.HTTPError as exc:
        interview.callback_last_error = str(exc)[:500]
        if interview.callback_attempts >= CALLBACK_MAX_ATTEMPTS:
            interview.callback_status = "FAILED"
            interview.callback_next_attempt_at = None
        else:
            delay_index = min(interview.callback_attempts, len(CALLBACK_RETRY_SECONDS) - 1)
            interview.callback_next_attempt_at = now() + timedelta(seconds=CALLBACK_RETRY_SECONDS[delay_index])
        logger.warning(
            "Callback %s attempt %s failed: %s",
            interview.callback_event_id,
            interview.callback_attempts,
            exc,
        )
    else:
        interview.callback_status = "DELIVERED"
        interview.callback_delivered_at = now()
        interview.callback_next_attempt_at = None
        interview.callback_last_error = None
    store.save(interview)


async def deliver_due_callbacks() -> None:
    current = now()
    due = [
        interview
        for interview in store.items.values()
        if interview.callback_status == "PENDING"
        and interview.callback_next_attempt_at
        and interview.callback_next_attempt_at <= current
    ]
    for interview in due:
        waiting_for_media = (
            interview.status == "COMPLETED"
            and len(interview.videos) < len(interview.turns)
            and interview.completed_at is not None
            and current < interview.completed_at + timedelta(seconds=CALLBACK_MEDIA_GRACE_SECONDS)
        )
        if waiting_for_media:
            interview.callback_next_attempt_at = current + timedelta(seconds=5)
            store.save(interview)
            continue
        await deliver_callback(interview)


async def monitor_heartbeats() -> None:
    while True:
        cutoff = now() - timedelta(seconds=30)
        for interview in store.items.values():
            expire_if_needed(interview)
            if interview.status == "IN_PROGRESS" and interview.last_heartbeat_at and interview.last_heartbeat_at < cutoff:
                interview.status = "TERMINATED"
                interview.termination_reason = "NETWORK_LOSS"
                interview.completed_at = now()
                interview.active_question = None
                interview.events.append(SecurityEvent(type="NETWORK_LOSS", happened_at=now()))
                mark_callback_pending(interview)
                store.save(interview)
        await deliver_due_callbacks()
        await asyncio.sleep(5)


def require_system_key(x_interview_system_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("INTERVIEW_SYSTEM_API_KEY", DEFAULT_SYSTEM_KEY)
    if not x_interview_system_key or not hmac.compare_digest(x_interview_system_key, expected):
        raise HTTPException(status_code=401, detail="Không xác thực được Recruitment System")


def expire_if_needed(interview: OnlineInterview) -> None:
    if interview.status in {"COMPLETED", "EXPIRED", "TERMINATED"}:
        return
    if now() >= interview.expires_at:
        interview.status = "EXPIRED"
        interview.active_question = None
        interview.completed_at = now()
        mark_callback_pending(interview)
        store.save(interview)


def participant_from_request(request: Request) -> OnlineInterview:
    authorization = request.headers.get("authorization", "")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Thiếu candidate access token")
    interview = store.get(decode_access_token(authorization[7:]))
    expire_if_needed(interview)
    if interview.status not in {"VERIFIED", "IN_PROGRESS", "COMPLETED"}:
        raise HTTPException(status_code=409, detail=f"Phiên không thể tiếp tục: {interview.status}")
    return interview


def require_speech() -> None:
    if SPEECH_PROVIDER not in {"google", "azure"}:
        raise HTTPException(status_code=503, detail="INTERVIEW_SPEECH_PROVIDER phải là 'google' hoặc 'azure'")
    if not speech_is_configured():
        provider_name = "Google Cloud Speech" if SPEECH_PROVIDER == "google" else "Azure Speech"
        raise HTTPException(status_code=503, detail=f"{provider_name} chưa được cấu hình trên Interview Service")


async def transcribe_with_google(audio: bytes) -> str:
    """Transcribe one 16 kHz mono LINEAR16 WAV answer with Google Cloud STT."""
    try:
        from google.cloud import speech_v1 as speech
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="Thiếu package google-cloud-speech") from exc

    def recognize() -> str:
        client = speech.SpeechClient()
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code=GOOGLE_SPEECH_LANGUAGE,
            enable_automatic_punctuation=True,
        )
        response = client.recognize(config=config, audio=speech.RecognitionAudio(content=audio))
        return " ".join(
            result.alternatives[0].transcript.strip()
            for result in response.results
            if result.alternatives and result.alternatives[0].transcript.strip()
        )

    try:
        return await asyncio.to_thread(recognize)
    except Exception as exc:  # noqa: BLE001 - normalize provider/auth failures for the API.
        logger.warning("Google STT failed: %s", exc)
        raise HTTPException(status_code=502, detail="Google Speech-to-Text hiện không phản hồi") from exc


async def synthesize_with_google(text: str) -> bytes:
    try:
        from google.cloud import texttospeech
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="Thiếu package google-cloud-texttospeech") from exc

    def synthesize() -> bytes:
        client = texttospeech.TextToSpeechClient()
        voice_options: dict[str, Any] = {"language_code": GOOGLE_TTS_LANGUAGE_CODE}
        if GOOGLE_TTS_VOICE:
            voice_options["name"] = GOOGLE_TTS_VOICE
        response = client.synthesize_speech(
            input=texttospeech.SynthesisInput(text=text),
            voice=texttospeech.VoiceSelectionParams(**voice_options),
            audio_config=texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3),
        )
        return response.audio_content

    try:
        return await asyncio.to_thread(synthesize)
    except Exception as exc:  # noqa: BLE001 - normalize provider/auth failures for the API.
        error_type = type(exc).__name__
        logger.warning("Google TTS failed (%s): %s", error_type, exc)
        if error_type in {"DefaultCredentialsError", "RefreshError"}:
            detail = "Google credential không hợp lệ hoặc không đọc được"
        elif error_type in {"PermissionDenied", "Forbidden"}:
            detail = "Google Text-to-Speech chưa được bật hoặc service account thiếu quyền"
        elif error_type in {"InvalidArgument", "NotFound"}:
            detail = "Giọng đọc Google TTS không hợp lệ với ngôn ngữ đã cấu hình"
        else:
            detail = "Google Text-to-Speech hiện không phản hồi"
        raise HTTPException(status_code=502, detail=detail) from exc


async def transcribe_with_azure(audio: bytes) -> str:
    """Transcribe one answer with Azure's short-audio API (the product limit is 60 seconds)."""
    endpoint = f"https://{AZURE_SPEECH_REGION}.stt.speech.microsoft.com/stt/speech/recognition/conversation/cognitiveservices/v1"
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Accept": "application/json",
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
    }
    try:
        async with httpx.AsyncClient(timeout=75) as client:
            response = await client.post(endpoint, params={"language": AZURE_SPEECH_LANGUAGE, "format": "detailed"}, headers=headers, content=audio)
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPError as exc:
        logger.warning("Azure STT failed: %s", exc)
        raise HTTPException(status_code=502, detail="Azure Speech-to-Text hiện không phản hồi") from exc
    if data.get("RecognitionStatus") not in {"Success", "EndOfDictation"}:
        return ""
    return str(data.get("DisplayText", "")).strip()


async def synthesize_with_azure(text: str) -> bytes:
    endpoint = f"https://{AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
    ssml = f'<speak version="1.0" xml:lang="{escape(AZURE_SPEECH_LANGUAGE)}"><voice name="{escape(AZURE_SPEECH_VOICE)}">{escape(text)}</voice></speak>'
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "smartrecruit-interview-service",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(endpoint, headers=headers, content=ssml.encode("utf-8"))
        response.raise_for_status()
        return response.content
    except httpx.HTTPError as exc:
        logger.warning("Azure TTS failed: %s", exc)
        raise HTTPException(status_code=502, detail="Azure Text-to-Speech hiện không phản hồi") from exc


async def transcribe_speech(audio: bytes) -> str:
    if SPEECH_PROVIDER == "google":
        return await transcribe_with_google(audio)
    return await transcribe_with_azure(audio)


async def synthesize_speech(text: str) -> bytes:
    if SPEECH_PROVIDER == "google":
        return await synthesize_with_google(text)
    return await synthesize_with_azure(text)


def normalized_question(text: str) -> str:
    """Normalize punctuation and casing so repeated LLM questions are detectable."""
    return " ".join("".join(character if character.isalnum() else " " for character in text.casefold()).split())


def question_is_duplicate(text: str, interview: OnlineInterview) -> bool:
    candidate = normalized_question(text)
    if not candidate:
        return True
    for turn in interview.turns:
        previous = normalized_question(turn.question.text)
        if candidate == previous or SequenceMatcher(None, candidate, previous).ratio() >= 0.88:
            return True
    return False


UUID_PATTERN = re.compile(
    r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b",
    re.IGNORECASE,
)
OPAQUE_TOKEN_PATTERN = re.compile(
    r"\b(?=[a-z0-9]{24,}\b)(?=[a-z0-9]*[a-z])(?=[a-z0-9]*\d)[a-z0-9]+\b",
    re.IGNORECASE,
)
ISO_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}(?:[T ][^\s]+)?$")
IGNORED_EVIDENCE_KEYS = {
    "id",
    "email",
    "phone",
    "phonenumber",
    "createdat",
    "updatedat",
    "deletedat",
    "rawtexthash",
    "code",
    "jobcode",
    "projecturl",
    "credentialurl",
    "avatarurl",
    "resumefileurl",
}


def normalized_evidence_key(key: str) -> str:
    return "".join(character for character in key.casefold() if character.isalnum())


def is_metadata_key(key: str) -> bool:
    normalized = normalized_evidence_key(key)
    return normalized in IGNORED_EVIDENCE_KEYS or normalized.endswith("id") or normalized.endswith("url")


def is_usable_evidence(text: str, key: str) -> bool:
    if not 8 <= len(text) <= 500 or is_metadata_key(key):
        return False
    if (
        UUID_PATTERN.search(text)
        or OPAQUE_TOKEN_PATTERN.search(text)
        or ISO_DATE_PATTERN.fullmatch(text)
    ):
        return False
    lowered = text.casefold()
    if lowered.startswith(("http://", "https://", "www.")) or ("@" in text and " " not in text):
        return False
    return True


def evidence_priority(path: tuple[str, ...]) -> int:
    """Prefer project and work evidence over profile metadata and generic strings."""
    normalized_path = tuple(normalized_evidence_key(item) for item in path)
    key = normalized_path[-1] if normalized_path else ""
    if "projects" in normalized_path or "projectdata" in normalized_path:
        return {
            "projectname": 0,
            "description": 1,
            "projectrole": 2,
            "technologies": 3,
            "sourcetext": 4,
        }.get(key, 8)
    if "workexperiences" in normalized_path or "experiencedata" in normalized_path:
        return {
            "description": 10,
            "achievements": 11,
            "positiontitle": 12,
            "companyname": 13,
            "sourcetext": 14,
        }.get(key, 18)
    return {
        "professionalsummary": 20,
        "summary": 21,
        "positiontitle": 24,
        "sourcetext": 26,
        "name": 30,
        "desiredtitle": 32,
        "description": 36,
        "requirements": 38,
    }.get(key, 60)


def nested_evidence(value: Any) -> list[str]:
    """Collect meaningful CV evidence while excluding IDs, URLs and metadata."""
    collected: list[tuple[int, int, str]] = []
    insertion_order = 0

    def visit(child: Any, path: tuple[str, ...] = ()) -> None:
        nonlocal insertion_order
        if isinstance(child, str):
            cleaned = " ".join(child.split())
            key = path[-1] if path else ""
            if is_usable_evidence(cleaned, key):
                collected.append((evidence_priority(path), insertion_order, cleaned))
                insertion_order += 1
            return
        if isinstance(child, dict):
            for key, nested in child.items():
                if not is_metadata_key(str(key)):
                    visit(nested, (*path, str(key)))
            return
        if isinstance(child, list):
            for nested in child:
                visit(nested, path)

    visit(value)
    seen: set[str] = set()
    result: list[str] = []
    for _, _, text in sorted(collected):
        fingerprint = text.casefold()
        if fingerprint not in seen:
            seen.add(fingerprint)
            result.append(text)
    return result


def fallback_question(interview: OnlineInterview) -> Question:
    number = len(interview.turns) + 1
    competency = interview.config.competencies[(number - 1) % len(interview.config.competencies)]
    evidence = next(iter(nested_evidence(interview.cv)), "một dự án liên quan nhất trong CV")[:100]
    candidates = [
        f"Hãy chọn một dự án liên quan đến {evidence} và mô tả rõ vai trò, cách thực hiện cùng kết quả của bạn.",
        "Trong một quyết định kỹ thuật gần đây, bạn đã cân nhắc những phương án nào và vì sao chọn phương án cuối cùng?",
        "Bạn hãy kể về một lỗi khó từng gặp, cách tìm nguyên nhân gốc và biện pháp ngăn lỗi tái diễn.",
        "Khi nhận một yêu cầu chưa rõ ràng, bạn thường làm gì để xác định đúng vấn đề trước khi triển khai?",
        "Hãy nêu một phương án ban đầu không hiệu quả, cách bạn nhận ra vấn đề và điều chỉnh sau đó.",
        "Trong một lần phải làm việc dưới áp lực thời gian, bạn đã ưu tiên công việc và kiểm soát rủi ro như thế nào?",
        "Bạn kiểm thử và đánh giá chất lượng sản phẩm của mình bằng những tiêu chí hoặc chỉ số cụ thể nào?",
        "Hãy kể về một lần nhóm có bất đồng quan điểm và cách bạn giúp cả nhóm đi đến quyết định.",
        "Bạn từng nhận một phản hồi khó nào trong công việc, và đã thay đổi cách làm ra sao từ phản hồi đó?",
        "Khi cần học nhanh một công nghệ mới cho dự án, bạn lập kế hoạch học và kiểm chứng khả năng áp dụng như thế nào?",
        "Nếu được làm lại một dự án gần đây, bạn sẽ thay đổi quyết định nào và vì sao?",
        "Hãy đưa một ví dụ có kết quả đo lường được để chứng minh năng lực bạn cho là phù hợp nhất với vị trí này.",
    ]
    text = next((item for item in candidates if not question_is_duplicate(item, interview)), None)
    if text is None:
        text = f"Ở một tình huống khác với các ví dụ trước, bạn có thể cung cấp thêm bằng chứng cho năng lực {competency} không?"
    return Question(number=number, competency=competency, source="fallback", text=text)


def llm_question(interview: OnlineInterview) -> Question | None:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        from google import genai
        from google.genai import types

        transcript = [
            {"question": turn.question.text, "answer": turn.transcript[:1200]}
            for turn in interview.turns[-4:]
        ]
        previous_questions = [turn.question.text for turn in interview.turns]
        cv_evidence = nested_evidence(interview.cv)[:30]
        job_evidence = nested_evidence(interview.jd)[:20]
        prompt = f"""Generate exactly one concise Vietnamese follow-up job interview question under 260 characters.
Candidate CV evidence JSON: {json.dumps(cv_evidence, ensure_ascii=False)[:5000]}
Job description evidence JSON: {json.dumps(job_evidence, ensure_ascii=False)[:3500]}
Required competencies: {interview.config.competencies}
Recent transcript JSON: {json.dumps(transcript, ensure_ascii=False)[:5000]}
Questions already asked and strictly forbidden: {json.dumps(previous_questions, ensure_ascii=False)}
Use the candidate's most recent answer to choose a new angle and request concrete evidence that is still missing.
Never mention database IDs, UUIDs, URLs, hashes or internal metadata in the question.
Ask about work-relevant evidence only. Do not ask about sensitive personal traits and do not make hiring decisions."""
        client = genai.Client(api_key=api_key)
        model = os.getenv("INTERVIEW_LLM_MODEL", "gemini-2.5-flash-lite")
        generation_config: dict[str, Any] = {
            "response_mime_type": "application/json",
            "response_schema": LlmQuestion,
            "temperature": 0.4,
        }
        if model.startswith("gemini-2.5-"):
            generation_config["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
        started_at = time.perf_counter()
        for attempt in range(2):
            retry_instruction = "" if attempt == 0 else "\nYour previous output duplicated an earlier question. Use a substantially different topic and wording."
            response = client.models.generate_content(
                model=model,
                contents=prompt + retry_instruction,
                config=types.GenerateContentConfig(**generation_config),
            )
            if not response.text:
                continue
            generated = LlmQuestion.model_validate_json(response.text)
            if (
                question_is_duplicate(generated.text, interview)
                or UUID_PATTERN.search(generated.text)
                or OPAQUE_TOKEN_PATTERN.search(generated.text)
            ):
                logger.warning("Gemini returned an invalid or duplicate interview question on attempt %s", attempt + 1)
                continue
            competency = generated.competency
            if competency not in interview.config.competencies:
                competency = interview.config.competencies[len(interview.turns) % len(interview.config.competencies)]
            logger.info("Gemini generated question %s in %.2fs", len(interview.turns) + 1, time.perf_counter() - started_at)
            return Question(number=len(interview.turns) + 1, text=generated.text, competency=competency, source="llm")
    except Exception as exc:  # noqa: BLE001 - a provider failure must not stop an interview.
        logger.warning("LLM follow-up failed; falling back: %s", exc)
    return None


def next_question(interview: OnlineInterview) -> Question | None:
    number = len(interview.turns) + 1
    if number > interview.config.max_questions:
        return None
    if number <= len(interview.config.opening_questions):
        return Question(number=number, competency="introduction" if number == 1 else "motivation", source="opening", text=interview.config.opening_questions[number - 1])
    generated = llm_question(interview)
    if generated:
        logger.info("Question %s generated by Gemini", number)
        return generated
    logger.warning("Question %s is using the deterministic fallback", number)
    return fallback_question(interview)


def supabase_auth_headers() -> dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase Auth OTP chưa được cấu hình trên Interview Service",
        )
    return {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": f"Bearer {SUPABASE_PUBLISHABLE_KEY}",
        "Content-Type": "application/json",
    }


def send_supabase_auth_otp(email: str) -> str:
    try:
        response = httpx.post(
            f"{SUPABASE_URL.rstrip('/')}/auth/v1/otp",
            headers=supabase_auth_headers(),
            json={"email": email, "create_user": False},
            timeout=15,
        )
    except httpx.HTTPError as exc:
        logger.warning("Supabase Auth OTP delivery failed: %s", exc)
        raise HTTPException(status_code=502, detail="Supabase Auth hiện không phản hồi") from exc
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Vui lòng chờ trước khi yêu cầu mã OTP mới")
    if not response.is_success:
        logger.warning("Supabase Auth OTP delivery rejected with status %s", response.status_code)
        raise HTTPException(
            status_code=502,
            detail="Không thể gửi OTP qua Supabase Auth. Hãy kiểm tra tài khoản ứng viên và email template.",
        )
    return "supabase_auth"


def verify_supabase_auth_otp(email: str, code: str) -> bool:
    try:
        response = httpx.post(
            f"{SUPABASE_URL.rstrip('/')}/auth/v1/verify",
            headers=supabase_auth_headers(),
            json={"email": email, "token": code, "type": "email"},
            timeout=15,
        )
    except httpx.HTTPError as exc:
        logger.warning("Supabase Auth OTP verification failed: %s", exc)
        raise HTTPException(status_code=502, detail="Supabase Auth hiện không phản hồi") from exc
    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Bạn đã xác thực quá nhiều lần. Vui lòng thử lại sau")
    if response.status_code in {400, 401, 403}:
        return False
    if not response.is_success:
        logger.warning("Supabase Auth OTP verification rejected with status %s", response.status_code)
        raise HTTPException(status_code=502, detail="Không thể xác thực OTP qua Supabase Auth")
    return True


def send_smtp_otp(interview: OnlineInterview, otp: str) -> str:
    smtp_host = os.getenv("INTERVIEW_SMTP_HOST", "").strip()
    if not smtp_host:
        logger.warning("DEV OTP for %s: %s", interview.candidate.email, otp)
        return "console"
    username = os.getenv("INTERVIEW_SMTP_USERNAME", "").strip()
    password = os.getenv("INTERVIEW_SMTP_PASSWORD", "")
    sender_email = os.getenv("INTERVIEW_SMTP_FROM", "").strip() or username
    sender_name = os.getenv("INTERVIEW_SMTP_FROM_NAME", "AI Recruitment").strip()
    if not sender_email:
        raise HTTPException(status_code=503, detail="SMTP chưa cấu hình địa chỉ người gửi")
    message = EmailMessage()
    message["Subject"] = "Mã xác thực phỏng vấn AI"
    message["From"] = formataddr((sender_name, sender_email))
    message["To"] = interview.candidate.email
    message.set_content(f"Mã OTP của bạn là {otp}. Mã có hiệu lực trong 5 phút.")
    try:
        with smtplib.SMTP(
            smtp_host,
            int(os.getenv("INTERVIEW_SMTP_PORT", "587")),
            timeout=float(os.getenv("INTERVIEW_SMTP_TIMEOUT_SECONDS", "15")),
        ) as smtp:
            smtp.ehlo()
            smtp.starttls(context=ssl.create_default_context())
            smtp.ehlo()
            if username:
                smtp.login(username, password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.warning("OTP email delivery failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Không thể gửi email OTP. Vui lòng thử lại sau hoặc liên hệ HR.",
        ) from exc
    return "email"


def send_otp(interview: OnlineInterview, otp: str | None) -> str:
    if OTP_PROVIDER == "supabase_auth":
        return send_supabase_auth_otp(interview.candidate.email)
    if OTP_PROVIDER == "smtp":
        if otp is None:
            raise HTTPException(status_code=500, detail="Không thể tạo OTP")
        return send_smtp_otp(interview, otp)
    if OTP_PROVIDER == "console":
        if otp is None:
            raise HTTPException(status_code=500, detail="Không thể tạo OTP")
        logger.warning("DEV OTP for %s: %s", interview.candidate.email, otp)
        return "console"
    raise HTTPException(
        status_code=503,
        detail="INTERVIEW_OTP_PROVIDER phải là 'supabase_auth', 'smtp' hoặc 'console'",
    )


@router.post("/v1/internal/interviews", response_model=CreateInterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(request: CreateInterviewRequest, _: None = Depends(require_system_key)) -> CreateInterviewResponse:
    launch_token = secrets.token_urlsafe(32)
    interview = OnlineInterview(
        id=str(uuid4()), recruitment_application_id=request.recruitment_application_id,
        candidate=request.candidate, cv=request.cv, jd=request.jd, config=request.config,
        callback_url=request.callback_url, launch_token_hash=digest(launch_token, "INTERVIEW_LAUNCH_TOKEN_SECRET"),
        expires_at=now() + timedelta(hours=request.expires_in_hours),
    )
    store.save(interview)
    origin = os.getenv("INTERVIEW_WEB_ORIGIN", DEFAULT_WEB_ORIGIN).rstrip("/")
    return CreateInterviewResponse(interview_id=interview.id, launch_url=f"{origin}/?launch={launch_token}", expires_at=interview.expires_at, status=interview.status)


@router.get("/v1/internal/interviews/{interview_id}/report")
def get_report(interview_id: str, _: None = Depends(require_system_key)) -> dict[str, Any]:
    interview = store.get(interview_id); expire_if_needed(interview)
    result = report_payload(interview)
    result["callback"] = {
        "status": interview.callback_status,
        "event_id": interview.callback_event_id,
        "attempts": interview.callback_attempts,
        "next_attempt_at": interview.callback_next_attempt_at,
        "last_attempt_at": interview.callback_last_attempt_at,
        "delivered_at": interview.callback_delivered_at,
        "last_error": interview.callback_last_error,
    }
    return result


@router.post("/v1/internal/interviews/{interview_id}/callback/retry", status_code=status.HTTP_202_ACCEPTED)
def retry_callback(interview_id: str, _: None = Depends(require_system_key)) -> dict[str, Any]:
    interview = store.get(interview_id)
    if interview.status not in {"COMPLETED", "TERMINATED", "EXPIRED"}:
        raise HTTPException(status_code=409, detail="Chỉ retry callback cho phiên đã kết thúc")
    if not interview.callback_url:
        raise HTTPException(status_code=409, detail="Phiên không có callback_url")
    interview.callback_status = "PENDING"
    interview.callback_event_id = interview.callback_event_id or str(uuid4())
    interview.callback_attempts = 0
    interview.callback_next_attempt_at = now()
    interview.callback_last_attempt_at = None
    interview.callback_delivered_at = None
    interview.callback_last_error = None
    store.save(interview)
    return {"status": "PENDING", "event_id": interview.callback_event_id}


@router.get("/v1/internal/interviews/{interview_id}/videos/{video_id}")
def download_video(interview_id: str, video_id: str, _: None = Depends(require_system_key)) -> Response:
    interview = store.get(interview_id)
    asset = next((video for video in interview.videos if video.id == video_id), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Không tìm thấy video")
    content = media_storage.download(asset.path)
    if content is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy video")
    extension = ".mp4" if asset.content_type == "video/mp4" else ".webm"
    filename = f"interview-{interview.id}-question-{asset.question_number}{extension}"
    return Response(content=content, media_type=asset.content_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/v1/internal/interviews/{interview_id}/videos/{video_id}/playback")
def get_video_playback_url(interview_id: str, video_id: str, _: None = Depends(require_system_key)) -> dict[str, Any]:
    interview = store.get(interview_id)
    asset = next((video for video in interview.videos if video.id == video_id), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Không tìm thấy video")
    expires_in = 15 * 60
    url = media_storage.create_playback_url(asset.path, expires_in)
    return {"url": url, "expires_in": expires_in if url else 0}


@router.get("/v1/public/launch/{launch_token}")
def inspect_launch(launch_token: str) -> dict[str, Any]:
    interview = store.find_by_launch_token(launch_token); expire_if_needed(interview)
    if interview.link_consumed:
        raise HTTPException(status_code=410, detail="Link phỏng vấn đã được sử dụng")
    if interview.status == "EXPIRED":
        raise HTTPException(status_code=410, detail="Link phỏng vấn đã hết hạn")
    return {
        "candidate_name": interview.candidate.display_name,
        "job_title": str(interview.jd.get("title", "vị trí đã ứng tuyển")),
        "max_questions": interview.config.max_questions,
        "expires_at": interview.expires_at,
    }


@router.post("/v1/public/launch/{launch_token}/otp")
def request_otp(launch_token: str, request: OtpRequest) -> dict[str, str]:
    interview = store.find_by_launch_token(launch_token); expire_if_needed(interview)
    if interview.link_consumed or interview.status == "EXPIRED" or request.email.lower() != interview.candidate.email.lower():
        raise HTTPException(status_code=400, detail="Không thể gửi OTP cho link này")
    otp = None if OTP_PROVIDER == "supabase_auth" else f"{secrets.randbelow(1_000_000):06d}"
    delivery = send_otp(interview, otp)
    interview.otp_hash = digest(otp, "INTERVIEW_OTP_SECRET") if otp else None
    interview.otp_expires_at, interview.otp_attempts = now() + timedelta(minutes=5), 0
    interview.status = "AWAITING_OTP"
    store.save(interview)
    return {"delivery": delivery}


@router.post("/v1/public/launch/{launch_token}/verify")
def verify_otp(launch_token: str, request: VerifyOtpRequest) -> dict[str, Any]:
    interview = store.find_by_launch_token(launch_token); expire_if_needed(interview)
    if interview.link_consumed or interview.status == "EXPIRED" or request.email.lower() != interview.candidate.email.lower():
        raise HTTPException(status_code=400, detail="Không thể xác thực link này")
    if not interview.otp_expires_at or now() > interview.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP đã hết hạn")
    interview.otp_attempts += 1
    if interview.otp_attempts > 5:
        store.save(interview)
        raise HTTPException(status_code=429, detail="Bạn đã nhập OTP sai quá số lần cho phép")
    store.save(interview)
    if OTP_PROVIDER == "supabase_auth":
        valid_otp = verify_supabase_auth_otp(interview.candidate.email, request.code)
    else:
        valid_otp = bool(interview.otp_hash) and hmac.compare_digest(
            interview.otp_hash,
            digest(request.code, "INTERVIEW_OTP_SECRET"),
        )
    if not valid_otp:
        raise HTTPException(status_code=400, detail="OTP không đúng")
    interview.link_consumed, interview.status = True, "VERIFIED"
    store.save(interview)
    return {"access_token": encode_access_token(interview.id, min(interview.expires_at, now() + timedelta(hours=3))), "expires_at": interview.expires_at}


@router.post("/v1/participant/start")
def start_interview(request: Request) -> dict[str, Any]:
    interview = participant_from_request(request)
    if interview.status != "VERIFIED":
        raise HTTPException(status_code=409, detail="Phiên đã bắt đầu hoặc đã kết thúc")
    interview.status, interview.started_at, interview.last_heartbeat_at = "IN_PROGRESS", now(), now()
    interview.active_question = next_question(interview)
    store.save(interview)
    return {"question": interview.active_question, "prepare_seconds": 5, "answer_seconds": 60}


@router.post("/v1/participant/heartbeat")
def heartbeat(request: Request) -> dict[str, str]:
    interview = participant_from_request(request)
    if interview.status != "IN_PROGRESS": raise HTTPException(status_code=409, detail="Phiên không còn đang diễn ra")
    interview.last_heartbeat_at = now()
    store.save(interview)
    return {"status": "ok"}


@router.post("/v1/participant/speech/transcribe")
async def transcribe_answer(request: Request) -> dict[str, str]:
    """Accept a browser-generated 16 kHz mono PCM WAV answer; never expose provider keys."""
    interview = participant_from_request(request)
    if interview.status != "IN_PROGRESS" or not interview.active_question:
        raise HTTPException(status_code=409, detail="Không có câu hỏi đang chờ trả lời")
    content_type = request.headers.get("content-type", "").lower()
    if not content_type.startswith("audio/wav"):
        raise HTTPException(status_code=415, detail="Speech-to-Text yêu cầu audio WAV PCM 16 kHz mono")
    try:
        question_number = int(request.headers.get("x-interview-question-number", ""))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Thiếu question number") from exc
    if question_number != interview.active_question.number:
        raise HTTPException(status_code=409, detail="Audio không thuộc câu hỏi hiện tại")
    audio = await request.body()
    if not audio or len(audio) > MAX_SPEECH_BYTES:
        raise HTTPException(status_code=413, detail="Audio rỗng hoặc vượt giới hạn Speech-to-Text")
    require_speech()
    return {"text": await transcribe_speech(audio)}


@router.post("/v1/participant/speech/synthesize")
async def synthesize_question(request: Request, body: SynthesisRequest) -> Response:
    """Read only the active server-issued question, preventing arbitrary TTS use."""
    interview = participant_from_request(request)
    if interview.status != "IN_PROGRESS" or not interview.active_question:
        raise HTTPException(status_code=409, detail="Không có câu hỏi đang chờ trả lời")
    if body.question_number != interview.active_question.number:
        raise HTTPException(status_code=409, detail="Không thể đọc câu hỏi không thuộc phiên hiện tại")
    require_speech()
    audio = await synthesize_speech(interview.active_question.text)
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})


@router.post("/v1/participant/answers")
def submit_answer(request: Request, body: AnswerRequest) -> dict[str, Any]:
    interview = participant_from_request(request)
    if interview.status != "IN_PROGRESS" or not interview.active_question: raise HTTPException(status_code=409, detail="Không có câu hỏi đang chờ trả lời")
    interview.turns.append(Turn(question=interview.active_question, transcript=body.text, answered_at=now()))
    interview.active_question = next_question(interview)
    if interview.active_question is None:
        interview.status, interview.completed_at = "COMPLETED", now()
        mark_callback_pending(interview)
    store.save(interview)
    return {"status": interview.status, "question": interview.active_question, "prepare_seconds": 5, "answer_seconds": 60}


@router.post("/v1/participant/terminate")
def terminate(request: Request, body: TerminateRequest) -> dict[str, str]:
    interview = participant_from_request(request)
    if interview.status != "IN_PROGRESS":
        raise HTTPException(status_code=409, detail="Phiên không còn đang diễn ra")
    interview.status, interview.termination_reason, interview.completed_at = "TERMINATED", body.reason, now()
    interview.active_question = None; interview.events.append(SecurityEvent(type=body.reason, happened_at=now()))
    mark_callback_pending(interview)
    store.save(interview)
    return {"status": "TERMINATED"}


@router.post("/v1/participant/videos", status_code=status.HTTP_202_ACCEPTED)
async def upload_video(request: Request) -> dict[str, Any]:
    interview = participant_from_request(request)
    try: question_number = int(request.headers.get("x-interview-question-number", ""))
    except ValueError as exc: raise HTTPException(status_code=422, detail="Thiếu question number") from exc
    upload_id = request.headers.get("x-interview-upload-id", "").strip()
    if not upload_id or len(upload_id) > 100:
        upload_id = str(uuid4())
    existing = next((video for video in interview.videos if video.id == upload_id), None)
    if existing:
        return {"status": "stored", "size_bytes": existing.size_bytes}
    content_type = request.headers.get("content-type", "").split(";", 1)[0].lower()
    extension = {"video/webm": ".webm", "video/mp4": ".mp4"}.get(content_type)
    if not extension: raise HTTPException(status_code=415, detail="Chỉ hỗ trợ WebM hoặc MP4")
    object_key, size = await media_storage.upload(interview.id, question_number, extension, content_type, request)
    interview.videos.append(VideoAsset(id=upload_id, question_number=question_number, path=object_key, content_type=content_type, size_bytes=size, created_at=now()))
    if interview.callback_status == "PENDING":
        interview.callback_next_attempt_at = now()
    store.save(interview)
    return {"status": "stored", "size_bytes": size}
