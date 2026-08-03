"""Port for structured resume extraction providers."""

from typing import Protocol

from app.schemas.llm_output import LLMResumeExtraction


class LLMPort(Protocol):
    @property
    def model_name(self) -> str: ...

    def extract(self, resume_text: str) -> LLMResumeExtraction: ...
