"""Normalize and bound untrusted document text before LLM extraction."""

import re
import unicodedata
from collections import Counter

from app.domain.resume.exceptions import ResumeValidationError

MIN_TEXT_LENGTH = 50
MAX_TEXT_LENGTH = 15_000
CONTROL_CHARACTERS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def preprocess_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    normalized = CONTROL_CHARACTERS.sub("", normalized)
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)

    lines = normalized.splitlines()
    frequencies = Counter(line.strip() for line in lines if line.strip())
    normalized = "\n".join(
        line for line in lines if frequencies.get(line.strip(), 0) <= 3
    ).strip()

    if len(normalized) < MIN_TEXT_LENGTH:
        raise ResumeValidationError(
            f"Extracted text is too short ({len(normalized)} chars). "
            "The document may be empty or require OCR."
        )
    return normalized[:MAX_TEXT_LENGTH]
