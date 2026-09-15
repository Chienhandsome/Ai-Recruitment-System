from typing import Dict, Any
from app.schemas.matching import EvaluationRequest


class ScoreEngine:
    """
    Weighted compatibility scoring engine.

    The component scores already include domain relevance and skill-match quality.
    Missing mandatory skills therefore limit the maximum attainable score instead
    of multiplying every pillar by another global penalty. Evidence confidence is
    diagnostic metadata and never changes candidate-job compatibility.
    """

    @staticmethod
    def _mandatory_score_cap(mandatory_ratio: float) -> float | None:
        """Return the score ceiling for the achieved mandatory-skill ratio."""
        ratio = max(0.0, min(1.0, float(mandatory_ratio)))
        if ratio >= 0.80:
            return None
        if ratio >= 0.60:
            return 74.0
        if ratio >= 0.40:
            return 59.0
        return 39.0

    @staticmethod
    def _allocate_capped_points(
        base_points: list[float], final_overall: float
    ) -> list[float]:
        """Allocate a score-cap reduction proportionally and preserve the sum."""
        base_overall = sum(base_points)
        if base_overall <= 0.0 or final_overall >= base_overall:
            return [round(point, 2) for point in base_points]

        scale = final_overall / base_overall
        allocated = [round(point * scale, 2) for point in base_points[:-1]]
        allocated.append(round(final_overall - sum(allocated), 2))
        return allocated

    def calculate(
        self, match_metrics: Dict[str, Any], request: EvaluationRequest
    ) -> Dict[str, Any]:
        weights = self._resolve_weights(request)

        skills_raw = match_metrics["skills"]["score"]
        exp_raw = match_metrics["experience"]["score"]
        edu_raw = match_metrics["education"]["score"]
        other_raw = match_metrics["other"]["score"]

        mandatory_ratio = match_metrics["skills"].get("mandatory_ratio", 1.0)
        domain_compat = float(match_metrics.get("domain_compatibility", 1.0))

        # Scale component raw scores to 0-100
        skills_score = round(skills_raw * 100.0, 2)
        exp_score = round(exp_raw * 100.0, 2)
        edu_score = round(edu_raw * 100.0, 2)
        other_score = round(other_raw * 100.0, 2)

        total_weight = (
            weights["skills"]
            + weights["experience"]
            + weights["education"]
            + weights["other"]
        )
        if total_weight <= 0:
            total_weight = 100.0

        # Calculate max points per pillar based on normalized weights
        max_skills = round((weights["skills"] / float(total_weight)) * 100.0, 1)
        max_exp = round((weights["experience"] / float(total_weight)) * 100.0, 1)
        max_edu = round((weights["education"] / float(total_weight)) * 100.0, 1)
        max_other = round((weights["other"] / float(total_weight)) * 100.0, 1)

        # Component matchers already account for domain relevance. Keep their
        # weighted contribution as the base score without another global factor.
        base_points = [
            round(skills_raw * max_skills, 2),
            round(exp_raw * max_exp, 2),
            round(edu_raw * max_edu, 2),
            round(other_raw * max_other, 2),
        ]
        base_overall = max(0.0, min(100.0, round(sum(base_points), 2)))

        # Mandatory requirements act as an eligibility ceiling. They no longer
        # suppress unrelated education/certificate scores exponentially.
        mandatory_score_cap = self._mandatory_score_cap(mandatory_ratio)
        final_overall = (
            min(base_overall, mandatory_score_cap)
            if mandatory_score_cap is not None
            else base_overall
        )
        final_overall = round(final_overall, 2)

        earned_skills, earned_exp, earned_edu, earned_other = (
            self._allocate_capped_points(base_points, final_overall)
        )

        match_level = (
            "HIGH"
            if final_overall >= 75.0
            else ("MEDIUM" if final_overall >= 50.0 else "LOW")
        )

        # Confidence score based on profile richness
        profile = request.candidate_profile
        data_pts = (
            len(profile.skills)
            + len(profile.work_experiences)
            + len(profile.projects)
            + len(profile.educations)
            + len(profile.certificates)
        )
        conf = (
            0.3
            if data_pts < 3
            else (0.6 if data_pts < 7 else (0.85 if data_pts < 12 else 1.0))
        )

        score_breakdown = {
            "skills": {
                "earned_points": earned_skills,
                "base_points": base_points[0],
                "adjustment_points": round(earned_skills - base_points[0], 2),
                "max_points": max_skills,
                "weight_pct": max_skills,
                "normalized_score": skills_score,
            },
            "experience": {
                "earned_points": earned_exp,
                "base_points": base_points[1],
                "adjustment_points": round(earned_exp - base_points[1], 2),
                "max_points": max_exp,
                "weight_pct": max_exp,
                "normalized_score": exp_score,
            },
            "education": {
                "earned_points": earned_edu,
                "base_points": base_points[2],
                "adjustment_points": round(earned_edu - base_points[2], 2),
                "max_points": max_edu,
                "weight_pct": max_edu,
                "normalized_score": edu_score,
            },
            "other": {
                "earned_points": earned_other,
                "base_points": base_points[3],
                "adjustment_points": round(earned_other - base_points[3], 2),
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
            "mandatory_ratio": round(mandatory_ratio, 3),
            "base_score": base_overall,
            "mandatory_score_cap": mandatory_score_cap,
            "score_adjustment": round(final_overall - base_overall, 2),
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
