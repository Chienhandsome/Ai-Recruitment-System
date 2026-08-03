"""Domain step that invokes the model through its port."""

from app.ports.llm_port import LLMPort
from app.schemas.llm_output import ResumeExtractionResult


def extract_structured_resume(
    resume_text: str,
    llm: LLMPort,
) -> ResumeExtractionResult:
    return llm.extract(resume_text)
