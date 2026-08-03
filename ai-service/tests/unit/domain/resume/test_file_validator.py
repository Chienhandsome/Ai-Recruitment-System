import io
import zipfile

import pytest

from app.domain.resume.exceptions import ResumeValidationError
from app.domain.resume.steps.file_validator import (
    DOCX_MIME,
    PDF_MIME,
    detect_real_mime,
    validate_resume_file,
)


def _docx_signature() -> bytes:
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr("word/document.xml", "<document />")
    return stream.getvalue()


def test_detects_pdf_and_real_docx_signatures():
    assert detect_real_mime(b"%PDF-1.7\n") == PDF_MIME
    assert detect_real_mime(_docx_signature()) == DOCX_MIME


def test_rejects_declared_mime_mismatch_and_generic_zip():
    with pytest.raises(ResumeValidationError, match="does not match"):
        validate_resume_file(b"%PDF-1.7\n", DOCX_MIME)

    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w") as archive:
        archive.writestr("notes.txt", "not a docx")
    with pytest.raises(ResumeValidationError, match="not recognized"):
        detect_real_mime(stream.getvalue())
