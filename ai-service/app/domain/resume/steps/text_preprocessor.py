"""Boundary for text preparation before model extraction."""

from app.domain.resume.exceptions import ResumeValidationError

MIN_TEXT_LENGTH = 50


def preprocess_text(text: str) -> str:
    """Validate existing extraction output without changing its content.

    Normalization and truncation are intentionally separate feature work; keeping
    this step behavior-neutral makes the structural refactor regression-safe.
    """
    if len(text.strip()) < MIN_TEXT_LENGTH:
        raise ResumeValidationError(
            f"Extracted text is too short ({len(text)} chars). "
            "The file may be scanned/image-based or empty."
        )
    return text
