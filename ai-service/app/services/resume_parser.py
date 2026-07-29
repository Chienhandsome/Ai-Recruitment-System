"""Resume parser service — orchestrates download, text extraction, and LLM analysis."""

import logging

from supabase import create_client

from app.core.config import settings
from app.schemas.resume_schemas import ResumeAnalysisRequest, ResumeExtractionResult
from app.services.llm_client import extract_resume_structured
from app.services.text_extractor import extract_text

logger = logging.getLogger(__name__)


def download_file_from_storage(object_path: str) -> bytes:
    """Download a file from Supabase Storage."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ValueError("Supabase credentials not configured")

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    logger.info(f"Downloading file: {object_path} from bucket '{settings.supabase_storage_bucket}'")

    response = client.storage.from_(settings.supabase_storage_bucket).download(object_path)

    if not response:
        raise ValueError(f"Failed to download file from storage: {object_path}")

    logger.info(f"Downloaded {len(response)} bytes")
    return response


def parse_resume(request: ResumeAnalysisRequest) -> ResumeExtractionResult:
    """
    Full resume parsing pipeline:
    1. Download file from Supabase Storage
    2. Extract text (PDF/DOCX)
    3. Send to LLM for structured extraction
    4. Return validated result
    """
    logger.info(
        f"Starting resume analysis: resume_id={request.resume_id}, "
        f"file={request.original_file_name}"
    )

    # Step 1: Download file
    file_bytes = download_file_from_storage(request.object_path)

    # Step 2: Extract text
    text = extract_text(file_bytes, request.mime_type)

    if not text or len(text.strip()) < 50:
        raise ValueError(
            f"Extracted text is too short ({len(text)} chars). "
            "The file may be scanned/image-based or empty."
        )

    logger.info(f"Extracted {len(text)} chars of text from resume")

    # Step 3: LLM structured extraction
    result = extract_resume_structured(text)

    logger.info(
        f"Resume analysis completed: resume_id={request.resume_id}, "
        f"skills={len(result.skills)}, experiences={len(result.work_experiences)}"
    )

    return result
