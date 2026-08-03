"""Compatibility facade for the Gemini LLM adapter."""

from app.adapters.gemini_llm import EXTRACTION_PROMPT, GeminiLLMAdapter
from app.schemas.llm_output import ResumeExtractionResult


def extract_resume_structured(resume_text: str) -> ResumeExtractionResult:
    return GeminiLLMAdapter.from_settings().extract(resume_text)


__all__ = ["EXTRACTION_PROMPT", "extract_resume_structured"]
