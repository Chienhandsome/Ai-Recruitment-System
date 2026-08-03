"""Validate request metadata and downloaded document boundaries."""

from app.domain.resume.exceptions import ResumeValidationError

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
SUPPORTED_MIME_TYPES = frozenset({PDF_MIME, DOCX_MIME})


def validate_resume_file(file_bytes: bytes, declared_mime_type: str) -> None:
    if declared_mime_type not in SUPPORTED_MIME_TYPES:
        raise ResumeValidationError(f"Unsupported MIME type: {declared_mime_type}")
    if not file_bytes:
        raise ResumeValidationError("Downloaded resume file is empty")
