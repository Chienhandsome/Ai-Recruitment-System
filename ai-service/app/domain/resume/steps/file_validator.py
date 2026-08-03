"""Validate resume metadata and document signatures before parsing."""

import io
import zipfile

from app.domain.resume.exceptions import ResumeValidationError

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
SUPPORTED_MIME_TYPES = frozenset({PDF_MIME, DOCX_MIME})
MAX_FILE_BYTES = 5 * 1024 * 1024


def detect_real_mime(file_bytes: bytes) -> str:
    if file_bytes.startswith(b"%PDF-"):
        return PDF_MIME

    if file_bytes.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
                if "word/document.xml" in archive.namelist():
                    return DOCX_MIME
        except zipfile.BadZipFile as exc:
            raise ResumeValidationError("Invalid DOCX archive") from exc

    raise ResumeValidationError("File format is not recognized or supported")


def validate_resume_file(file_bytes: bytes, declared_mime_type: str) -> str:
    if declared_mime_type not in SUPPORTED_MIME_TYPES:
        raise ResumeValidationError(f"Unsupported MIME type: {declared_mime_type}")
    if not file_bytes:
        raise ResumeValidationError("Downloaded resume file is empty")
    if len(file_bytes) > MAX_FILE_BYTES:
        raise ResumeValidationError("Resume exceeds the 5MB size limit")

    detected_mime = detect_real_mime(file_bytes)
    if detected_mime != declared_mime_type:
        raise ResumeValidationError(
            f"Declared MIME {declared_mime_type} does not match {detected_mime}"
        )
    return detected_mime
