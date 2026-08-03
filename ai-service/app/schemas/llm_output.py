"""Validated LLM output and enriched resume-pipeline result models."""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class ProficiencyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class SkillCategoryHint(str, Enum):
    IT = "IT"
    SOFT_SKILL = "Soft Skill"
    LANGUAGE = "Language"
    BUSINESS = "Business"
    MARKETING = "Marketing"
    FINANCE = "Finance"
    OTHER = "Other"


def _valid_iso_date(value: object) -> Optional[str]:
    if value in (None, ""):
        return None
    try:
        parsed = date.fromisoformat(str(value))
    except ValueError:
        return None
    return parsed.isoformat() if parsed <= date.today() else None


class ExtractedEvidence(BaseModel):
    is_inferred: bool = Field(
        default=False,
        description="True only when this value is inferred rather than explicit",
    )
    source_text: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Short verbatim CV excerpt supporting this value",
    )


class ExtractedSkill(ExtractedEvidence):
    name: str = Field(..., description="Skill name as written in CV")
    proficiency_level: ProficiencyLevel = Field(
        default=ProficiencyLevel.BEGINNER,
        description="Estimated proficiency level",
    )
    category_hint: SkillCategoryHint = Field(default=SkillCategoryHint.IT)


class ExtractedWorkExperience(ExtractedEvidence):
    company_name: str
    position_title: str
    start_date: Optional[str] = Field(default=None, description="Format: YYYY-MM-DD")
    end_date: Optional[str] = Field(
        default=None,
        description="Format: YYYY-MM-DD or null if current",
    )
    is_current: bool = False
    description: Optional[str] = None
    achievements: Optional[str] = None

    _validate_dates = field_validator(
        "start_date", "end_date", mode="before"
    )(_valid_iso_date)

    @model_validator(mode="after")
    def validate_date_range(self) -> "ExtractedWorkExperience":
        if self.is_current:
            self.end_date = None
        elif self.start_date and self.end_date and self.end_date < self.start_date:
            self.end_date = None
        return self


class ExtractedEducation(ExtractedEvidence):
    school_name: str
    major: Optional[str] = None
    degree: Optional[str] = None
    start_date: Optional[str] = Field(default=None, description="Format: YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="Format: YYYY-MM-DD")
    description: Optional[str] = None

    _validate_dates = field_validator(
        "start_date", "end_date", mode="before"
    )(_valid_iso_date)

    @model_validator(mode="after")
    def validate_date_range(self) -> "ExtractedEducation":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            self.end_date = None
        return self


class ExtractedProject(ExtractedEvidence):
    project_name: str
    project_role: Optional[str] = None
    description: Optional[str] = None
    technologies: Optional[list[str]] = None
    project_url: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    _validate_dates = field_validator(
        "start_date", "end_date", mode="before"
    )(_valid_iso_date)

    @model_validator(mode="after")
    def validate_date_range(self) -> "ExtractedProject":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            self.end_date = None
        return self


class ExtractedCertificate(ExtractedEvidence):
    certificate_name: str
    issuing_organization: str = "Unknown"
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_url: Optional[str] = None

    _validate_dates = field_validator(
        "issue_date", "expiry_date", mode="before"
    )(_valid_iso_date)

    @model_validator(mode="after")
    def validate_date_range(self) -> "ExtractedCertificate":
        if self.issue_date and self.expiry_date and self.expiry_date < self.issue_date:
            self.expiry_date = None
        return self


class ExtractedLanguage(ExtractedEvidence):
    language: str
    proficiency: str


class ResumeExtractionPayload(BaseModel):
    summary: Optional[str] = Field(default=None, description="Professional summary")
    desired_title: Optional[str] = Field(default=None, description="Desired job title")
    skills: list[ExtractedSkill] = Field(default_factory=list)
    work_experiences: list[ExtractedWorkExperience] = Field(default_factory=list)
    educations: list[ExtractedEducation] = Field(default_factory=list)
    projects: list[ExtractedProject] = Field(default_factory=list)
    certificates: list[ExtractedCertificate] = Field(default_factory=list)
    languages: list[ExtractedLanguage] = Field(default_factory=list)


class LLMResumeExtraction(ResumeExtractionPayload):
    """Schema sent to Gemini Structured Output."""

    overall_confidence: float = Field(..., ge=0.0, le=1.0)


class ResumeExtractionResult(ResumeExtractionPayload):
    """Extraction enriched with deterministic pipeline metadata."""

    total_years_experience: Optional[float] = None
    overall_confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    llm_model: Optional[str] = None
    prompt_version: Optional[str] = None
    parser_version: Optional[str] = None
    raw_text_hash: Optional[str] = None
    extraction_duration_ms: Optional[int] = Field(default=None, ge=0)
