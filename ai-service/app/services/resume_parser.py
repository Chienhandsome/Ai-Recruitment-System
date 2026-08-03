"""Compatibility facade for the refactored resume parsing pipeline."""

from app.adapters.gemini_llm import GeminiLLMAdapter
from app.adapters.supabase_storage import SupabaseStorageAdapter
from app.domain.resume.models import ResumeParseCommand
from app.domain.resume.pipeline import ResumeParsingPipeline
from app.schemas.llm_output import ResumeExtractionResult
from app.schemas.mq_messages import ResumeAnalysisRequest


def download_file_from_storage(
    object_path: str,
    signed_url: str | None = None,
) -> bytes:
    return SupabaseStorageAdapter.from_settings().download(object_path, signed_url)


def parse_resume(request: ResumeAnalysisRequest) -> ResumeExtractionResult:
    pipeline = ResumeParsingPipeline(
        storage=SupabaseStorageAdapter.from_settings(),
        llm=GeminiLLMAdapter.from_settings(),
    )
    return pipeline.run(
        ResumeParseCommand(
            resume_id=request.resume_id,
            candidate_profile_id=request.candidate_profile_id,
            object_path=request.object_path,
            mime_type=request.mime_type,
            original_file_name=request.original_file_name,
            signed_download_url=request.signed_download_url,
        )
    )
