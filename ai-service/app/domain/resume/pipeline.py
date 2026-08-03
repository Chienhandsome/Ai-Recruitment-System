"""Infrastructure-independent resume parsing orchestration."""

import logging

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

        file_bytes = self._storage.download(request.object_path)
        validate_resume_file(file_bytes, request.mime_type)
        raw_text = extract_text(file_bytes, request.mime_type)
        prepared_text = preprocess_text(raw_text)
        extraction = extract_structured_resume(prepared_text, self._llm)
        extraction = apply_experience_duration(extraction)
        return build_result(extraction)
