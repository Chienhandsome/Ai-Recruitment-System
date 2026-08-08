from typing import Any, Dict, List, Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


# --- Candidate Schemas ---

class ProfileDetail(BaseModel):
    id: Optional[str] = None
    candidate_user_id: Optional[str] = None
    desired_title: Optional[str] = None
    professional_summary: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    address: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WorkExperience(BaseModel):
    id: Optional[str] = None
    candidate_profile_id: Optional[str] = None
    company_name: Optional[str] = None
    position_title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None
    achievements: Optional[str] = None


class Education(BaseModel):
    id: Optional[str] = None
    candidate_profile_id: Optional[str] = None
    school_name: Optional[str] = None
    major: Optional[str] = None
    degree: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class CandidateProject(BaseModel):
    id: Optional[str] = None
    candidate_profile_id: Optional[str] = None
    project_name: Optional[str] = None
    project_role: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    project_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class CandidateCertificate(BaseModel):
    certificate_name: str
    issuing_organization: Optional[str] = None

class CandidateSkill(BaseModel):
    candidate_profile_id: Optional[str] = None
    skill_id: Optional[str] = None
    proficiency_level: Optional[str] = None  # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    is_primary: bool = False
    skill_name: str


class CandidateProfilePayload(BaseModel):
    profile: Optional[ProfileDetail] = None
    work_experiences: List[WorkExperience] = Field(default_factory=list)
    educations: List[Education] = Field(default_factory=list)
    projects: List[CandidateProject] = Field(default_factory=list)
    certificates: List[CandidateCertificate] = Field(default_factory=list)
    skills: List[CandidateSkill] = Field(default_factory=list)


# --- Job Schemas ---

class JobRequiredSkill(BaseModel):
    job_id: Optional[str] = None
    skill_id: Optional[str] = None
    is_mandatory: bool = True
    minimum_level: Optional[str] = "BEGINNER"  # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    minimum_years: float = 0.0
    skill_name: str


class JobRequiredCertificate(BaseModel):
    certificate_name: str
    is_mandatory: bool = True


class JobWeightsConfig(BaseModel):
    skills: float = 40.0
    experience: float = 30.0
    education: float = 15.0
    other: float = 15.0


class JobPayload(BaseModel):
    id: Optional[str] = None
    hr_user_id: Optional[str] = None
    title: str
    employment_type: Optional[str] = None
    work_mode: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    required_experience_years: float = 0.0
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    ai_weights_config: Optional[JobWeightsConfig] = None
    status: Optional[str] = None
    published_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    closed_at: Optional[str] = None
    required_skills: List[JobRequiredSkill] = Field(default_factory=list)
    required_certificates: List[JobRequiredCertificate] = Field(default_factory=list)


# --- Request Payload ---

class EvaluationRequest(BaseModel):
    application_id: str
    candidate_profile: CandidateProfilePayload
    job: JobPayload
    weights: Optional[JobWeightsConfig] = None


# --- Response Payload ---

class SkillInfo(BaseModel):
    name: str
    isMandatory: Optional[bool] = False

class EvidenceInfo(BaseModel):
    skillName: str
    evidenceText: str
    source: Optional[str] = "Context"

class EvaluationResponse(BaseModel):
    overall_score: float
    match_level: str  # HIGH, MEDIUM, LOW
    skills_score: float
    experience_score: float
    education_score: float
    other_score: float
    strengths: List[str] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    matched_skills: List[SkillInfo] = Field(default_factory=list)
    missing_skills: List[SkillInfo] = Field(default_factory=list)
    missing_required_skills: List[str] = Field(default_factory=list)
    evidence: List[EvidenceInfo] = Field(default_factory=list)
    confidence_score: float = 1.0
    summary: str
