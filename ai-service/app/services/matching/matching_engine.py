import time
from typing import Dict, List

# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest, EvaluationResponse
from app.services.matching.generic_matcher import generic_matching_engine
from app.services.matching.score_engine import score_engine
from app.services.matching.explainability_engine import explainability_engine
from app.services.matching.llm_adjudicator import llm_adjudicator

# pyrefly: ignore [missing-import]
from app.utils.logger import StepTimer, log_evaluation_step


class MatchingEngine:
    """
    Main Facade / Orchestrator for the AI Matching Pipeline.
    Coordinates Universal Evidence Matching -> Score Calculation -> LLM Semantic Adjudication -> Explainability Generation.
    """

    def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        start_time = time.perf_counter()

        cand_profile = request.candidate_profile
        job = request.job

        # STEP 1: Generic Matching Engine (Raw Vector/Exact Metrics)
        with StepTimer("Generic Matching Engine"):
            match_metrics = generic_matching_engine.evaluate(cand_profile, job)

        # STEP 2: Score Engine (Apply HR Weights & Hard Gates)
        with StepTimer("Score Engine"):
            final_scores = score_engine.calculate(match_metrics, request)

        # STEP 2.5: LLM Adjudicator (Semantic Depth, Project Impact & Borderline Verification)
        with StepTimer("LLM Adjudicator"):
            try:
                llm_res = llm_adjudicator.adjudicate(
                    cand_profile=cand_profile,
                    job=job,
                    match_metrics=match_metrics,
                    final_scores=final_scores,
                )
                if llm_res:
                    # Bounded adjustment (-5.0 to +5.0)
                    adj = max(-5.0, min(5.0, llm_res.project_impact_score))
                    if not llm_res.borderline_skill_confirmed and final_scores["overall_score"] > 60.0:
                        adj -= 2.0

                    new_overall = round(final_scores["overall_score"] + adj, 1)

                    # Strictly preserve mandatory score cap (Hard Gate protection)
                    cap = final_scores.get("mandatory_score_cap")
                    if cap is not None and new_overall > cap:
                        new_overall = cap

                    new_overall = max(0.0, min(100.0, new_overall))
                    final_scores["overall_score"] = new_overall
                    final_scores["match_level"] = (
                        "HIGH"
                        if new_overall >= 75.0
                        else ("MEDIUM" if new_overall >= 50.0 else "LOW")
                    )
                    final_scores["llm_reasoning"] = llm_res.concise_reasoning
                    final_scores["llm_adjudication"] = {
                        "project_impact_score": llm_res.project_impact_score,
                        "borderline_skill_confirmed": llm_res.borderline_skill_confirmed,
                        "seniority_depth_multiplier": llm_res.seniority_depth_multiplier,
                        "concise_reasoning": llm_res.concise_reasoning,
                    }
            except Exception as e:
                # LLM failure must never break core evaluation
                pass

        # STEP 3: Explainability Engine (Human-readable Strengths/Gaps)
        with StepTimer("Explainability Engine"):
            candidate_name = (
                cand_profile.profile.desired_title
                if cand_profile.profile
                else "Ứng viên"
            )
            explanations = explainability_engine.explain(
                metrics=match_metrics,
                scores=final_scores,
                candidate_name=candidate_name or "Ứng viên",
                job_title=job.title,
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
            mandatory_status=final_scores.get("mandatory_status", "PASS"),
            mandatory_failures=final_scores.get("mandatory_failures", []),
            score_breakdown=final_scores.get("score_breakdown"),
            pillar_explanations=explanations.get("pillar_explanations"),
            strengths=explanations["strengths"],
            gaps=explanations["gaps"],
            matched_skills=match_metrics["skills"]["matched"],
            missing_skills=match_metrics["skills"]["missing"],
            missing_required_skills=match_metrics["skills"]["missing_mandatory"],
            evidence=match_metrics["skills"]["evidence"],
            confidence_score=final_scores["confidence_score"],
            evidence_confidence=match_metrics.get("audit", {}).get(
                "evidence_confidence", 1.0
            ),
            domain_compatibility=final_scores["domain_compatibility"],
            mandatory_ratio=final_scores["mandatory_ratio"],
            base_score=final_scores["base_score"],
            mandatory_score_cap=final_scores["mandatory_score_cap"],
            score_adjustment=final_scores["score_adjustment"],
            temporal_recency_score=1.0,
            inflation_flags=match_metrics.get("audit", {}).get("inflation_flags", []),
            career_velocity=match_metrics.get("career_velocity"),
            summary=explanations["summary"],
            experience_assessment=match_metrics["experience"].get("level_assessment"),
            llm_reasoning=final_scores.get("llm_reasoning"),
            llm_adjudication=final_scores.get("llm_adjudication"),
        )


# Singleton engine instance
matching_engine = MatchingEngine()

