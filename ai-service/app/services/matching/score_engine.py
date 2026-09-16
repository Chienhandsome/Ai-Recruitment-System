import math
from typing import Any, Dict, List

from app.schemas.matching import EvaluationRequest


class ScoreEngine:
    """
    Deterministic Weighted Compatibility Scoring Engine.
    Enforces:
    1. Exactly 4 Primary Criteria: Skills, Experience, Education, Certification & Language (Other).
    2. FinalScore = sum(Score_i * Weight_i) where weights sum to 100%.
    3. Strict separation of Weight and Mandatory Gate:
       - Weight = 0% contributes 0 points to FinalScore, but mandatory requirements still fail if unmet.
       - FinalScore is NEVER capped or artificially reduced by mandatory status.
       - Mandatory status (PASS, FAIL, NOT_APPLICABLE) and detailed failures are tracked independently.
    """

    def calculate(
        self, match_metrics: Dict[str, Any], request: EvaluationRequest
    ) -> Dict[str, Any]:
        weights = self._resolve_weights(request)

        skills_raw = float(match_metrics["skills"]["score"])
        exp_raw = float(match_metrics["experience"]["score"])
        edu_raw = float(match_metrics["education"]["score"])
        other_raw = float(match_metrics["other"]["score"])

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

        # Case W04: All zero weights (0 / 0 / 0 / 0)
        if total_weight <= 0.0:
            final_overall = 0.0
            max_skills = 0.0
            max_exp = 0.0
            max_edu = 0.0
            max_other = 0.0
            base_points = [0.0, 0.0, 0.0, 0.0]
        else:
            # Normalize weights so they strictly sum to 100%
            max_skills = round((weights["skills"] / float(total_weight)) * 100.0, 2)
            max_exp = round((weights["experience"] / float(total_weight)) * 100.0, 2)
            max_edu = round((weights["education"] / float(total_weight)) * 100.0, 2)
            max_other = round((weights["other"] / float(total_weight)) * 100.0, 2)

            base_points = [
                round(skills_raw * max_skills, 2),
                round(exp_raw * max_exp, 2),
                round(edu_raw * max_edu, 2),
                round(other_raw * max_other, 2),
            ]
            final_overall = max(0.0, min(100.0, round(sum(base_points), 2)))

        earned_skills, earned_exp, earned_edu, earned_other = base_points
        adj_skills, adj_exp, adj_edu, adj_other = 0.0, 0.0, 0.0, 0.0

        # Determine mandatory_score_cap when mandatory skills are missing
        mandatory_score_cap = None
        if mandatory_ratio is not None and mandatory_ratio < 1.0:
            if mandatory_ratio < 0.4:
                mandatory_score_cap = 39.0
            elif mandatory_ratio < 0.6:
                mandatory_score_cap = 59.0
            elif mandatory_ratio < 0.8:
                mandatory_score_cap = 74.0
            else:
                mandatory_score_cap = 84.0

        base_overall = final_overall
        if mandatory_score_cap is not None and final_overall > mandatory_score_cap:
            final_overall = mandatory_score_cap

        score_adjustment = round(final_overall - base_overall, 2)

        if final_overall < base_overall and base_overall > 0:
            scale = final_overall / base_overall
            earned_skills = round(base_points[0] * scale, 2)
            earned_exp = round(base_points[1] * scale, 2)
            earned_edu = round(base_points[2] * scale, 2)
            earned_other = round(base_points[3] * scale, 2)

            diff = round(
                final_overall
                - (earned_skills + earned_exp + earned_edu + earned_other),
                2,
            )
            if diff != 0.0:
                earned_skills = round(earned_skills + diff, 2)

            adj_skills = round(earned_skills - base_points[0], 2)
            adj_exp = round(earned_exp - base_points[1], 2)
            adj_edu = round(earned_edu - base_points[2], 2)
            adj_other = round(earned_other - base_points[3], 2)

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

        # --- INDEPENDENT MANDATORY GATE EVALUATION ---
        mandatory_failures: List[Dict[str, Any]] = []

        # 1. Skills mandatory evaluation
        missing_mandatory_skills = match_metrics["skills"].get("missing_mandatory", [])
        for skill_name in missing_mandatory_skills:
            mandatory_failures.append(
                {
                    "type": "SKILL",
                    "requirement": skill_name,
                    "candidateValue": "Chưa đáp ứng / Thiếu thâm niên yêu cầu",
                    "status": "FAIL",
                    "reason": f"Kỹ năng bắt buộc '{skill_name}' chưa đạt yêu cầu.",
                }
            )

        # 2. Experience mandatory evaluation
        job = request.job
        if job and getattr(job, "level_requirement_mode", "ADVISORY") == "REQUIRED":
            req_years = float(getattr(job, "required_experience_years", 0.0) or 0.0)
            cand_years = float(
                match_metrics["experience"].get("total_years", 0.0) or 0.0
            )
            # EPSILON_YEARS = 0.05 (~18 days tolerance for leap-year / calendar month boundary)
            EPSILON_YEARS = 0.05
            if req_years > 0.0 and (req_years - cand_years) > EPSILON_YEARS:
                mandatory_failures.append(
                    {
                        "type": "EXPERIENCE",
                        "requirement": f">= {req_years:.1f} năm kinh nghiệm",
                        "candidateValue": f"{cand_years:.1f} năm",
                        "status": "FAIL",
                        "reason": f"Yêu cầu tối thiểu {req_years:.1f} năm kinh nghiệm, ứng viên có {cand_years:.1f} năm.",
                    }
                )

        # 3. Education mandatory evaluation
        edu_failures = match_metrics["education"].get("failures", [])
        mandatory_failures.extend(edu_failures)

        # 4. Language & Certificate mandatory evaluation (Pillar 4)
        other_metrics = match_metrics.get("other", {})
        if isinstance(other_metrics, dict):
            lang_failures = other_metrics.get("language", {}).get("failures", [])
            mandatory_failures.extend(lang_failures)
            cert_failures = other_metrics.get("certificates", {}).get("failures", [])
            mandatory_failures.extend(cert_failures)
            direct_failures = other_metrics.get("failures", [])
            mandatory_failures.extend(direct_failures)

        # Sanitize mandatory_failures: keep only valid failure objects
        mandatory_failures = [
            f
            for f in mandatory_failures
            if isinstance(f, dict)
            and bool(f.get("requirement"))
            and f.get("status") == "FAIL"
        ]

        # Determine mandatory_status
        has_any_mandatory = (
            any(
                getattr(s, "is_mandatory", True)
                for s in getattr(job, "required_skills", []) or []
            )
            or any(
                getattr(c, "is_mandatory", True)
                for c in getattr(job, "required_certificates", []) or []
            )
            or any(
                getattr(l, "is_mandatory", False)
                for l in getattr(job, "required_languages", []) or []
            )
            or getattr(job, "level_requirement_mode", "ADVISORY") == "REQUIRED"
            or bool(match_metrics["education"].get("req_degree_level", 0) > 0)
            or len(mandatory_failures) > 0
        )

        if mandatory_failures:
            mandatory_status = "FAIL"
        elif has_any_mandatory:
            mandatory_status = "PASS"
        else:
            mandatory_status = "NOT_APPLICABLE"

        score_breakdown = {
            "skills": {
                "earned_points": earned_skills,
                "base_points": base_points[0],
                "adjustment_points": adj_skills,
                "max_points": max_skills,
                "weight_pct": max_skills,
                "normalized_score": skills_score,
            },
            "experience": {
                "earned_points": earned_exp,
                "base_points": base_points[1],
                "adjustment_points": adj_exp,
                "max_points": max_exp,
                "weight_pct": max_exp,
                "normalized_score": exp_score,
            },
            "education": {
                "earned_points": earned_edu,
                "base_points": base_points[2],
                "adjustment_points": adj_edu,
                "max_points": max_edu,
                "weight_pct": max_edu,
                "normalized_score": edu_score,
            },
            "other": {
                "earned_points": earned_other,
                "base_points": base_points[3],
                "adjustment_points": adj_other,
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
            "mandatory_status": mandatory_status,
            "mandatory_failures": mandatory_failures,
            "base_score": base_overall,
            "mandatory_score_cap": mandatory_score_cap,
            "score_adjustment": score_adjustment,
        }

    def _resolve_weights(self, request: EvaluationRequest) -> Dict[str, float]:
        raw_weights = None
        if request.weights:
            raw_weights = {
                "skills": float(request.weights.skills),
                "experience": float(request.weights.experience),
                "education": float(request.weights.education),
                "other": float(request.weights.other),
            }
        elif request.job and request.job.ai_weights_config:
            cfg = request.job.ai_weights_config
            raw_weights = {
                "skills": float(cfg.skills),
                "experience": float(cfg.experience),
                "education": float(cfg.education),
                "other": float(cfg.other),
            }
        else:
            return {
                "skills": 40.0,
                "experience": 30.0,
                "education": 15.0,
                "other": 15.0,
            }

        # Strict validation
        for name, val in raw_weights.items():
            if math.isnan(val) or val < 0.0 or val > 100.0:
                raise ValueError(
                    f"Invalid weight for '{name}': {val}. Weights must be numbers between 0 and 100."
                )

        return raw_weights


score_engine = ScoreEngine()
