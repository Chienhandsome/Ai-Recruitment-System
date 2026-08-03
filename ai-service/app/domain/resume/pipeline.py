"""Infrastructure-independent resume parsing orchestration."""

import hashlib
import logging
import time

from app.core.config import settings
from app.domain.resume.models import ResumeParseCommand
from app.domain.resume.steps.date_calculator import apply_experience_duration
from app.domain.resume.steps.file_validator import validate_resume_file
from app.domain.resume.steps.llm_extractor import extract_structured_resume
from app.domain.resume.steps.result_builder import build_result
from app.domain.resume.steps.text_extractor import extract_text
from app.domain.resume.steps.text_preprocessor import preprocess_text
from app.ports.llm_port import LLMPort
from app.ports.storage_port import StoragePort
from app.schemas.llm_output import ResumeExtractionResult

logger = logging.getLogger(__name__)


class ResumeParsingPipeline:
    def __init__(self, storage: StoragePort, llm: LLMPort) -> None:
        self._storage = storage
        self._llm = llm

    def run(self, request: ResumeParseCommand) -> ResumeExtractionResult:
        logger.info(
            "Starting resume analysis: resume_id=%s, file=%s",
            request.resume_id,
            request.original_file_name,
        )

        file_bytes = self._storage.download(
            request.object_path,
            request.signed_download_url,
        )
        detected_mime = validate_resume_file(file_bytes, request.mime_type)
        raw_text = extract_text(file_bytes, detected_mime)
        prepared_text = preprocess_text(raw_text)
        started_at = time.perf_counter()
        extraction = extract_structured_resume(prepared_text, self._llm)
        duration_ms = int((time.perf_counter() - started_at) * 1000)
        result = build_result(
            extraction,
            llm_model=self._llm.model_name,
            prompt_version=settings.prompt_version,
            parser_version=settings.parser_version,
            raw_text_hash=hashlib.sha256(prepared_text.encode()).hexdigest(),
            extraction_duration_ms=duration_ms,
        )
        return apply_experience_duration(result)
