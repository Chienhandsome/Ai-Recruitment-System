"""AI Recruitment Service — FastAPI app with background RabbitMQ worker."""

import logging
import os
import threading

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Recruitment Service",
    description="Python FastAPI service for AI-assisted recruitment workflows",
    version="0.2.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
from app.api.routes.matching import router as matching_router  # noqa: E402

app.include_router(matching_router)


class HealthResponse(BaseModel):
    service: str
    status: str
    version: str
    worker: str


# Track worker status
_worker_status = "not_started"


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        service="ai-service",
        status="UP",
        version="0.2.0",
        worker=_worker_status,
    )


@app.get("/")
async def root():
    return {
        "message": "AI Recruitment Service is running",
        "docs_url": "/docs",
        "worker_status": _worker_status,
    }


@app.on_event("startup")
async def startup_event():
    """Start the RabbitMQ worker in a background thread on app startup."""
    global _worker_status

    # Only start worker if RabbitMQ URL is configured
    rabbitmq_url = os.getenv("RABBITMQ_URL", "")
    if not rabbitmq_url or "guest:guest@localhost" in rabbitmq_url:
        logger.warning(
            "RABBITMQ_URL not configured or using localhost default. "
            "Resume worker will NOT start."
        )
        _worker_status = "disabled"
        return

    def run_worker():
        global _worker_status
        try:
            _worker_status = "running"
            logger.info("Starting resume worker in background thread...")
            from app.workers.resume_worker import start_worker
            start_worker()
        except Exception as e:
            _worker_status = f"failed: {e}"
            logger.error(f"Resume worker failed: {e}", exc_info=True)

    worker_thread = threading.Thread(target=run_worker, daemon=True, name="resume-worker")
    worker_thread.start()
    logger.info("Resume worker thread started")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    host = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
