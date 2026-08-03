"""Assemble the public parsed-resume result from pipeline step output."""

from app.schemas.llm_output import ResumeExtractionResult


def build_result(extraction: ResumeExtractionResult) -> ResumeExtractionResult:
    return extraction
