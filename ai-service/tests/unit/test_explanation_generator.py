# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.services.matching.summary_generator import SummaryGenerator


@pytest.mark.unit
def test_summary_generation_high_level():
    summary = SummaryGenerator.generate_summary(
        candidate_name="Backend Developer",
        job_title="Junior Backend Developer",
        overall_score=89.37,
        match_level="HIGH",
        skills_score=100.0,
        experience_score=80.0,
        education_score=94.0,
        project_score=85.0,
        missing_required_skills=[],
        strengths=["Thành thạo NestJS", "Kinh nghiệm 2.0 năm"],
        gaps=[],
    )

    assert "HIGH" in summary
    assert "Junior Backend Developer" in summary
    assert "None" not in summary
    assert "null" not in summary
    assert "NaN" not in summary
    assert len(summary) > 30


@pytest.mark.unit
def test_summary_generation_missing_required_skills():
    summary = SummaryGenerator.generate_summary(
        candidate_name="Backend Developer",
        job_title="Junior Backend Developer",
        overall_score=56.63,
        match_level="MEDIUM",
        skills_score=38.75,
        experience_score=60.0,
        education_score=94.0,
        project_score=40.0,
        missing_required_skills=["NestJS"],
        strengths=["Có kinh nghiệm PostgreSQL"],
        gaps=["Thiếu kỹ năng bắt buộc: NestJS"],
    )

    assert "MEDIUM" in summary
    assert "NestJS" in summary
    assert "None" not in summary
