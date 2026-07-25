import os
from contextlib import asynccontextmanager

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

# pyrefly: ignore [missing-import]
from app.api.routes.matching import router as matching_router
# pyrefly: ignore [missing-import]
from app.services.matching.semantic import semantic_matcher

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up local embedding model on startup
    semantic_matcher.initialize()
    yield


app = FastAPI(
    title="AI Recruitment Service",
    description="Python FastAPI service for AI-assisted recruitment workflows",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(matching_router)


class HealthResponse(BaseModel):
    service: str
    status: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        service="ai-service",
        status="UP",
        version="0.1.0",
    )


@app.get("/")
async def root():
    return {
        "message": "AI Recruitment Service is running",
        "docs_url": "/docs",
        "matching_endpoint": "/api/v1/matching/evaluate",
    }


if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn

    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    host = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
