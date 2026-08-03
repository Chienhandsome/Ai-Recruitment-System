"""Compatibility exports for the pre-refactor schema module."""

from app.schemas.llm_output import (
    ExtractedCertificate,
    ExtractedEducation,
    ExtractedLanguage,
    ExtractedProject,
    ExtractedSkill,
    ExtractedWorkExperience,
    LLMResumeExtraction,
    ProficiencyLevel,
    ResumeExtractionResult,
    SkillCategoryHint,
)
from app.schemas.mq_messages import (
    ResumeAnalysisCompleted,
    ResumeAnalysisFailed,
    ResumeAnalysisRequest,
)

__all__ = [
    "ExtractedCertificate",
    "ExtractedEducation",
    "ExtractedLanguage",
    "ExtractedProject",
    "ExtractedSkill",
    "ExtractedWorkExperience",
    "ProficiencyLevel",
    "SkillCategoryHint",
    "LLMResumeExtraction",
    "ResumeAnalysisCompleted",
    "ResumeAnalysisFailed",
    "ResumeAnalysisRequest",
    "ResumeExtractionResult",
]
