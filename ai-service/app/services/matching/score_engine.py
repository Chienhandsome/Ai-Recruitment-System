from typing import Dict, Any
from app.schemas.matching import EvaluationRequest

class ScoreEngine:
    """
    Mathematical Gated Compatibility Scoring Engine (V3.1):
    100% Continuous & Mathematical.
    
    Formula:
    S_overall = 100 * [ (0.35 + 0.65 * domain_compat) * Sum(w_k * S_k) ] * Psi_mandatory(R_man)
    """

    def calculate(self, match_metrics: Dict[str, Any], request: EvaluationRequest) -> Dict[str, Any]:
        weights = self._resolve_weights(request)

        skills_raw = match_metrics["skills"]["score"]
        exp_raw = match_metrics["experience"]["score"]
        edu_raw = match_metrics["education"]["score"]
        other_raw = match_metrics["other"]["score"]

        mandatory_ratio = match_metrics["skills"].get("mandatory_ratio", 1.0)
        domain_compat = match_metrics.get("domain_compatibility", 1.0)

        # Scale component raw scores to 0-100
        skills_score = round(skills_raw * 100.0, 2)
        exp_score = round(exp_raw * 100.0, 2)
        edu_score = round(edu_raw * 100.0, 2)
        other_score = round(other_raw * 100.0, 2)

        total_weight = weights["skills"] + weights["experience"] + weights["education"] + weights["other"]
        if total_weight <= 0: total_weight = 100.0

        weighted_competency = (
            weights["skills"] * skills_raw +
            weights["experience"] * exp_raw +
            weights["education"] * edu_raw +
            weights["other"] * other_raw
        ) / float(total_weight)

        # 1. Macro Compatibility Gating (Domain Compatibility Gate)
        gated_score = weighted_competency * (0.35 + 0.65 * domain_compat)

        # 2. Mandatory Satisfiability Multiplier (Psi_mandatory)
        if mandatory_ratio >= 1.0:
            psi_mandatory = 1.0
        elif mandatory_ratio >= 0.50:
            psi_mandatory = 0.85 + (0.15 * mandatory_ratio)
        else:
            psi_mandatory = max(0.20, 0.40 + (0.40 * mandatory_ratio))

        final_ratio = gated_score * psi_mandatory
        final_overall = round(final_ratio * 100.0, 2)

        match_level = "HIGH" if final_overall >= 75.0 else ("MEDIUM" if final_overall >= 50.0 else "LOW")

        # Confidence score based on profile richness
        profile = request.candidate_profile
        data_pts = len(profile.skills) + len(profile.work_experiences) + len(profile.projects) + len(profile.educations) + len(profile.certificates)
        conf = 0.3 if data_pts < 3 else (0.6 if data_pts < 7 else (0.85 if data_pts < 12 else 1.0))

        return {
            "overall_score": final_overall,
            "skills_score": skills_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "other_score": other_score,
            "match_level": match_level,
            "confidence_score": conf,
            "domain_compatibility": round(domain_compat, 3),
            "mandatory_ratio": round(mandatory_ratio, 2)
        }

    def _resolve_weights(self, request: EvaluationRequest) -> Dict[str, float]:
        if request.weights:
            return {
                "skills": float(request.weights.skills),
                "experience": float(request.weights.experience),
                "education": float(request.weights.education),
                "other": float(request.weights.other),
            }
        if request.job and request.job.ai_weights_config:
            cfg = request.job.ai_weights_config
            return {
                "skills": float(cfg.skills),
                "experience": float(cfg.experience),
                "education": float(cfg.education),
                "other": float(cfg.other),
            }
        return {"skills": 40.0, "experience": 30.0, "education": 15.0, "other": 15.0}

score_engine = ScoreEngine()
