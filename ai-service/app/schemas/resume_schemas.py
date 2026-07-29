"""Pydantic models for resume analysis request/response payloads."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ─── Enums (must match DB) ─────────────────────────────────────────────


class ProficiencyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


# ─── LLM Output Sub-models ────────────────────────────────────────────


class ExtractedSkill(BaseModel):
    name: str = Field(..., description="Skill name as written in CV")
    proficiency_level: ProficiencyLevel = Field(
        default=ProficiencyLevel.BEGINNER,
        description="Estimated proficiency level",
    )
    years_experience: Optional[float] = Field(
        default=None, description="Years of experience with this skill"
    )


class ExtractedWorkExperience(BaseModel):
    company_name: str
    position_title: str
    start_date: str = Field(..., description="Format: YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="Format: YYYY-MM-DD or null if current")
    is_current: bool = False
    description: Optional[str] = None
    achievements: Optional[str] = None


class ExtractedEducation(BaseModel):
    school_name: str
    major: Optional[str] = None
    degree: Optional[str] = None
    start_date: Optional[str] = Field(default=None, description="Format: YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="Format: YYYY-MM-DD")
    description: Optional[str] = None


class ExtractedProject(BaseModel):
    project_name: str
    project_role: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[list[str]] = None
    project_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ExtractedCertificate(BaseModel):
    certificate_name: str
    issuing_organization: str = "Unknown"
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_url: Optional[str] = None


# ─── Main LLM Output ──────────────────────────────────────────────────


class ResumeExtractionResult(BaseModel):
    """Structured result from LLM extraction — maps to DB models."""

    summary: Optional[str] = Field(default=None, description="Professional summary")
    desired_title: Optional[str] = Field(default=None, description="Desired job title")
    total_years_experience: Optional[float] = Field(default=None, description="Total years of experience")
    skills: list[ExtractedSkill] = Field(default_factory=list)
    work_experiences: list[ExtractedWorkExperience] = Field(default_factory=list)
    educations: list[ExtractedEducation] = Field(default_factory=list)
    projects: list[ExtractedProject] = Field(default_factory=list)
    certificates: list[ExtractedCertificate] = Field(default_factory=list)


# ─── RabbitMQ Message Payloads ─────────────────────────────────────────


class ResumeAnalysisRequest(BaseModel):
    """Message received from backend via RabbitMQ."""

    resume_id: str = Field(..., alias="resumeId")
    candidate_profile_id: str = Field(..., alias="candidateProfileId")
    object_path: str = Field(..., alias="objectPath")
    mime_type: str = Field(..., alias="mimeType")
    original_file_name: str = Field(..., alias="originalFileName")
    requested_at: str = Field(..., alias="requestedAt")

    model_config = {"populate_by_name": True}


class ResumeAnalysisCompleted(BaseModel):
    """Message published back to backend on success."""

    resumeId: str
    candidateProfileId: str
    parsedData: ResumeExtractionResult
    completedAt: str


class ResumeAnalysisFailed(BaseModel):
    """Message published back to backend on failure."""

    resumeId: str
    candidateProfileId: str
    errorMessage: str
    failedAt: str
