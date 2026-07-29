from typing import Any, Dict, List, Optional
import uuid


def make_required_skill(
    skill_name: str,
    is_mandatory: bool = True,
    minimum_level: str = "INTERMEDIATE",
    minimum_years: float = 1.0,
) -> Dict[str, Any]:
    return {
        "job_id": str(uuid.uuid4()),
        "skill_id": str(uuid.uuid4()),
        "skill_name": skill_name,
        "is_mandatory": is_mandatory,
        "minimum_level": minimum_level,
        "minimum_years": minimum_years,
    }


def make_weights(
    skills: float = 40.0,
    experience: float = 30.0,
    education: float = 15.0,
    projects: float = 15.0,
) -> Dict[str, float]:
    return {
        "skills": skills,
        "experience": experience,
        "education": education,
        "projects": projects,
    }


def make_job(
    title: str = "Junior Backend Developer",
    required_experience_years: float = 1.0,
    required_skills: Optional[List[Dict[str, Any]]] = None,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    default_req_skills = [
        make_required_skill("NestJS", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
        make_required_skill("PostgreSQL", is_mandatory=True, minimum_level="INTERMEDIATE", minimum_years=1.0),
        make_required_skill("Docker", is_mandatory=False, minimum_level="INTERMEDIATE", minimum_years=0.0),
    ]
    return {
        "id": str(uuid.uuid4()),
        "hr_user_id": str(uuid.uuid4()),
        "title": title,
        "employment_type": "FULL_TIME",
        "work_mode": "HYBRID",
        "salary_min": 10000000,
        "salary_max": 20000000,
        "location": "TP. Hồ Chí Minh",
        "required_experience_years": required_experience_years,
        "description": "Tuyển Backend Developer phát triển hệ thống REST API.",
        "requirements": "Kinh nghiệm NestJS, PostgreSQL, Docker.",
        "benefits": "Lương thưởng hấp dẫn.",
        "ai_weights_config": weights or make_weights(),
        "status": "PUBLISHED",
        "required_skills": required_skills if required_skills is not None else default_req_skills,
    }
