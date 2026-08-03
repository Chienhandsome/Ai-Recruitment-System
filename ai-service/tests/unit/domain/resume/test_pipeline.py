from app.domain.resume import pipeline as pipeline_module
from app.domain.resume.models import ResumeParseCommand
from app.domain.resume.pipeline import ResumeParsingPipeline
from app.schemas.llm_output import ResumeExtractionResult


class FakeStorage:
    def download(self, object_path: str) -> bytes:
        assert object_path == "candidate/resume.pdf"
        return b"document"


class FakeLLM:
    def __init__(self) -> None:
        self.received_text = ""

    def extract(self, resume_text: str) -> ResumeExtractionResult:
        self.received_text = resume_text
        return ResumeExtractionResult(summary="Backend engineer")


def test_pipeline_orchestrates_through_ports(monkeypatch):
    extracted_text = "A" * 80
    monkeypatch.setattr(
        pipeline_module,
        "extract_text",
        lambda file_bytes, mime_type: extracted_text,
    )
    llm = FakeLLM()
    pipeline = ResumeParsingPipeline(FakeStorage(), llm)

    result = pipeline.run(
        ResumeParseCommand(
            resume_id="resume",
            candidate_profile_id="candidate",
            object_path="candidate/resume.pdf",
            mime_type="application/pdf",
            original_file_name="resume.pdf",
        )
    )

    assert llm.received_text == extracted_text
    assert result.summary == "Backend engineer"
