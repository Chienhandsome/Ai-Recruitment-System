import time
from typing import Dict, List
# pyrefly: ignore [missing-import]
from app.schemas.matching import EvaluationRequest, EvaluationResponse
# pyrefly: ignore [missing-import]
from app.services.matching.education_matcher import EducationMatcher
# pyrefly: ignore [missing-import]
from app.services.matching.experience_matcher import ExperienceMatcher
# pyrefly: ignore [missing-import]
from app.services.matching.project_matcher import ProjectMatcher
# pyrefly: ignore [missing-import]
from app.services.matching.skills_matcher import SkillsMatcher
# pyrefly: ignore [missing-import]
from app.services.matching.summary_generator import SummaryGenerator
# pyrefly: ignore [missing-import]
from app.utils.logger import StepTimer, log_evaluation_step


class MatchingEngine:
    """
    Main Facade / Orchestrator for the AI Matching Engine.
    Coordinates all sub-matchers (Skills, Experience, Education, Projects)
    and computes weighted overall score and match level.
    """

    def __init__(self):
        self.skills_matcher = SkillsMatcher()
        self.experience_matcher = ExperienceMatcher()
        self.education_matcher = EducationMatcher()
        self.project_matcher = ProjectMatcher()

    def evaluate(self, request: EvaluationRequest) -> EvaluationResponse:
        start_time = time.perf_counter()

        cand_profile = request.candidate_profile
        job = request.job

        # 1. Resolve weights dynamically from request or JD config
        weights = self._resolve_weights(request)

        # 2. Component Evaluations
        with StepTimer("Skills Score Calculation"):
            skills_score, skill_strengths, skill_gaps, missing_mandatory = (
                self.skills_matcher.evaluate(
                    candidate_skills=cand_profile.skills,
                    job_required_skills=job.required_skills,
                )
            )

        with StepTimer("Experience Score Calculation"):
            experience_score, exp_strengths, exp_gaps = (
                self.experience_matcher.evaluate(
                    work_experiences=cand_profile.work_experiences, job=job
                )
            )

        with StepTimer("Education Score Calculation"):
            education_score, edu_strengths, edu_gaps = (
                self.education_matcher.evaluate(
                    educations=cand_profile.educations, job=job
                )
            )

        with StepTimer("Project Score Calculation"):
            project_score, proj_strengths, proj_gaps = (
                self.project_matcher.evaluate(
                    projects=cand_profile.projects, job=job
                )
            )

        # 3. Overall Weighted Score
        total_weight = (
            weights["skills"]
            + weights["experience"]
            + weights["education"]
            + weights["projects"]
        )
        if total_weight <= 0:
            total_weight = 100.0

        overall_score = (
            weights["skills"] * skills_score
            + weights["experience"] * experience_score
            + weights["education"] * education_score
            + weights["projects"] * project_score
        ) / float(total_weight)

        overall_score = round(overall_score, 2)

        # 4. Determine Match Level
        if overall_score >= 75.0:
            match_level = "HIGH"
        elif overall_score >= 50.0:
            match_level = "MEDIUM"
        else:
            match_level = "LOW"

        # 5. Aggregate Strengths and Gaps
        all_strengths = skill_strengths + exp_strengths + edu_strengths + proj_strengths
        all_gaps = skill_gaps + exp_gaps + edu_gaps + proj_gaps

        # 6. Generate Automatic Narrative Summary
        candidate_name = (
            cand_profile.profile.desired_title if cand_profile.profile else "Ứng viên"
        )
        summary = SummaryGenerator.generate_summary(
            candidate_name=candidate_name or "Ứng viên",
            job_title=job.title,
            overall_score=overall_score,
            match_level=match_level,
            skills_score=skills_score,
            experience_score=experience_score,
            education_score=education_score,
            project_score=project_score,
            missing_required_skills=missing_mandatory,
            strengths=all_strengths,
            gaps=all_gaps,
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        log_evaluation_step(
            "OverallEvaluationComplete",
            {
                "application_id": request.application_id,
                "overall_score": overall_score,
                "match_level": match_level,
                "execution_time_ms": round(elapsed_ms, 2),
            },
        )

        return EvaluationResponse(
            overall_score=overall_score,
            match_level=match_level,
            skills_score=skills_score,
            experience_score=experience_score,
            education_score=education_score,
            project_score=project_score,
            strengths=all_strengths,
            gaps=all_gaps,
            missing_required_skills=missing_mandatory,
            summary=summary,
        )

    def _resolve_weights(self, request: EvaluationRequest) -> Dict[str, float]:
        """Resolves score weights prioritizing request.weights -> job.ai_weights_config -> default."""
        if request.weights:
            return {
                "skills": float(request.weights.skills),
                "experience": float(request.weights.experience),
                "education": float(request.weights.education),
                "projects": float(request.weights.projects),
            }
        if request.job and request.job.ai_weights_config:
            cfg = request.job.ai_weights_config
            return {
                "skills": float(cfg.skills),
                "experience": float(cfg.experience),
                "education": float(cfg.education),
                "projects": float(cfg.projects),
            }
        return {"skills": 40.0, "experience": 30.0, "education": 15.0, "projects": 15.0}


# Singleton engine instance
matching_engine = MatchingEngine()
