import pytest

import worker_main
from app.workers import resume_worker


def test_worker_entrypoint_starts_resume_and_evaluation_consumers():
    worker_names = {name for name, _target in worker_main.WORKER_TARGETS}

    assert worker_names == {"resume-analysis", "application-evaluation"}


def test_resume_worker_fails_fast_when_required_settings_are_missing(monkeypatch):
    monkeypatch.setattr(resume_worker.settings, "gemini_api_key", "")
    monkeypatch.setattr(resume_worker.settings, "supabase_url", "")

    with pytest.raises(
        RuntimeError,
        match="GEMINI_API_KEY, SUPABASE_URL",
    ):
        resume_worker.validate_worker_settings()


def test_resume_worker_accepts_complete_required_settings(monkeypatch):
    monkeypatch.setattr(resume_worker.settings, "gemini_api_key", "configured")
    monkeypatch.setattr(
        resume_worker.settings,
        "supabase_url",
        "https://example.supabase.co",
    )

    resume_worker.validate_worker_settings()
