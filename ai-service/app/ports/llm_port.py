"""Port for structured resume extraction providers."""

from typing import Protocol

from app.schemas.llm_output import ResumeExtractionResult


class LLMPort(Protocol):
    def extract(self, resume_text: str) -> ResumeExtractionResult: ...
