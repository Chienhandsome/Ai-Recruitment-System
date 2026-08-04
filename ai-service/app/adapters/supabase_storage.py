"""Supabase implementation of the resume storage port."""

import logging
from urllib.parse import urlsplit

import httpx
from supabase import create_client

from app.core.config import settings
from app.domain.resume.exceptions import (
    PermanentError,
    SignedUrlExpiredError,
    TransientError,
)
from app.domain.resume.steps.file_validator import MAX_FILE_BYTES

logger = logging.getLogger(__name__)


class SupabaseStorageAdapter:
    def __init__(self, url: str, service_role_key: str, bucket: str) -> None:
        self._url = url
        self._service_role_key = service_role_key
        self._bucket = bucket

    @classmethod
    def from_settings(cls) -> "SupabaseStorageAdapter":
        return cls(
            settings.supabase_url,
            settings.supabase_service_role_key,
            settings.supabase_storage_bucket,
        )

    def download(self, object_path: str, signed_url: str | None = None) -> bytes:
        if not object_path:
            raise PermanentError("Resume object path is empty")

        if signed_url:
            return self._download_signed_url(signed_url)

        if not self._url or not self._service_role_key:
            raise PermanentError(
                "Signed URL missing and Supabase fallback credentials unavailable"
            )

        try:
            client = create_client(self._url, self._service_role_key)
            response = client.storage.from_(self._bucket).download(object_path)
        except Exception as exc:
            raise TransientError(f"Resume download failed: {exc}") from exc

        if not response:
            raise PermanentError(f"Resume file is empty or missing: {object_path}")
        if len(response) > MAX_FILE_BYTES:
            raise PermanentError("Resume download exceeds 5MB")

        logger.info("Downloaded %d bytes from %s", len(response), object_path)
        return response

    def _download_signed_url(self, signed_url: str) -> bytes:
        self._validate_signed_url(signed_url)
        try:
            with httpx.stream(
                "GET",
                signed_url,
                timeout=30,
                follow_redirects=False,
            ) as response:
                if response.status_code in (401, 403):
                    raise SignedUrlExpiredError(
                        f"Signed resume download returned {response.status_code}"
                    )
                if response.status_code >= 500:
                    raise TransientError(
                        f"Signed resume download returned {response.status_code}"
                    )
                if response.status_code >= 400:
                    raise PermanentError(
                        f"Signed resume download returned {response.status_code}"
                    )
                if 300 <= response.status_code < 400:
                    raise PermanentError(
                        "Signed resume download redirected unexpectedly"
                    )

                content_length = response.headers.get("content-length")
                if content_length:
                    try:
                        declared_size = int(content_length)
                    except ValueError as exc:
                        raise PermanentError(
                            "Signed resume download returned an invalid Content-Length"
                        ) from exc
                    if declared_size < 0:
                        raise PermanentError(
                            "Signed resume download returned an invalid Content-Length"
                        )
                    if declared_size > MAX_FILE_BYTES:
                        raise PermanentError("Signed resume download exceeds 5MB")

                content = bytearray()
                for chunk in response.iter_bytes():
                    content.extend(chunk)
                    if len(content) > MAX_FILE_BYTES:
                        raise PermanentError("Signed resume download exceeds 5MB")
        except httpx.RequestError as exc:
            raise TransientError(f"Signed resume download failed: {exc}") from exc

        if not content:
            raise PermanentError("Signed resume download returned an empty file")
        return bytes(content)

    def _validate_signed_url(self, signed_url: str) -> None:
        expected = urlsplit(self._url)
        actual = urlsplit(signed_url)
        if not expected.hostname:
            raise PermanentError(
                "SUPABASE_URL is required to validate signed download URLs"
            )
        if actual.username or actual.password:
            raise PermanentError("Signed download URL must not contain credentials")
        if actual.scheme != expected.scheme or actual.netloc != expected.netloc:
            raise PermanentError("Signed download URL origin does not match Supabase")
        if actual.scheme != "https" and expected.hostname not in {
            "localhost",
            "127.0.0.1",
            "::1",
        }:
            raise PermanentError("Signed download URL must use HTTPS")
