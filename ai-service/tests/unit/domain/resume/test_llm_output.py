from datetime import date, timedelta

from app.schemas.llm_output import ExtractedWorkExperience, LLMResumeExtraction


def test_invalid_future_and_reversed_dates_are_cleared():
    future = (date.today() + timedelta(days=1)).isoformat()

    experience = ExtractedWorkExperience(
        company_name="A",
        position_title="Engineer",
        start_date="2024-01-01",
        end_date="2023-01-01",
        is_current=False,
        is_inferred=False,
        source_text="Engineer, 2024-2023",
    )
    future_experience = ExtractedWorkExperience(
        company_name="B",
        position_title="Engineer",
        start_date=future,
        end_date="not-a-date",
        is_current=False,
        is_inferred=False,
        source_text="Engineer",
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
        is_inferred=False,
        source_text="Engineer, 2024-present",
    )

    assert experience.end_date is None


def test_missing_evidence_is_always_marked_as_inferred():
    experience = ExtractedWorkExperience(
        company_name="A",
        position_title="Engineer",
        start_date="2024-01-01",
        end_date=None,
        is_current=True,
        is_inferred=False,
        source_text=None,
    )

    assert experience.is_inferred is True


def test_gemini_schema_requires_all_collections_and_evidence_fields():
    schema = LLMResumeExtraction.model_json_schema()

    assert {
        "skills",
        "work_experiences",
        "educations",
        "projects",
        "certificates",
        "languages",
        "overall_confidence",
    }.issubset(schema["required"])
    for definition in (
        "ExtractedSkill",
        "ExtractedWorkExperience",
        "ExtractedEducation",
        "ExtractedProject",
        "ExtractedCertificate",
        "ExtractedLanguage",
    ):
        assert {"is_inferred", "source_text"}.issubset(
            schema["$defs"][definition]["required"]
        )
