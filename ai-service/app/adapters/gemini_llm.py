"""Gemini implementation of the structured resume extraction port."""

import json
import logging

import google.generativeai as genai
from google.api_core.exceptions import (
    DeadlineExceeded,
    ResourceExhausted,
    ServiceUnavailable,
)
from pydantic import ValidationError

from app.core.config import settings
from app.domain.resume.exceptions import PermanentError, TransientError
from app.schemas.llm_output import ResumeExtractionResult

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are an AI assistant that extracts structured
information from resumes/CVs.

Given the raw text content of a resume, extract the following information and
return it as valid JSON matching this exact schema:

{
  "summary": "Brief professional summary (2-3 sentences)",
  "desired_title": "Most likely desired job title based on experience",
  "total_years_experience": <number or null>,
  "skills": [{
    "name": "<skill name>",
    "proficiency_level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
  }],
  "work_experiences": [{
    "company_name": "<company>", "position_title": "<title>",
    "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD" or null,
    "is_current": true/false, "description": "<responsibilities>",
    "achievements": "<key achievements>" or null
  }],
  "educations": [{
    "school_name": "<school>", "major": "<major>" or null,
    "degree": "<degree>" or null, "start_date": "YYYY-MM-DD" or null,
    "end_date": "YYYY-MM-DD" or null, "description": null
  }],
  "projects": [{
    "project_name": "<name>", "project_role": "<role>" or null,
    "description": "<description>" or null, "technologies": ["tech1", "tech2"] or null,
    "project_url": "<url>" or null, "start_date": "YYYY-MM-DD" or null,
    "end_date": "YYYY-MM-DD" or null
  }],
  "certificates": [{
    "certificate_name": "<name>", "issuing_organization": "<org>",
    "issue_date": "YYYY-MM-DD" or null, "expiry_date": "YYYY-MM-DD" or null,
    "credential_url": "<url>" or null
  }]
}

Rules:
- For dates: if only year is available, use YYYY-01-01. If month+year, use YYYY-MM-01.
- Estimate proficiency from years of experience and context.
- Extract all skills mentioned, including programming, tools, and soft skills.
- If issuing_organization is unknown, use "Unknown".
- Return only valid JSON, without markdown or extra text.
"""


class GeminiLLMAdapter:
    def __init__(self, api_key: str, model_name: str) -> None:
        self._api_key = api_key
        self._model_name = model_name

    @classmethod
    def from_settings(cls) -> "GeminiLLMAdapter":
        return cls(settings.gemini_api_key, settings.llm_model)

    def extract(self, resume_text: str) -> ResumeExtractionResult:
        if not self._api_key:
            raise PermanentError("GEMINI_API_KEY is not configured")

        genai.configure(api_key=self._api_key)
        model = genai.GenerativeModel(self._model_name)
        prompt = (
            "Extract structured information from the following resume:\n\n"
            f"---\n{resume_text}\n---"
        )

        try:
            response = model.generate_content(
                [{"role": "user", "parts": [EXTRACTION_PROMPT + "\n\n" + prompt]}],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            parsed = json.loads(response.text.strip())
            result = ResumeExtractionResult.model_validate(parsed)
            logger.info(
                "Gemini extracted %d skills and %d experiences",
                len(result.skills),
                len(result.work_experiences),
            )
            return result
        except (ResourceExhausted, ServiceUnavailable, DeadlineExceeded) as exc:
            raise TransientError(f"Gemini is temporarily unavailable: {exc}") from exc
        except (json.JSONDecodeError, ValidationError) as exc:
            raise PermanentError(
                f"Gemini returned invalid structured output: {exc}"
            ) from exc
        except (TransientError, PermanentError):
            raise
        except Exception as exc:
            raise PermanentError(f"Gemini extraction failed: {exc}") from exc
