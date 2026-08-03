from typing import Dict, List, Set, Tuple
# pyrefly: ignore [missing-import]
from app.schemas.matching import CandidateSkill, JobRequiredSkill
# pyrefly: ignore [missing-import]
from app.utils.logger import log_evaluation_step
# pyrefly: ignore [missing-import]
from app.utils.normalizer import normalize_skill_name

LEVEL_VALUES = {
    "BEGINNER": 1,
    "INTERMEDIATE": 2,
    "ADVANCED": 3,
    "EXPERT": 4,
}

# Domain skill mappings for domain transferability evaluation
DOMAIN_SKILLS: Dict[str, Set[str]] = {
    "FRONTEND": {"React", "Vue.js", "JavaScript", "TypeScript", "Tailwind CSS"},
    "BACKEND": {"NestJS", "Node.js", "PostgreSQL", "Docker", "RabbitMQ", "TypeScript", "Java", "Spring Boot", "Python"},
    "DEVOPS": {"Docker", "Linux", "GitHub Actions", "Nginx", "AWS", "Git"},
    "DATA": {"Python", "Pandas", "SQL", "Power BI", "Excel"},
    "JAVA": {"Java", "Spring Boot", "PostgreSQL", "Microservices", "Docker", "Git"},
}


class SkillsMatcher:
    """
    Evaluates Candidate Skills against Job Required Skills.
    Considers mandatory vs optional skills, proficiency level,
    and domain skill transferability.
    """

    def evaluate(
        self,
        candidate_skills: List[CandidateSkill],
        job_required_skills: List[JobRequiredSkill],
    ) -> Tuple[float, List[str], List[str], List[str]]:
        if not job_required_skills:
            return 100.0, ["Không có yêu cầu kỹ năng cụ thể."], [], []

        cand_skill_map: Dict[str, CandidateSkill] = {}
        cand_norm_names: Set[str] = set()
        for cs in candidate_skills:
            norm_name = normalize_skill_name(cs.skill_name)
            cand_skill_map[norm_name] = cs
            cand_norm_names.add(norm_name)

        mandatory_reqs = [s for s in job_required_skills if s.is_mandatory]
        optional_reqs = [s for s in job_required_skills if not s.is_mandatory]

        strengths = []
        gaps = []
        missing_required = []

        mandatory_scores = []
        for req in mandatory_reqs:
            norm_req_name = normalize_skill_name(req.skill_name)
            if norm_req_name in cand_skill_map:
                cand_s = cand_skill_map[norm_req_name]
                score = self._calc_skill_item_score(cand_s, req)
                mandatory_scores.append(score)
                strengths.append(
                    f"Thành thạo kỹ năng bắt buộc: {req.skill_name} ({cand_s.proficiency_level or 'N/A'})"
                )
            else:
                domain_credit = self._calc_domain_transferability(norm_req_name, cand_norm_names, is_mandatory=True)
                mandatory_scores.append(domain_credit)
                missing_required.append(req.skill_name)
                if domain_credit > 0.0:
                    gaps.append(f"Chưa có kỹ năng bắt buộc {req.skill_name} (Có kỹ năng miền tương đương).")
                else:
                    gaps.append(f"Thiếu hoàn toàn kỹ năng bắt buộc: {req.skill_name}")

        optional_scores = []
        for req in optional_reqs:
            norm_req_name = normalize_skill_name(req.skill_name)
            if norm_req_name in cand_skill_map:
                cand_s = cand_skill_map[norm_req_name]
                score = self._calc_skill_item_score(cand_s, req)
                optional_scores.append(score)
                strengths.append(
                    f"Có kỹ năng bổ trợ: {req.skill_name} ({cand_s.proficiency_level or 'N/A'})"
                )
            else:
                optional_scores.append(0.0)
                gaps.append(f"Thiếu kỹ năng bổ trợ: {req.skill_name}")

        # Combined calculation: mandatory skills 75%, optional 25%
        if mandatory_reqs and optional_reqs:
            avg_mandatory = sum(mandatory_scores) / len(mandatory_scores)
            avg_optional = sum(optional_scores) / len(optional_scores)
            raw_score = 0.75 * avg_mandatory + 0.25 * avg_optional
        elif mandatory_reqs:
            raw_score = sum(mandatory_scores) / len(mandatory_scores)
        elif optional_reqs:
            raw_score = sum(optional_scores) / len(optional_scores)
        else:
            raw_score = 1.0

        skills_score = round(raw_score * 100.0, 2)

        log_evaluation_step(
            "SkillsMatcher",
            {
                "score": skills_score,
                "missing_mandatory": len(missing_required),
                "matched_strengths": len(strengths),
            },
        )

        return skills_score, strengths, gaps, missing_required

    def _calc_skill_item_score(
        self, cand_skill: CandidateSkill, req_skill: JobRequiredSkill
    ) -> float:
        cand_level_val = LEVEL_VALUES.get(
            (cand_skill.proficiency_level or "BEGINNER").upper(), 1
        )
        req_level_val = LEVEL_VALUES.get(
            (req_skill.minimum_level or "BEGINNER").upper(), 1
        )

        # Score based purely on proficiency level ratio
        item_score = min(1.0, cand_level_val / float(req_level_val))

        return item_score

    def _calc_domain_transferability(
        self, target_skill: str, cand_skills: Set[str], is_mandatory: bool
    ) -> float:
        if not is_mandatory:
            return 0.0
        for domain, skills_in_domain in DOMAIN_SKILLS.items():
            if target_skill in skills_in_domain:
                overlap = skills_in_domain.intersection(cand_skills)
                if overlap:
                    return 0.35
        return 0.0
