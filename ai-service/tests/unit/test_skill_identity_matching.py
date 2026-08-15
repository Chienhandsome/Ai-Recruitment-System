import pytest

from app.schemas.matching import (
    CandidateProfilePayload,
    CandidateSkill,
    JobPayload,
    JobRequiredSkill,
)
from app.services.matching.generic_matcher import GenericMatchingEngine
from app.utils.normalizer import normalize_skill_name


@pytest.mark.unit
def test_skill_matching_prefers_canonical_database_id():
    matcher = GenericMatchingEngine()
    candidate = CandidateProfilePayload(
        skills=[
            CandidateSkill(
                skill_id="canonical-excel-id",
                skill_name="Legacy display label",
                proficiency_level="ADVANCED",
            )
        ]
    )
    job = JobPayload(
        title="Office Executive",
        required_skills=[
            JobRequiredSkill(
                skill_id="canonical-excel-id",
                skill_name="Microsoft Excel",
                minimum_level="INTERMEDIATE",
            )
        ],
    )

    result = matcher._match_skills(candidate, job)

    assert result["score"] == 1.0
    assert result["missing_mandatory"] == []
    assert result["matched"][0]["source"] == "skills_list"


@pytest.mark.unit
def test_skill_matching_falls_back_to_database_normalized_name():
    matcher = GenericMatchingEngine()
    candidate = CandidateProfilePayload(
        skills=[
            CandidateSkill(
                skill_id="legacy-id",
                skill_name="MS Excel",
                normalized_name="microsoft-excel",
                proficiency_level="ADVANCED",
            )
        ]
    )
    job = JobPayload(
        title="Accountant",
        required_skills=[
            JobRequiredSkill(
                skill_id="canonical-id",
                skill_name="Microsoft Excel",
                normalized_name="microsoft-excel",
                minimum_level="INTERMEDIATE",
            )
        ],
    )

    result = matcher._match_skills(candidate, job)

    assert result["score"] == 1.0
    assert result["missing"] == []


@pytest.mark.unit
@pytest.mark.parametrize(
    ("raw_name", "canonical_name"),
    [
        ("MS Excel", "Microsoft Excel"),
        ("PPT", "Microsoft PowerPoint"),
        ("Golang", "Go"),
        ("CSKH", "Customer Service"),
        ("Tuyển dụng", "Recruitment"),
        ("Meta Ads", "Facebook Ads"),
    ],
)
def test_common_office_and_technology_aliases(raw_name, canonical_name):
    assert normalize_skill_name(raw_name) == canonical_name
