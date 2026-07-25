from typing import List, Tuple
# pyrefly: ignore [missing-import]
from app.schemas.matching import CandidateProject, JobPayload
# pyrefly: ignore [missing-import]
from app.services.matching.semantic import semantic_matcher
# pyrefly: ignore [missing-import]
from app.utils.logger import log_evaluation_step
# pyrefly: ignore [missing-import]
from app.utils.normalizer import normalize_skill_name

DOMAIN_KEYWORDS = ["backend", "frontend", "devops", "data", "java", "software"]


class ProjectMatcher:
    """
    Evaluates Candidate Projects based on technology stack overlap, project role,
    and semantic description matching.
    """

    def evaluate(
        self, projects: List[CandidateProject], job: JobPayload
    ) -> Tuple[float, List[str], List[str]]:
        strengths = []
        gaps = []

        if not projects:
            gaps.append("Chưa thực hiện dự án thực tế nào được liệt kê trong hồ sơ.")
            log_evaluation_step("ProjectMatcher", {"score": 20.0, "project_count": 0})
            return 20.0, strengths, gaps

        cand_project_techs = set()
        project_descs = []
        has_domain_role = False
        job_title_lower = job.title.lower()

        for proj in projects:
            for tech in proj.technologies:
                cand_project_techs.add(normalize_skill_name(tech))
            desc_text = f"{proj.project_name or ''} ({proj.project_role or ''}): {proj.description or ''}"
            project_descs.append(desc_text)

            role_lower = (proj.project_role or "").lower()
            for kw in DOMAIN_KEYWORDS:
                if kw in job_title_lower and kw in role_lower:
                    has_domain_role = True

        job_req_skills = [
            normalize_skill_name(req.skill_name) for req in job.required_skills
        ]

        if job_req_skills:
            matched_techs = [
                tech for tech in job_req_skills if tech in cand_project_techs
            ]
            tech_ratio = len(matched_techs) / float(len(job_req_skills))
        else:
            tech_ratio = 1.0

        job_full_text = f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        semantic_sim = semantic_matcher.compute_best_similarity(
            job_full_text, project_descs
        )

        role_credit = 0.70 if has_domain_role else 0.30
        raw_score = 0.60 * tech_ratio + 0.25 * semantic_sim + 0.15 * role_credit

        if has_domain_role and raw_score < 0.40:
            raw_score = 0.40

        project_score = round(raw_score * 100.0, 2)

        if tech_ratio > 0.5 or has_domain_role:
            strengths.append(
                f"Có dự án thực tế ứng dụng công nghệ/vai trò liên quan ({len(projects)} dự án)."
            )
        else:
            gaps.append("Công nghệ trong dự án thực tế chưa bám sát yêu cầu JD.")

        log_evaluation_step(
            "ProjectMatcher",
            {
                "score": project_score,
                "project_count": len(projects),
                "tech_ratio": round(tech_ratio, 2),
                "semantic_sim": round(semantic_sim, 2),
            },
        )

        return project_score, strengths, gaps
