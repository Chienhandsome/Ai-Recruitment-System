# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.schemas.matching import CandidateProject, JobPayload, JobRequiredSkill
# pyrefly: ignore [missing-import]
from app.services.matching.project_matcher import ProjectMatcher


@pytest.mark.unit
def test_no_projects():
    matcher = ProjectMatcher()
    job = JobPayload(title="Backend Developer")

    score, strengths, gaps = matcher.evaluate([], job)
    assert score == 20.0
    assert len(gaps) > 0


@pytest.mark.unit
def test_relevant_project_tech_stack(mock_semantic_matcher):
    matcher = ProjectMatcher()
    job = JobPayload(
        title="Backend Developer",
        required_skills=[
            JobRequiredSkill(skill_name="NestJS"),
            JobRequiredSkill(skill_name="PostgreSQL"),
        ],
    )
    projects = [
        CandidateProject(
            project_name="SmartRecruit AI",
            project_role="Backend Developer",
            description="Phát triển REST API bằng NestJS và PostgreSQL",
            technologies=["NestJS", "PostgreSQL"],
        )
    ]

    score, strengths, gaps = matcher.evaluate(projects, job)
    assert score >= 70.0
    assert len(strengths) > 0


@pytest.mark.unit
def test_project_tech_alias_matching(mock_semantic_matcher):
    matcher = ProjectMatcher()
    job = JobPayload(
        title="Frontend Developer",
        required_skills=[
            JobRequiredSkill(skill_name="React"),
            JobRequiredSkill(skill_name="Node.js"),
        ],
    )
    projects = [
        CandidateProject(
            project_name="Web Portal",
            project_role="Frontend Developer",
            description="Xây dựng giao diện web bằng ReactJS và NodeJS",
            technologies=["ReactJS", "NodeJS"],
        )
    ]

    score, strengths, gaps = matcher.evaluate(projects, job)
    assert score >= 70.0
