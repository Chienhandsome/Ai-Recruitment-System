from app.domain.resume.steps.date_calculator import apply_experience_duration
from app.schemas.llm_output import (
    ExtractedWorkExperience,
    ResumeExtractionResult,
)


def test_experience_duration_merges_overlapping_intervals():
    result = ResumeExtractionResult(
        work_experiences=[
            ExtractedWorkExperience(
                company_name="A",
                position_title="Engineer",
                start_date="2020-01-01",
                end_date="2021-01-01",
                is_current=False,
                is_inferred=False,
                source_text="Engineer at A, 2020-2021",
            ),
            ExtractedWorkExperience(
                company_name="B",
                position_title="Engineer",
                start_date="2020-06-01",
                end_date="2022-01-01",
                is_current=False,
                is_inferred=False,
                source_text="Engineer at B, 2020-2022",
            ),
        ]
    )

    calculated = apply_experience_duration(result)

    assert calculated.total_years_experience == 2.0


def test_experience_duration_ignores_missing_dates():
    result = ResumeExtractionResult(
        work_experiences=[
            ExtractedWorkExperience(
                company_name="A",
                position_title="Engineer",
                is_current=False,
                is_inferred=True,
                source_text=None,
            )
        ]
    )

    assert apply_experience_duration(result).total_years_experience == 0.0
