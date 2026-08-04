from app.domain.resume import pipeline as pipeline_module
from app.domain.resume.models import ResumeParseCommand
from app.domain.resume.pipeline import ResumeParsingPipeline
from app.schemas.llm_output import LLMResumeExtraction


class FakeStorage:
    def download(self, object_path: str, signed_url: str | None = None) -> bytes:
        assert object_path == "candidate/resume.pdf"
        assert signed_url == "https://storage.example/signed"
        return b"%PDF-1.4 fake"


class FakeLLM:
    def __init__(self) -> None:
        self.received_text = ""

    def extract(self, resume_text: str) -> LLMResumeExtraction:
        self.received_text = resume_text
        return LLMResumeExtraction(
            summary="Backend engineer",
            overall_confidence=0.9,
            skills=[],
            work_experiences=[],
            educations=[],
            projects=[],
            certificates=[],
            languages=[],
        )

    @property
    def model_name(self) -> str:
        return "fake-model"


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
            signed_download_url="https://storage.example/signed",
        )
    )

    assert llm.received_text == extracted_text
    assert result.summary == "Backend engineer"
    assert result.overall_confidence == 0.9
    assert result.llm_model == "fake-model"
    assert result.prompt_version
    assert result.parser_version
    assert len(result.raw_text_hash or "") == 64
    assert result.extraction_duration_ms is not None
