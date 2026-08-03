"""Application settings loaded from environment variables."""

import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    # AI Service
    ai_service_port: int = field(
        default_factory=lambda: int(os.getenv("AI_SERVICE_PORT", "8000"))
    )
    ai_service_host: str = field(
        default_factory=lambda: os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    )

    # RabbitMQ
    rabbitmq_url: str = field(
        default_factory=lambda: os.getenv(
            "RABBITMQ_URL", "amqp://guest:guest@localhost:5672"
        )
    )

    # Supabase (for downloading resume files)
    supabase_url: str = field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_service_role_key: str = field(
        default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    )
    supabase_storage_bucket: str = field(
        default_factory=lambda: os.getenv("SUPABASE_STORAGE_BUCKET", "resumes")
    )

    # LLM (Gemini)
    gemini_api_key: str = field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    llm_model: str = field(
        default_factory=lambda: os.getenv("LLM_MODEL", "gemini-2.0-flash")
    )

    # RabbitMQ topology
    rabbitmq_exchange: str = "ai_recruitment_events"
    rabbitmq_queue: str = "resume_analysis_queue"
    routing_key_requested: str = "resume.analysis.requested"
    routing_key_completed: str = "resume.analysis.completed"
    routing_key_failed: str = "resume.analysis.failed"
    routing_key_dead: str = "resume.analysis.dead"
    rabbitmq_dead_letter_exchange: str = "ai_recruitment_dlx"
    rabbitmq_dead_letter_queue: str = "resume_analysis_dead_queue"


settings = Settings()
