# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import CandidateSkill, JobRequiredSkill
# pyrefly: ignore [missing-import]
from app.services.matching.skills_matcher import SkillsMatcher


@pytest.mark.unit
def test_full_skill_match():
    matcher = SkillsMatcher()
    cand_skills = [
        CandidateSkill(skill_name="NestJS", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="PostgreSQL", proficiency_level="ADVANCED"),
    ]
    req_skills = [
        JobRequiredSkill(skill_name="NestJS", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
        JobRequiredSkill(skill_name="PostgreSQL", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
    ]

    score, strengths, gaps, missing = matcher.evaluate(cand_skills, req_skills)
    assert score == 100.0
    assert len(missing) == 0
    assert len(strengths) == 2


@pytest.mark.unit
def test_missing_mandatory_skill():
    matcher = SkillsMatcher()
    cand_skills = [
        CandidateSkill(skill_name="Docker", proficiency_level="INTERMEDIATE"),
    ]
    req_skills = [
        JobRequiredSkill(skill_name="NestJS", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
        JobRequiredSkill(skill_name="PostgreSQL", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
    ]

    score, strengths, gaps, missing = matcher.evaluate(cand_skills, req_skills)
    assert "NestJS" in missing
    assert "PostgreSQL" in missing
    assert score < 50.0


@pytest.mark.unit
def test_alias_skill_matching():
    matcher = SkillsMatcher()
    cand_skills = [
        CandidateSkill(skill_name="ReactJS", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Node JS", proficiency_level="ADVANCED"),
    ]
    req_skills = [
        JobRequiredSkill(skill_name="React", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
        JobRequiredSkill(skill_name="Node.js", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
    ]

    score, strengths, gaps, missing = matcher.evaluate(cand_skills, req_skills)
    assert score == 100.0
    assert len(missing) == 0


@pytest.mark.unit
def test_metamorphic_skill_addition():
    """Assertion: Adding a relevant required skill monotonically increases score."""
    matcher = SkillsMatcher()
    req_skills = [
        JobRequiredSkill(skill_name="Python", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
        JobRequiredSkill(skill_name="Pandas", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
    ]

    cand_skills_1 = [CandidateSkill(skill_name="Python", proficiency_level="ADVANCED")]
    cand_skills_2 = [
        CandidateSkill(skill_name="Python", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Pandas", proficiency_level="ADVANCED"),
    ]

    score1, _, _, _ = matcher.evaluate(cand_skills_1, req_skills)
    score2, _, _, _ = matcher.evaluate(cand_skills_2, req_skills)

    assert score2 > score1
