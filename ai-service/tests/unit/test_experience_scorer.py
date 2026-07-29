# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import JobPayload, WorkExperience
# pyrefly: ignore [missing-import]
from app.services.matching.experience_matcher import ExperienceMatcher


@pytest.mark.unit
def test_no_experience_required_job():
    matcher = ExperienceMatcher()
    job = JobPayload(title="DevOps Intern", required_experience_years=0.0)
    experiences = []

    score, strengths, gaps = matcher.evaluate(experiences, job)
    assert score >= 80.0
    assert len(strengths) > 0


@pytest.mark.unit
def test_no_experience_when_required():
    matcher = ExperienceMatcher()
    job = JobPayload(title="Backend Developer", required_experience_years=2.0)
    experiences = []

    score, strengths, gaps = matcher.evaluate(experiences, job)
    assert score == 20.0
    assert len(gaps) > 0


@pytest.mark.unit
def test_overlapping_experiences_are_not_double_counted():
    """
    Test: Overlapping dates (01/2024-12/2024 and 06/2024-06/2025)
    Total merged interval is 01/2024 to 06/2025 = 1.5 years (18 months), NOT 2.0 years.
    """
    matcher = ExperienceMatcher()
    experiences = [
        WorkExperience(
            position_title="Backend Developer",
            start_date="2024-01-01",
            end_date="2024-12-31",
            is_current=False,
        ),
        WorkExperience(
            position_title="Backend Developer",
            start_date="2024-06-01",
            end_date="2025-06-30",
            is_current=False,
        ),
    ]

    total_years = matcher._calculate_total_years(experiences)
    # Merged range is 2024-01-01 to 2025-06-30 (~546 days = 1.495 years)
    assert total_years == pytest.approx(1.5, abs=0.05)


@pytest.mark.unit
def test_intern_title_scaling(mock_semantic_matcher):
    matcher = ExperienceMatcher()
    job = JobPayload(title="Backend Developer", required_experience_years=1.0)

    exp_intern = [
        WorkExperience(
            position_title="Backend Intern",
            start_date="2025-01-01",
            end_date="2026-06-30",
            is_current=False,
        )
    ]
    exp_developer = [
        WorkExperience(
            position_title="Backend Developer",
            start_date="2025-01-01",
            end_date="2026-06-30",
            is_current=False,
        )
    ]

    score_intern, _, _ = matcher.evaluate(exp_intern, job)
    score_dev, _, _ = matcher.evaluate(exp_developer, job)

    assert score_dev > score_intern
