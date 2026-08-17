from app.schemas.matching import WorkExperience
from app.services.matching.experience_level_evaluator import ExperienceLevelEvaluator

REFERENCE_DATE = "2026-08-16T00:00:00Z"


def experience(
    title: str,
    start: str,
    end: str | None = None,
    *,
    current: bool = False,
    description: str | None = None,
) -> WorkExperience:
    return WorkExperience(
        position_title=title,
        start_date=start,
        end_date=end,
        is_current=current,
        description=description,
    )


def test_returns_unknown_without_work_experience():
    result = ExperienceLevelEvaluator().evaluate(
        [], "MIDDLE", "REQUIRED", REFERENCE_DATE
    )

    assert result["candidate_level"] is None
    assert result["level_eligible"] is None
    assert result["recommendation"] == "NEEDS_REVIEW"


def test_returns_unknown_when_experience_has_no_usable_evidence():
    result = ExperienceLevelEvaluator().evaluate(
        [WorkExperience(position_title="")], "MIDDLE", "REQUIRED", REFERENCE_DATE
    )

    assert result["candidate_level"] is None
    assert result["level_fit_score"] is None
    assert result["level_gap"] is None
    assert result["level_eligible"] is None
    assert result["recommendation"] == "NEEDS_REVIEW"


def test_merges_overlapping_intervals_and_assesses_middle():
    experiences = [
        experience("Software Engineer", "2022-01-01", "2024-01-01"),
        experience("Software Engineer", "2023-01-01", "2025-01-01"),
    ]

    result = ExperienceLevelEvaluator().evaluate(
        experiences, "MIDDLE", reference_date=REFERENCE_DATE
    )

    assert result["total_experience_years"] == 3.0
    assert result["candidate_level"] == "MIDDLE"
    assert result["level_fit_score"] == 100
    assert result["level_eligible"] is True


def test_recent_junior_title_is_conservative_against_years_baseline():
    result = ExperienceLevelEvaluator().evaluate(
        [experience("Junior Flutter Developer", "2023-01-01", "2025-07-01")],
        "MIDDLE",
        reference_date=REFERENCE_DATE,
    )

    assert result["candidate_level"] == "JUNIOR"
    assert result["level_gap"] == 1
    assert result["level_fit_score"] == 70
    assert result["recommendation"] == "ADVISORY_LEVEL_GAP"


def test_required_mode_reports_not_eligible_without_rejecting_score():
    result = ExperienceLevelEvaluator().evaluate(
        [experience("Junior Developer", "2025-01-01", None, current=True)],
        "MIDDLE",
        "REQUIRED",
        REFERENCE_DATE,
    )

    assert result["level_eligible"] is False
    assert result["recommendation"] == "NOT_ELIGIBLE_LEVEL"


def test_overqualified_candidate_is_not_penalized():
    result = ExperienceLevelEvaluator().evaluate(
        [experience("Senior Engineer", "2019-01-01", None, current=True)],
        "JUNIOR",
        reference_date=REFERENCE_DATE,
    )

    assert result["candidate_level"] == "SENIOR"
    assert result["level_fit_score"] == 100
    assert result["level_eligible"] is True


def test_lead_requires_years_and_leadership_evidence():
    without_evidence = ExperienceLevelEvaluator().evaluate(
        [experience("Tech Lead", "2018-01-01", None, current=True)],
        "LEAD",
        reference_date=REFERENCE_DATE,
    )
    with_evidence = ExperienceLevelEvaluator().evaluate(
        [
            experience(
                "Tech Lead",
                "2018-01-01",
                None,
                current=True,
                description="Dẫn dắt đội ngũ, mentoring và code review.",
            )
        ],
        "LEAD",
        reference_date=REFERENCE_DATE,
    )

    assert without_evidence["candidate_level"] == "SENIOR"
    assert with_evidence["candidate_level"] == "LEAD"


def test_manager_requires_management_not_only_mentoring_evidence():
    mentoring_only = ExperienceLevelEvaluator().evaluate(
        [
            experience(
                "Engineering Manager",
                "2018-01-01",
                None,
                current=True,
                description="Mentoring engineers and performing code review.",
            )
        ],
        "MANAGER",
        reference_date=REFERENCE_DATE,
    )
    with_management = ExperienceLevelEvaluator().evaluate(
        [
            experience(
                "Engineering Manager",
                "2018-01-01",
                None,
                current=True,
                description=(
                    "Managed a team with direct reports and performance reviews."
                ),
            )
        ],
        "MANAGER",
        reference_date=REFERENCE_DATE,
    )

    assert mentoring_only["candidate_level"] == "SENIOR"
    assert mentoring_only["level_confidence"] < 0.9
    assert with_management["candidate_level"] == "MANAGER"


def test_invalid_future_interval_is_not_counted():
    result = ExperienceLevelEvaluator().evaluate(
        [experience("Developer", "2027-01-01", None, current=True)],
        "JUNIOR",
        reference_date=REFERENCE_DATE,
    )

    assert result["total_experience_years"] == 0


def test_same_input_is_deterministic():
    evaluator = ExperienceLevelEvaluator()
    experiences = [
        experience("Middle Backend Engineer", "2022-01-01", None, current=True)
    ]

    first = evaluator.evaluate(experiences, "MIDDLE", reference_date=REFERENCE_DATE)
    for _ in range(9):
        assert (
            evaluator.evaluate(experiences, "MIDDLE", reference_date=REFERENCE_DATE)
            == first
        )
