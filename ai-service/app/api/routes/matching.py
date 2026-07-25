# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest, EvaluationResponse
# pyrefly: ignore [missing-import]
from app.services.matching.matching_engine import matching_engine

router = APIRouter(prefix="/api/v1/matching", tags=["Matching"])


@router.post(
    "/evaluate",
    response_model=EvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate candidate profile against job description",
    description="Calculates skills, experience, education, project scores, and overall match level.",
)
async def evaluate_candidate(request: EvaluationRequest) -> EvaluationResponse:
    try:
        response = matching_engine.evaluate(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during evaluation: {str(exc)}",
        )
