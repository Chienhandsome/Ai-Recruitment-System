"""Compatibility exports for the text extraction domain step."""

from app.domain.resume.steps.text_extractor import (
    extract_text,
    extract_text_from_docx,
    extract_text_from_pdf,
)

__all__ = ["extract_text", "extract_text_from_docx", "extract_text_from_pdf"]
