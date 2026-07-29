# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import Education, JobPayload
# pyrefly: ignore [missing-import]
from app.services.matching.education_matcher import EducationMatcher


@pytest.mark.unit
def test_relevant_major_education():
    matcher = EducationMatcher()
    job = JobPayload(title="Backend Developer")
    educations = [
        Education(school_name="Đại học Công nghệ", major="Kỹ thuật phần mềm", degree="Cử nhân")
    ]

    score, strengths, gaps = matcher.evaluate(educations, job)
    assert score >= 90.0
    assert len(strengths) > 0


@pytest.mark.unit
def test_unrelated_major_education():
    matcher = EducationMatcher()
    job = JobPayload(title="Backend Developer")
    educations = [
        Education(school_name="Đại học Kinh tế", major="Kế toán", degree="Cử nhân")
    ]

    score, strengths, gaps = matcher.evaluate(educations, job)
    assert score < 80.0
    assert len(gaps) > 0


@pytest.mark.unit
def test_degree_hierarchy():
    matcher = EducationMatcher()
    job = JobPayload(title="Backend Developer")

    edu_bachelor = [Education(major="CNTT", degree="Cử nhân")]
    edu_master = [Education(major="CNTT", degree="Thạc sĩ")]

    score_bachelor, _, _ = matcher.evaluate(edu_bachelor, job)
    score_master, _, _ = matcher.evaluate(edu_master, job)

    assert score_master > score_bachelor


@pytest.mark.unit
def test_no_education_provided():
    matcher = EducationMatcher()
    job = JobPayload(title="Backend Developer")

    score, strengths, gaps = matcher.evaluate([], job)
    assert score == 50.0
    assert len(gaps) > 0
