from types import SimpleNamespace

import httpx
import pytest

from app.adapters import supabase_storage
from app.adapters.supabase_storage import SupabaseStorageAdapter
from app.domain.resume.exceptions import PermanentError, TransientError


def test_download_uses_signed_url_without_service_role(monkeypatch):
    response = SimpleNamespace(status_code=200, content=b"resume")

    def get(*args, **kwargs):
        return response

    monkeypatch.setattr(supabase_storage.httpx, "get", get)
    adapter = SupabaseStorageAdapter("", "", "resumes")

    assert adapter.download("candidate/resume.pdf", "https://signed") == b"resume"


@pytest.mark.parametrize(
    ("status_code", "error_type"),
    [(403, PermanentError), (503, TransientError)],
)
def test_signed_url_classifies_http_failures(
    monkeypatch,
    status_code,
    error_type,
):
    response = SimpleNamespace(status_code=status_code, content=b"error")
    monkeypatch.setattr(
        supabase_storage.httpx,
        "get",
        lambda *args, **kwargs: response,
    )
    adapter = SupabaseStorageAdapter("", "", "resumes")

    with pytest.raises(error_type):
        adapter.download("candidate/resume.pdf", "https://signed")


def test_signed_url_treats_transport_failures_as_transient(monkeypatch):
    def fail(*args, **kwargs):
        raise httpx.ReadError(
            "connection dropped",
            request=httpx.Request("GET", "https://signed"),
        )

    monkeypatch.setattr(supabase_storage.httpx, "get", fail)
    adapter = SupabaseStorageAdapter("", "", "resumes")

    with pytest.raises(TransientError):
        adapter.download("candidate/resume.pdf", "https://signed")
