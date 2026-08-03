"""Transport-agnostic inputs used by the resume domain."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ResumeParseCommand:
    resume_id: str
    candidate_profile_id: str
    object_path: str
    mime_type: str
    original_file_name: str
    signed_download_url: str | None = None
