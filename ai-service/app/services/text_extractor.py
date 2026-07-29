"""Extract text content from PDF and DOCX files."""

import io
import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file buffer."""
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)

        full_text = "\n\n".join(pages_text)
        logger.info(f"Extracted {len(full_text)} characters from PDF ({len(reader.pages)} pages)")
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {e}")
        raise ValueError(f"PDF text extraction failed: {e}") from e


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file buffer."""
    from docx import Document

    try:
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n".join(paragraphs)
        logger.info(f"Extracted {len(full_text)} characters from DOCX ({len(paragraphs)} paragraphs)")
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from DOCX: {e}")
        raise ValueError(f"DOCX text extraction failed: {e}") from e


def extract_text(file_bytes: bytes, mime_type: str) -> str:
    """Extract text based on MIME type."""
    if mime_type == "application/pdf":
        return extract_text_from_pdf(file_bytes)
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported MIME type: {mime_type}")
