# pyrefly: ignore [missing-import]
import pytest


def determine_match_level(score: float) -> str:
    """Helper match level function following exact boundary rules."""
    if score >= 75.0:
        return "HIGH"
    elif score >= 50.0:
        return "MEDIUM"
    return "LOW"


@pytest.mark.unit
@pytest.mark.parametrize(
    ("score", "expected_level"),
    [
        (0.0, "LOW"),
        (25.5, "LOW"),
        (49.99, "LOW"),
        (50.0, "MEDIUM"),
        (65.0, "MEDIUM"),
        (74.99, "MEDIUM"),
        (75.0, "HIGH"),
        (85.5, "HIGH"),
        (100.0, "HIGH"),
    ],
)
def test_match_level_boundaries(score: float, expected_level: str):
    assert determine_match_level(score) == expected_level
