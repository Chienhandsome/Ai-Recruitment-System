"""Reserved boundary for deterministic experience-duration calculation.

The current refactor preserves the existing model-provided value. Deterministic
calculation is tracked as the separate C4 feature in the improvement plan.
"""

from app.schemas.llm_output import ResumeExtractionResult


def apply_experience_duration(result: ResumeExtractionResult) -> ResumeExtractionResult:
    return result
