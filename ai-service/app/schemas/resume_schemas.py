"""Compatibility exports for the pre-refactor schema module."""

from app.schemas.llm_output import (
    ExtractedCertificate,
    ExtractedEducation,
    ExtractedProject,
    ExtractedSkill,
    ExtractedWorkExperience,
    ProficiencyLevel,
    ResumeExtractionResult,
)
from app.schemas.mq_messages import (
    ResumeAnalysisCompleted,
    ResumeAnalysisFailed,
    ResumeAnalysisRequest,
)

__all__ = [
    "ExtractedCertificate",
    "ExtractedEducation",
    "ExtractedProject",
    "ExtractedSkill",
    "ExtractedWorkExperience",
    "ProficiencyLevel",
    "ResumeAnalysisCompleted",
    "ResumeAnalysisFailed",
    "ResumeAnalysisRequest",
    "ResumeExtractionResult",
]
