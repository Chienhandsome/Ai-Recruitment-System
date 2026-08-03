import pytest

from app.domain.resume.exceptions import ResumeValidationError
from app.domain.resume.steps.text_preprocessor import (
    MAX_TEXT_LENGTH,
    preprocess_text,
)


def test_preprocessor_normalizes_and_removes_repeated_lines():
    repeated_header = "CONFIDENTIAL"
    text = (
        "Nguyễn  Văn\x00 A\n"
        + ((repeated_header + "\n") * 4)
        + "Python\tFastAPI " * 8
    )

    result = preprocess_text(text)

    assert result.startswith("Nguyễn Văn A")
    assert repeated_header not in result
    assert "\x00" not in result
    assert "  " not in result


def test_preprocessor_truncates_oversized_text():
    assert len(preprocess_text("A" * (MAX_TEXT_LENGTH + 50))) == MAX_TEXT_LENGTH


def test_preprocessor_rejects_empty_or_scanned_output():
    with pytest.raises(ResumeValidationError, match="too short"):
        preprocess_text("short")
