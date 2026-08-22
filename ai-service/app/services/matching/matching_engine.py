import time
from typing import Dict, List
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest, EvaluationResponse
from app.services.matching.generic_matcher import generic_matching_engine
from app.services.matching.score_engine import score_engine
from app.services.matching.explainability_engine import explainability_engine
# pyrefly: ignore [missing-import]
from app.utils.logger import StepTimer, log_evaluation_step

class MatchingEngine:
    """
    Main Facade / Orchestrator for the AI Matching Pipeline.
    Coordinates Universal Evidence Matching -> Score Calculation -> Explainability Generation.
    """

    def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        start_time = time.perf_counter()

        cand_profile = request.candidate_profile
        job = request.job

        # STEP 1: Generic Matching Engine (Raw Vector/Exact Metrics)
        with StepTimer("Generic Matching Engine"):
            match_metrics = generic_matching_engine.evaluate(cand_profile, job)

        # STEP 2: Score Engine (Apply HR Weights)
        with StepTimer("Score Engine"):
            final_scores = score_engine.calculate(match_metrics, request)

        # STEP 3: Explainability Engine (Human-readable Strengths/Gaps)
        with StepTimer("Explainability Engine"):
            candidate_name = cand_profile.profile.desired_title if cand_profile.profile else "Ứng viên"
            explanations = explainability_engine.explain(
                metrics=match_metrics, 
                scores=final_scores, 
                candidate_name=candidate_name or "Ứng viên", 
                job_title=job.title
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        log_evaluation_step(
            "OverallEvaluationComplete",
            {
                "application_id": request.application_id,
                "overall_score": final_scores["overall_score"],
                "match_level": final_scores["match_level"],
                "execution_time_ms": round(elapsed_ms, 2),
            },
        )

        return EvaluationResponse(
            overall_score=final_scores["overall_score"],
            match_level=final_scores["match_level"],
            skills_score=final_scores["skills_score"],
            experience_score=final_scores["experience_score"],
            education_score=final_scores["education_score"],
            other_score=final_scores["other_score"],
            score_breakdown=final_scores.get("score_breakdown"),
            pillar_explanations=explanations.get("pillar_explanations"),
            strengths=explanations["strengths"],
            gaps=explanations["gaps"],
            matched_skills=match_metrics["skills"]["matched"],
            missing_skills=match_metrics["skills"]["missing"],
            missing_required_skills=match_metrics["skills"]["missing_mandatory"],
            evidence=match_metrics["skills"]["evidence"],
            confidence_score=final_scores["confidence_score"],
            summary=explanations["summary"],
            experience_assessment=match_metrics["experience"].get("level_assessment"),
        )

# Singleton engine instance
matching_engine = MatchingEngine()
