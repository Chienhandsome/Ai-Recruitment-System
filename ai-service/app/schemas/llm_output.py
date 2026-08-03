"""Validated output produced by the resume extraction model."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProficiencyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class ExtractedSkill(BaseModel):
    name: str = Field(..., description="Skill name as written in CV")
    proficiency_level: ProficiencyLevel = Field(
        default=ProficiencyLevel.BEGINNER,
        description="Estimated proficiency level",
    )


class ExtractedWorkExperience(BaseModel):
    company_name: str
    position_title: str
    start_date: str = Field(..., description="Format: YYYY-MM-DD")
    end_date: Optional[str] = Field(
        default=None,
        description="Format: YYYY-MM-DD or null if current",
    )
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


class ResumeExtractionResult(BaseModel):
    """Structured extraction result consumed by backend hydration."""

    summary: Optional[str] = Field(default=None, description="Professional summary")
    desired_title: Optional[str] = Field(default=None, description="Desired job title")
    total_years_experience: Optional[float] = Field(
        default=None,
        description="Total years of experience",
    )
    skills: list[ExtractedSkill] = Field(default_factory=list)
    work_experiences: list[ExtractedWorkExperience] = Field(default_factory=list)
    educations: list[ExtractedEducation] = Field(default_factory=list)
    projects: list[ExtractedProject] = Field(default_factory=list)
    certificates: list[ExtractedCertificate] = Field(default_factory=list)
