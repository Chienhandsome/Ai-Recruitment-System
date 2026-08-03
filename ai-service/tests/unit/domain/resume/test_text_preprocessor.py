import pytest

from app.domain.resume.exceptions import ResumeValidationError
from app.domain.resume.steps.text_preprocessor import preprocess_text


def test_preprocessor_preserves_valid_text_during_structural_refactor():
    text = "Experience\n" + ("Python " * 10)
    assert preprocess_text(text) == text


def test_preprocessor_rejects_empty_or_scanned_output():
    with pytest.raises(ResumeValidationError, match="too short"):
        preprocess_text("short")
