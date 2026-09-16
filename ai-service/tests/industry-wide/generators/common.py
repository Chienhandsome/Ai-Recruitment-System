from typing import Dict, Any, List, Optional
import json


def make_jd(
    id: str,
    title: str,
    description: str,
    requirements: str,
    required_experience_years: float,
    experience_level: str,
    level_requirement_mode: str,
    required_skills: List[Dict[str, Any]],
    required_certificates: List[Dict[str, Any]],
    required_languages: List[Dict[str, Any]],
    ai_weights_config: Dict[str, float],
) -> Dict[str, Any]:
    return {
        "id": id,
        "title": title,
        "description": description,
        "requirements": requirements,
        "required_experience_years": required_experience_years,
        "experience_level": experience_level,
        "level_requirement_mode": level_requirement_mode,
        "required_skills": required_skills,
        "required_certificates": required_certificates,
        "required_languages": required_languages,
        "ai_weights_config": ai_weights_config,
    }


def make_exp(
    company_name: str,
    position_title: str,
    start_date: str,
    end_date: Optional[str] = None,
    is_current: bool = False,
    description: str = "",
    achievements: str = "",
) -> Dict[str, Any]:
    return {
        "company_name": company_name,
        "position_title": position_title,
        "start_date": start_date,
        "end_date": end_date,
        "is_current": is_current,
        "description": description,
        "achievements": achievements,
    }


def make_edu(
    school_name: str,
    major: str,
    degree: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    description: str = "",
) -> Dict[str, Any]:
    return {
        "school_name": school_name,
        "major": major,
        "degree": degree,
        "start_date": start_date,
        "end_date": end_date,
        "description": description,
    }


def make_proj(
    project_name: str,
    project_role: str,
    description: str,
    technologies: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "project_name": project_name,
        "project_role": project_role,
        "description": description,
        "technologies": technologies,
        "start_date": start_date,
        "end_date": end_date,
    }


def make_candidate(
    candidate_name: str,
    desired_title: str,
    professional_summary: str,
    work_experiences: List[Dict[str, Any]],
    educations: List[Dict[str, Any]],
    skills: List[str],
    certificates: Optional[List[Dict[str, str]]] = None,
    languages: Optional[List[Dict[str, str]]] = None,
    projects: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    certificates = certificates or []
    languages = languages or []
    projects = projects or []

    skills_objs = [{"skill_name": s} for s in skills]

    return {
        "profile": {
            "desired_title": desired_title,
            "professional_summary": professional_summary,
        },
        "candidate_name": candidate_name,
        "desired_title": desired_title,
        "professional_summary": professional_summary,
        "work_experiences": work_experiences,
        "educations": educations,
        "projects": projects,
        "skills": skills_objs,
        "certificates": certificates,
        "languages": languages,
    }


def make_expected(
    pattern_name: str,
    expected_mandatory_status: str,
    expected_failures: List[str],
    min_score: float,
    max_score: float,
    rationale: str,
) -> Dict[str, Any]:
    return {
        "pattern_name": pattern_name,
        "expected_mandatory_status": expected_mandatory_status,
        "expected_failures": expected_failures,
        "min_score": min_score,
        "max_score": max_score,
        "rationale": rationale,
    }
