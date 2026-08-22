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

        # Calculate max points per pillar based on normalized weights
        max_skills = round((weights["skills"] / float(total_weight)) * 100.0, 1)
        max_exp = round((weights["experience"] / float(total_weight)) * 100.0, 1)
        max_edu = round((weights["education"] / float(total_weight)) * 100.0, 1)
        max_other = round((weights["other"] / float(total_weight)) * 100.0, 1)

        # 1. Macro Compatibility Gating (Domain Compatibility Gate)
        domain_factor = (0.35 + 0.65 * domain_compat)

        # 2. Mandatory Satisfiability Multiplier (Psi_mandatory)
        if mandatory_ratio >= 1.0:
            psi_mandatory = 1.0
        elif mandatory_ratio >= 0.50:
            psi_mandatory = 0.85 + (0.15 * mandatory_ratio)
        else:
            psi_mandatory = max(0.20, 0.40 + (0.40 * mandatory_ratio))

        effective_multiplier = domain_factor * psi_mandatory

        # Exact earned points per pillar
        earned_skills = round(skills_raw * max_skills * effective_multiplier, 2)
        earned_exp = round(exp_raw * max_exp * effective_multiplier, 2)
        earned_edu = round(edu_raw * max_edu * effective_multiplier, 2)
        earned_other = round(other_raw * max_other * effective_multiplier, 2)

        final_overall = round(earned_skills + earned_exp + earned_edu + earned_other, 2)
        final_overall = max(0.0, min(100.0, final_overall))

        match_level = "HIGH" if final_overall >= 75.0 else ("MEDIUM" if final_overall >= 50.0 else "LOW")

        # Confidence score based on profile richness
        profile = request.candidate_profile
        data_pts = len(profile.skills) + len(profile.work_experiences) + len(profile.projects) + len(profile.educations) + len(profile.certificates)
        conf = 0.3 if data_pts < 3 else (0.6 if data_pts < 7 else (0.85 if data_pts < 12 else 1.0))

        score_breakdown = {
            "skills": {
                "earned_points": earned_skills,
                "max_points": max_skills,
                "weight_pct": max_skills,
                "normalized_score": skills_score,
            },
            "experience": {
                "earned_points": earned_exp,
                "max_points": max_exp,
                "weight_pct": max_exp,
                "normalized_score": exp_score,
            },
            "education": {
                "earned_points": earned_edu,
                "max_points": max_edu,
                "weight_pct": max_edu,
                "normalized_score": edu_score,
            },
            "other": {
                "earned_points": earned_other,
                "max_points": max_other,
                "weight_pct": max_other,
                "normalized_score": other_score,
            },
        }

        return {
            "overall_score": final_overall,
            "skills_score": skills_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "other_score": other_score,
            "score_breakdown": score_breakdown,
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
