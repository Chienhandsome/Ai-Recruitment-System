"""Extract plain text from supported resume documents."""

import io
import logging

from app.domain.resume.exceptions import ResumeValidationError
from app.domain.resume.steps.file_validator import DOCX_MIME, PDF_MIME

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = [text for page in reader.pages if (text := page.extract_text())]
        result = "\n\n".join(pages_text)
        logger.info(
            "Extracted %d characters from PDF (%d pages)",
            len(result),
            len(reader.pages),
        )
        return result
    except Exception as exc:
        raise ResumeValidationError(f"PDF text extraction failed: {exc}") from exc


def extract_text_from_docx(file_bytes: bytes) -> str:
    from docx import Document

    try:
        document = Document(io.BytesIO(file_bytes))
        paragraphs = [
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        ]
        result = "\n".join(paragraphs)
        logger.info(
            "Extracted %d characters from DOCX (%d paragraphs)",
            len(result),
            len(paragraphs),
        )
        return result
    except Exception as exc:
        raise ResumeValidationError(f"DOCX text extraction failed: {exc}") from exc


def extract_text(file_bytes: bytes, mime_type: str) -> str:
    if mime_type == PDF_MIME:
        return extract_text_from_pdf(file_bytes)
    if mime_type == DOCX_MIME:
        return extract_text_from_docx(file_bytes)
    raise ResumeValidationError(f"Unsupported MIME type: {mime_type}")
