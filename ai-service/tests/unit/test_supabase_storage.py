import httpx
import pytest

from app.adapters import supabase_storage
from app.adapters.supabase_storage import SupabaseStorageAdapter
from app.domain.resume.exceptions import (
    PermanentError,
    SignedUrlExpiredError,
    TransientError,
)
from app.domain.resume.steps.file_validator import MAX_FILE_BYTES

SUPABASE_URL = "https://project.supabase.co"
SIGNED_URL = f"{SUPABASE_URL}/storage/v1/object/sign/resumes/cv.pdf?token=x"


class FakeStreamResponse:
    def __init__(
        self,
        status_code: int = 200,
        chunks: list[bytes] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status_code = status_code
        self._chunks = chunks or [b"resume"]
        self.headers = headers or {}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def iter_bytes(self):
        yield from self._chunks


def test_download_uses_validated_signed_url_without_service_role(monkeypatch):
    monkeypatch.setattr(
        supabase_storage.httpx,
        "stream",
        lambda *args, **kwargs: FakeStreamResponse(),
    )
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "", "resumes")

    assert adapter.download("candidate/resume.pdf", SIGNED_URL) == b"resume"


@pytest.mark.parametrize(
    ("status_code", "error_type"),
    [
        (400, SignedUrlExpiredError),
        (401, SignedUrlExpiredError),
        (403, SignedUrlExpiredError),
        (503, TransientError),
    ],
)
def test_signed_url_classifies_http_failures(
    monkeypatch,
    status_code,
    error_type,
):
    monkeypatch.setattr(
        supabase_storage.httpx,
        "stream",
        lambda *args, **kwargs: FakeStreamResponse(status_code=status_code),
    )
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "", "resumes")

    with pytest.raises(error_type):
        adapter.download("candidate/resume.pdf", SIGNED_URL)


def test_expired_signed_url_falls_back_to_service_role_download(monkeypatch):
    monkeypatch.setattr(
        supabase_storage.httpx,
        "stream",
        lambda *args, **kwargs: FakeStreamResponse(status_code=400),
    )

    downloaded_paths: list[str] = []

    class FakeBucket:
        def download(self, object_path: str) -> bytes:
            downloaded_paths.append(object_path)
            return b"fresh resume"

    class FakeStorage:
        def from_(self, bucket: str) -> FakeBucket:
            assert bucket == "resumes"
            return FakeBucket()

    class FakeClient:
        storage = FakeStorage()

    monkeypatch.setattr(
        supabase_storage,
        "create_client",
        lambda url, key: FakeClient(),
    )
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "service-role", "resumes")

    result = adapter.download("candidate/resume.pdf", SIGNED_URL)

    assert result == b"fresh resume"
    assert downloaded_paths == ["candidate/resume.pdf"]


def test_signed_url_treats_transport_failures_as_transient(monkeypatch):
    def fail(*args, **kwargs):
        raise httpx.ReadError(
            "connection dropped",
            request=httpx.Request("GET", SIGNED_URL),
        )

    monkeypatch.setattr(supabase_storage.httpx, "stream", fail)
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "", "resumes")

    with pytest.raises(TransientError):
        adapter.download("candidate/resume.pdf", SIGNED_URL)


def test_signed_url_rejects_other_origins_before_request(monkeypatch):
    stream = pytest.fail
    monkeypatch.setattr(supabase_storage.httpx, "stream", stream)
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "", "resumes")

    with pytest.raises(PermanentError, match="origin"):
        adapter.download("candidate/resume.pdf", "https://attacker.example/cv")


def test_signed_url_stream_is_bounded_to_file_limit(monkeypatch):
    monkeypatch.setattr(
        supabase_storage.httpx,
        "stream",
        lambda *args, **kwargs: FakeStreamResponse(
            chunks=[b"A" * MAX_FILE_BYTES, b"B"]
        ),
    )
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "", "resumes")

    with pytest.raises(PermanentError, match="exceeds 5MB"):
        adapter.download("candidate/resume.pdf", SIGNED_URL)


def test_signed_url_rejects_invalid_content_length(monkeypatch):
    monkeypatch.setattr(
        supabase_storage.httpx,
        "stream",
        lambda *args, **kwargs: FakeStreamResponse(
            headers={"content-length": "not-a-number"}
        ),
    )
    adapter = SupabaseStorageAdapter(SUPABASE_URL, "", "resumes")

    with pytest.raises(PermanentError, match="invalid Content-Length"):
        adapter.download("candidate/resume.pdf", SIGNED_URL)
