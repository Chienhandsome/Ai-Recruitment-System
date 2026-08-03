"""AI Recruitment HTTP service (the RabbitMQ worker is a separate process)."""

import logging
import os

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


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        service="ai-service",
        status="UP",
        version="0.2.0",
        worker="separate_process",
    )


@app.get("/")
async def root():
    return {
        "message": "AI Recruitment Service is running",
        "docs_url": "/docs",
        "worker_status": "separate_process",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    host = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
