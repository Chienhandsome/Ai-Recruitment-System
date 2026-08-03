"""RabbitMQ request and result message schemas."""

from pydantic import BaseModel, Field

from app.schemas.llm_output import ResumeExtractionResult


class ResumeAnalysisRequest(BaseModel):
    resume_id: str = Field(..., alias="resumeId")
    candidate_profile_id: str = Field(..., alias="candidateProfileId")
    object_path: str = Field(..., alias="objectPath")
    mime_type: str = Field(..., alias="mimeType")
    original_file_name: str = Field(..., alias="originalFileName")
    requested_at: str = Field(..., alias="requestedAt")
    signed_download_url: str | None = Field(default=None, alias="signedDownloadUrl")

    model_config = {"populate_by_name": True}


class ResumeAnalysisCompleted(BaseModel):
    resumeId: str
    candidateProfileId: str
    parsedData: ResumeExtractionResult
    completedAt: str


class ResumeAnalysisFailed(BaseModel):
    resumeId: str
    candidateProfileId: str
    errorMessage: str
    failedAt: str
