"""Assemble an enriched parsed-resume result from validated LLM output."""

from app.schemas.llm_output import LLMResumeExtraction, ResumeExtractionResult


def build_result(
    extraction: LLMResumeExtraction,
    *,
    llm_model: str,
    prompt_version: str,
    parser_version: str,
    raw_text_hash: str,
    extraction_duration_ms: int,
) -> ResumeExtractionResult:
    return ResumeExtractionResult.model_validate(
        {
            **extraction.model_dump(mode="python"),
            "llm_model": llm_model,
            "prompt_version": prompt_version,
            "parser_version": parser_version,
            "raw_text_hash": raw_text_hash,
            "extraction_duration_ms": extraction_duration_ms,
        }
    )
