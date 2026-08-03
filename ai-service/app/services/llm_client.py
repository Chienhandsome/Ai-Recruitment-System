"""LLM client for structured resume extraction using Google Gemini."""

import json
import logging

import google.generativeai as genai

from app.core.config import settings
from app.schemas.resume_schemas import ResumeExtractionResult

logger = logging.getLogger(__name__)

# System prompt for structured CV extraction
EXTRACTION_PROMPT = """You are an AI assistant that extracts structured information from resumes/CVs.

Given the raw text content of a resume, extract the following information and return it as valid JSON matching this exact schema:

{
  "summary": "Brief professional summary (2-3 sentences)",
  "desired_title": "Most likely desired job title based on experience",
  "total_years_experience": <number or null>,
  "skills": [
    {
      "name": "<skill name>",
      "proficiency_level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
    }
  ],
  "work_experiences": [
    {
      "company_name": "<company>",
      "position_title": "<title>",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD" or null,
      "is_current": true/false,
      "description": "<responsibilities>",
      "achievements": "<key achievements>" or null
    }
  ],
  "educations": [
    {
      "school_name": "<school>",
      "major": "<major>" or null,
      "degree": "<degree>" or null,
      "start_date": "YYYY-MM-DD" or null,
      "end_date": "YYYY-MM-DD" or null,
      "description": null
    }
  ],
  "projects": [
    {
      "project_name": "<name>",
      "project_role": "<role>" or null,
      "description": "<description>" or null,
      "technologies": ["tech1", "tech2"] or null,
      "project_url": "<url>" or null,
      "start_date": "YYYY-MM-DD" or null,
      "end_date": "YYYY-MM-DD" or null
    }
  ],
  "certificates": [
    {
      "certificate_name": "<name>",
      "issuing_organization": "<org>",
      "issue_date": "YYYY-MM-DD" or null,
      "expiry_date": "YYYY-MM-DD" or null,
      "credential_url": "<url>" or null
    }
  ]
}

Rules:
- For dates: if only year is available, use YYYY-01-01. If month+year, use YYYY-MM-01.
- For proficiency_level: estimate based on years of experience and context.
  - BEGINNER: <1 year or mentioned briefly
  - INTERMEDIATE: 1-3 years or moderate usage
  - ADVANCED: 3-5 years or significant usage
  - EXPERT: 5+ years or expert-level described
- Extract ALL skills mentioned (programming languages, frameworks, tools, soft skills).
- If issuing_organization for a certificate is unknown, use "Unknown".
- Return ONLY valid JSON, no markdown, no extra text.
"""


def extract_resume_structured(resume_text: str) -> ResumeExtractionResult:
    """Send resume text to Gemini and parse the structured extraction result."""

    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not configured")

    genai.configure(api_key=settings.gemini_api_key)

    model = genai.GenerativeModel(settings.llm_model)

    user_prompt = f"Extract structured information from the following resume:\n\n---\n{resume_text}\n---"

    logger.info(f"Sending {len(resume_text)} chars to Gemini ({settings.llm_model})")

    try:
        response = model.generate_content(
            [
                {"role": "user", "parts": [EXTRACTION_PROMPT + "\n\n" + user_prompt]},
            ],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )

        raw_text = response.text.strip()
        logger.info(f"Received {len(raw_text)} chars from Gemini")

        # Parse JSON response
        parsed = json.loads(raw_text)
        result = ResumeExtractionResult.model_validate(parsed)

        logger.info(
            f"Extraction result: {len(result.skills)} skills, "
            f"{len(result.work_experiences)} experiences, "
            f"{len(result.educations)} educations, "
            f"{len(result.projects)} projects, "
            f"{len(result.certificates)} certificates"
        )

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        raise ValueError(f"LLM returned invalid JSON: {e}") from e
    except Exception as e:
        logger.error(f"Gemini extraction failed: {e}")
        raise ValueError(f"LLM extraction failed: {e}") from e
