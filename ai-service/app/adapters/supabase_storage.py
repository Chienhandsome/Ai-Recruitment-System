"""Supabase implementation of the resume storage port."""

import logging

from supabase import create_client

from app.core.config import settings
from app.domain.resume.exceptions import PermanentError, TransientError

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

    def download(self, object_path: str) -> bytes:
        if not self._url or not self._service_role_key:
            raise PermanentError("Supabase credentials are not configured")
        if not object_path:
            raise PermanentError("Resume object path is empty")

        try:
            client = create_client(self._url, self._service_role_key)
            response = client.storage.from_(self._bucket).download(object_path)
        except Exception as exc:
            raise TransientError(f"Resume download failed: {exc}") from exc

        if not response:
            raise PermanentError(f"Resume file is empty or missing: {object_path}")

        logger.info("Downloaded %d bytes from %s", len(response), object_path)
        return response
