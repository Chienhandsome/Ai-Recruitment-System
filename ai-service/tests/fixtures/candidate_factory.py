from typing import Any, Dict, List, Optional
import uuid


def make_candidate_profile_detail(
    profile_id: Optional[str] = None,
    desired_title: str = "Backend Developer",
    professional_summary: str = "Có kinh nghiệm lập trình backend.",
    **kwargs: Any,
) -> Dict[str, Any]:
    return {
        "id": profile_id or str(uuid.uuid4()),
        "candidate_user_id": str(uuid.uuid4()),
        "desired_title": desired_title,
        "professional_summary": professional_summary,
        "github_url": "https://github.com/test",
        "linkedin_url": "https://linkedin.com/in/test",
        "portfolio_url": None,
        "address": "TP. Hồ Chí Minh",
        "created_at": "2026-07-24T10:00:00Z",
        "updated_at": "2026-07-24T10:00:00Z",
        **kwargs,
    }


def make_work_experience(
    position_title: str = "Backend Developer",
    start_date: str = "2025-01-01",
    end_date: Optional[str] = "2026-06-30",
    is_current: bool = False,
    description: str = "Phát triển REST API bằng NestJS và PostgreSQL.",
    achievements: str = "Hoàn thành dự án đúng hạn.",
    **kwargs: Any,
) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "company_name": "Công ty Mẫu",
        "position_title": position_title,
        "start_date": start_date,
        "end_date": end_date,
        "is_current": is_current,
        "description": description,
        "achievements": achievements,
        **kwargs,
    }


def make_education(
    school_name: str = "Đại học Công nghệ",
    major: str = "Kỹ thuật phần mềm",
    degree: str = "Cử nhân",
    start_date: str = "2022-09-01",
    end_date: str = "2026-06-30",
    **kwargs: Any,
) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "school_name": school_name,
        "major": major,
        "degree": degree,
        "start_date": start_date,
        "end_date": end_date,
        "description": None,
        **kwargs,
    }


def make_project(
    project_name: str = "E-Commerce Microservices",
    project_role: str = "Backend Developer",
    description: str = "Xây dựng hệ thống bán hàng với NestJS và RabbitMQ.",
    technologies: Optional[List[str]] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "project_name": project_name,
        "project_role": project_role,
        "description": description,
        "technologies": technologies if technologies is not None else ["NestJS", "PostgreSQL"],
        "project_url": None,
        "start_date": "2025-06-01",
        "end_date": "2026-01-01",
        **kwargs,
    }


def make_candidate_skill(
    skill_name: str,
    proficiency_level: str = "ADVANCED",
    years_experience: float = 2.0,
    is_primary: bool = True,
    **kwargs: Any,
) -> Dict[str, Any]:
    return {
        "skill_id": str(uuid.uuid4()),
        "skill_name": skill_name,
        "proficiency_level": proficiency_level,
        "years_experience": years_experience,
        "is_primary": is_primary,
        **kwargs,
    }


def make_candidate_profile(
    desired_title: str = "Backend Developer",
    skills: Optional[List[Dict[str, Any]]] = None,
    work_experiences: Optional[List[Dict[str, Any]]] = None,
    educations: Optional[List[Dict[str, Any]]] = None,
    projects: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    profile_detail = make_candidate_profile_detail(desired_title=desired_title)
    default_skills = [
        make_candidate_skill("NestJS", "ADVANCED", 2.0),
        make_candidate_skill("PostgreSQL", "ADVANCED", 2.0),
    ]
    default_experiences = [make_work_experience()]
    default_educations = [make_education()]
    default_projects = [make_project()]

    return {
        "profile": profile_detail,
        "skills": skills if skills is not None else default_skills,
        "work_experiences": work_experiences if work_experiences is not None else default_experiences,
        "educations": educations if educations is not None else default_educations,
        "projects": projects if projects is not None else default_projects,
    }
