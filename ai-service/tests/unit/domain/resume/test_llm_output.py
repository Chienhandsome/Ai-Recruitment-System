from datetime import date, timedelta

from app.schemas.llm_output import ExtractedWorkExperience


def test_invalid_future_and_reversed_dates_are_cleared():
    future = (date.today() + timedelta(days=1)).isoformat()

    experience = ExtractedWorkExperience(
        company_name="A",
        position_title="Engineer",
        start_date="2024-01-01",
        end_date="2023-01-01",
    )
    future_experience = ExtractedWorkExperience(
        company_name="B",
        position_title="Engineer",
        start_date=future,
        end_date="not-a-date",
    )

    assert experience.start_date == "2024-01-01"
    assert experience.end_date is None
    assert future_experience.start_date is None
    assert future_experience.end_date is None


def test_current_experience_never_keeps_end_date():
    experience = ExtractedWorkExperience(
        company_name="A",
        position_title="Engineer",
        start_date="2024-01-01",
        end_date="2024-06-01",
        is_current=True,
    )

    assert experience.end_date is None
