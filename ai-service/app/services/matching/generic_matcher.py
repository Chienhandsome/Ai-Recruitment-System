from datetime import datetime
from typing import Any, Dict, List

from app.schemas.matching import CandidateProfilePayload, JobPayload
from app.services.matching.experience_level_evaluator import experience_level_evaluator
from app.services.matching.semantic import semantic_matcher
from app.utils.normalizer import normalize_skill_name

class GenericMatchingEngine:
    """
    Evaluates evidence (Candidate Profile) against requirements (Job)
    using exact match and semantic similarity.
    Returns raw match metrics (0.0 - 1.0) without applying weights or generating text.
    """

    def evaluate(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> Dict[str, Any]:
        semantic_matcher.prefetch(self._collect_semantic_texts(cand_profile, job))
        try:
            return {
                "skills": self._match_skills(cand_profile, job),
                "experience": self._match_experience(cand_profile, job),
                "education": self._match_education(cand_profile, job),
                "other": self._match_certificates(cand_profile, job),
            }
        finally:
            semantic_matcher.clear_cache()

    def _collect_semantic_texts(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> List[str]:
        """Collect every text used by semantic scoring for one batch request."""
        texts: List[str] = []

        def add(*values: str | None) -> None:
            texts.extend(value for value in values if value and value.strip())

        job_full_text = (
            f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        )
        job_education_text = f"{job.title} {job.description or ''}"
        add(job.title, job_full_text, job_education_text)

        # Format theo chuẩn Context-Aware V2
        job_context = f"[CONTEXT] Domain: Technology | Environment: {job.work_mode or 'Professional'}"
        for skill in job.required_skills:
            add(f"{job_context} [CONTENT] {skill.skill_name}")
            
        cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: Technology | Seniority: experienced"
        for skill in cand_profile.skills:
            add(f"{cand_context_pro} [CONTENT] {self._skill_match_key(skill)}")

        for experience in cand_profile.work_experiences:
            seniority = "senior" if ("senior" in (experience.position_title or "").lower() or "trưởng" in (experience.position_title or "").lower()) else "experienced"
            context_str = f"[CONTEXT] Type: professional_employment | Domain: Technology | Seniority: {seniority}"
            context_text = f"{context_str} [CONTENT] {experience.position_title} {experience.description} {experience.achievements}"
            add(context_text)

        for education in cand_profile.educations:
            context_str = f"[CONTEXT] Type: academic | Domain: Education | Seniority: intern"
            add(f"{context_str} [CONTENT] {education.major}")

        for project in cand_profile.projects:
            technologies = " ".join(project.technologies)
            context_str = f"[CONTEXT] Type: project | Domain: Technology | Seniority: experienced"
            context_text = f"{context_str} [CONTENT] {project.project_name} {project.description} {technologies}"
            add(context_text)

        for certificate in job.required_certificates:
            add(certificate.certificate_name)
        for certificate in cand_profile.certificates:
            add(certificate.certificate_name)

        return texts

    def _match_skills(self, cand_profile: CandidateProfilePayload, job: JobPayload) -> Dict[str, Any]:
        job_req_skills = job.required_skills
        if not job_req_skills:
            return {"score": 1.0, "matched": [], "missing": [], "missing_mandatory": [], "evidence": []}

        cand_skill_id_map = {
            str(cs.skill_id): cs for cs in cand_profile.skills if cs.skill_id
        }
        cand_skill_map = {
            self._skill_match_key(cs): cs for cs in cand_profile.skills
        }
        cand_norm_names = set(cand_skill_map.keys())

        mandatory_scores = []
        optional_scores = []
        matched = []
        missing = []
        missing_mandatory = []
        evidence_list = []

        for req in job_req_skills:
            norm_req_name = self._skill_match_key(req)
            is_man = req.is_mandatory

            # Internal evaluation payloads carry the canonical database ID.
            # Prefer it over text so aliases and renamed display labels cannot
            # turn the same official skill into a semantic/partial match.
            cand_s = (
                cand_skill_id_map.get(str(req.skill_id))
                if req.skill_id
                else None
            )
            if cand_s is None:
                cand_s = cand_skill_map.get(norm_req_name)

            if cand_s is not None:
                score = min(1.0, self._get_level_val(cand_s.proficiency_level) / float(self._get_level_val(req.minimum_level)))
                matched.append({"name": req.skill_name, "isMandatory": is_man, "source": "skills_list"})
                if is_man: mandatory_scores.append(score)
                else: optional_scores.append(score)
            else:
                ctx_score, ctx_text, ctx_source = self._search_in_context(norm_req_name, req.skill_name, cand_profile, job)
                if ctx_score >= 0.82: # Mandatory Threshold
                    matched.append({"name": req.skill_name, "isMandatory": is_man, "source": ctx_source})
                    evidence_list.append({"skillName": req.skill_name, "evidenceText": ctx_text, "source": ctx_source})
                    if is_man: mandatory_scores.append(ctx_score)
                    else: optional_scores.append(ctx_score)
                else:
                    domain_credit = self._calc_domain_transferability(req.skill_name, cand_norm_names, is_man, job)
                    if is_man:
                        mandatory_scores.append(domain_credit)
                        missing_mandatory.append(req.skill_name)
                    else:
                        optional_scores.append(0.0)
                    missing.append({"name": req.skill_name, "isMandatory": is_man, "transfer_credit": domain_credit})

        if mandatory_scores and optional_scores:
            raw_score = 0.75 * (sum(mandatory_scores) / len(mandatory_scores)) + 0.25 * (sum(optional_scores) / len(optional_scores))
        elif mandatory_scores:
            raw_score = sum(mandatory_scores) / len(mandatory_scores)
        elif optional_scores:
            raw_score = sum(optional_scores) / len(optional_scores)
        else:
            raw_score = 1.0

        p_density = 1.0
        if cand_profile.skills:
            p_density = min(1.0, (len(cand_norm_names) / float(len(cand_profile.skills))) * 1.2)

        return {
            "score": raw_score * p_density,
            "matched": matched,
            "missing": missing,
            "missing_mandatory": missing_mandatory,
            "evidence": evidence_list,
            "p_density": p_density
        }

    def _get_level_val(self, lvl: str) -> int:
        return {"BEGINNER": 1, "INTERMEDIATE": 2, "ADVANCED": 3, "EXPERT": 4}.get((lvl or "BEGINNER").upper(), 1)

    def _skill_match_key(self, skill) -> str:
        """Return a stable, case-insensitive key for name-based fallback."""
        canonical_name = getattr(skill, "normalized_name", None)
        if canonical_name and canonical_name.strip():
            return canonical_name.strip().casefold()
        return normalize_skill_name(skill.skill_name).strip().casefold()

    def _calc_domain_transferability(self, target_skill: str, cand_skills: set, is_man: bool, job: JobPayload = None) -> float:
        if not is_man or not cand_skills: return 0.0
        job_context = f"[CONTEXT] Domain: Technology | Environment: {job.work_mode or 'Professional'}"
        target_skill_v2 = f"{job_context} [CONTENT] {target_skill}"
        cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: Technology | Seniority: experienced"
        
        best_sim = max([semantic_matcher.compute_similarity(target_skill_v2, f"{cand_context_pro} [CONTENT] {cs}") for cs in cand_skills] + [0.0])
        # Áp dụng Rule Engine: Mandatory Threshold 0.82
        if is_man and best_sim < 0.82:
            return 0.0
        return best_sim

    def _search_in_context(self, norm_req, req_name, profile, job: JobPayload = None):
        best_score, best_text, best_source = 0.0, "", ""
        job_context = f"[CONTEXT] Domain: Technology | Environment: {job.work_mode or 'Professional'}"
        req_name_v2 = f"{job_context} [CONTENT] {req_name}"
        
        for exp in profile.work_experiences:
            seniority = "senior" if ("senior" in (exp.position_title or "").lower() or "trưởng" in (exp.position_title or "").lower()) else "experienced"
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: Technology | Seniority: {seniority}"
            text = f"{exp.position_title} {exp.description} {exp.achievements}"
            text_v2 = f"{cand_context_pro} [CONTENT] {text}"
            
            if norm_req.lower() in text.lower() or req_name.lower() in text.lower():
                if 0.85 > best_score: best_score, best_text, best_source = 0.85, text, f"Kinh nghiệm: {exp.position_title}"
            else:
                sim = semantic_matcher.compute_similarity(req_name_v2, text_v2)
                if sim > best_score:
                    best_score, best_text, best_source = sim, text, f"Kinh nghiệm: {exp.position_title}"
                    
        for proj in profile.projects:
            cand_context_proj = f"[CONTEXT] Type: project | Domain: Technology | Seniority: experienced"
            text = f"{proj.project_name} {proj.description} {' '.join(proj.technologies)}"
            text_v2 = f"{cand_context_proj} [CONTENT] {text}"
            
            if norm_req.lower() in text.lower() or req_name.lower() in text.lower():
                if 0.85 > best_score: best_score, best_text, best_source = 0.85, text, f"Dự án: {proj.project_name}"
            else:
                sim = semantic_matcher.compute_similarity(req_name_v2, text_v2)
                if sim > best_score:
                    best_score, best_text, best_source = sim, text, f"Dự án: {proj.project_name}"
                    
        # Phạt nhẹ nếu nguồn không phải kinh nghiệm chuyên nghiệp
        if "Dự án" in best_source:
            best_score *= 0.85
            
        return best_score, best_text, best_source

    def _match_experience(self, cand_profile: CandidateProfilePayload, job: JobPayload) -> Dict[str, Any]:
        level_assessment = None
        if job.experience_level:
            level_assessment = experience_level_evaluator.evaluate(
                cand_profile.work_experiences,
                job.experience_level,
                job.level_requirement_mode,
                job.evaluation_date,
            )
            total_years = float(level_assessment["total_experience_years"])
        else:
            total_years = self._calculate_total_years(cand_profile.work_experiences)
        req_years = float(job.required_experience_years or 0.0)
        
        duration_score = 1.0
        if req_years > 0:
            duration_score = min(1.0, total_years / req_years)

        candidate_titles = [exp.position_title for exp in cand_profile.work_experiences if exp.position_title]
        j_title_lower = job.title.lower()
        is_job_intern = "intern" in j_title_lower
        
        best_rel = 0.0
        for c_title in candidate_titles:
            c_title_lower = c_title.lower()
            rel = 1.0 if (c_title_lower in j_title_lower or j_title_lower in c_title_lower) else semantic_matcher.compute_similarity(job.title, c_title)
            if "intern" in c_title_lower and not is_job_intern: rel *= 0.55
            best_rel = max(best_rel, rel)
            
        exp_descriptions = [f"{exp.position_title}: {exp.description or ''} {exp.achievements or ''}" for exp in cand_profile.work_experiences]
        job_full_desc = f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        desc_sim = semantic_matcher.compute_best_similarity(job_full_desc, exp_descriptions) if exp_descriptions else 0.0
        
        work_relevance_score = 0.7 * best_rel + 0.3 * desc_sim
        legacy_exp_score = 0.5 * duration_score + 0.5 * work_relevance_score if cand_profile.work_experiences else 0.2

        project_metrics = self._eval_projects(cand_profile, job)
        project_score = project_metrics["score"]

        # Preserve the v1 formula for legacy snapshots/jobs that do not carry
        # an explicit experience level.
        if cand_profile.work_experiences and cand_profile.projects:
            relevance_score = 0.7 * work_relevance_score + 0.3 * project_score
            legacy_final_score = 0.7 * legacy_exp_score + 0.3 * project_score
        elif cand_profile.work_experiences:
            relevance_score = work_relevance_score
            legacy_final_score = legacy_exp_score
        elif cand_profile.projects:
            # Projects alone cannot fully substitute professional work experience
            relevance_score = min(project_score, 0.4)
            legacy_final_score = min(project_score, 0.4)
        else:
            relevance_score = 0.2
            legacy_final_score = 0.2

        if level_assessment is None:
            final_score = legacy_final_score
        else:
            fit_score = level_assessment.get("level_fit_score")
            if fit_score is None or float(level_assessment["level_confidence"]) < 0.5:
                final_score = 0.5 * duration_score + 0.5 * relevance_score
            else:
                final_score = (
                    0.35 * duration_score
                    + 0.35 * relevance_score
                    + 0.30 * (float(fit_score) / 100.0)
                )
            level_assessment = {
                **level_assessment,
                "duration_score": round(duration_score * 100.0, 2),
                "relevance_score": round(relevance_score * 100.0, 2),
            }

        return {
            "score": final_score,
            "total_years": total_years,
            "req_years": req_years,
            "duration_score": duration_score,
            "title_sim": best_rel,
            "desc_sim": desc_sim,
            "best_title": candidate_titles[0] if candidate_titles else None,
            "project_metrics": project_metrics,
            "level_assessment": level_assessment,
        }

    def _calculate_total_years(self, experiences) -> float:
        if not experiences: return 0.0
        now = datetime.now()
        intervals = []
        for exp in experiences:
            try: start = datetime.strptime(str(exp.start_date).split("T")[0], "%Y-%m-%d") if exp.start_date else now
            except: start = now
            try: end = datetime.strptime(str(exp.end_date).split("T")[0], "%Y-%m-%d") if exp.end_date and not exp.is_current else now
            except: end = now
            if start > end: start, end = end, start
            intervals.append((start, end))
        intervals.sort(key=lambda x: x[0])
        merged = []
        for s, e in intervals:
            if not merged: merged.append((s, e))
            else:
                ls, le = merged[-1]
                if s <= le: merged[-1] = (ls, max(le, e))
                else: merged.append((s, e))
        return sum((e - s).days for s, e in merged) / 365.25

    def _match_education(self, cand_profile: CandidateProfilePayload, job: JobPayload) -> Dict[str, Any]:
        educations = cand_profile.educations
        if not educations: return {"score": 0.2, "has_degree": False, "best_major": None}
        
        job_desc = f"{job.title} {job.description or ''}"
        majors = [e.major for e in educations if e.major]
        
        best_sim = 0.0
        best_major = None
        for m in majors:
            sim = semantic_matcher.compute_similarity(job_desc, m)
            if sim > best_sim: best_sim, best_major = sim, m
            
        return {
            "score": 0.4 + (0.6 * best_sim),
            "has_degree": True,
            "best_major": best_major,
            "best_sim": best_sim
        }

    def _eval_projects(self, cand_profile: CandidateProfilePayload, job: JobPayload) -> Dict[str, Any]:
        projects = cand_profile.projects
        if not projects: return {"score": 0.2, "project_count": 0}
        
        job_req_skills = [req.skill_name for req in job.required_skills]
        all_text = ""
        project_descs = []
        best_role_sim = 0.0
        j_title_lower = job.title.lower()
        
        for proj in projects:
            desc = f"{proj.project_name} ({proj.project_role}): {proj.description}"
            project_descs.append(desc)
            all_text += f" {desc} {' '.join(proj.technologies)} "
            
            r_lower = (proj.project_role or "").lower()
            if r_lower:
                if r_lower in j_title_lower or j_title_lower in r_lower: best_role_sim = 1.0
                else: best_role_sim = max(best_role_sim, semantic_matcher.compute_similarity(job.title, proj.project_role))
            else:
                best_role_sim = max(best_role_sim, semantic_matcher.compute_similarity(job.title, desc))
                
        all_text = all_text.lower()
        matched_skills = 0
        if job_req_skills:
            for s in job_req_skills:
                if normalize_skill_name(s).lower() in all_text or s.lower() in all_text: matched_skills += 1
            skill_app = matched_skills / float(len(job_req_skills))
        else: skill_app = 1.0
        
        job_full_text = f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        semantic_sim = semantic_matcher.compute_best_similarity(job_full_text, project_descs)
        
        raw = 0.4 * skill_app + 0.4 * semantic_sim + 0.2 * best_role_sim
        if len(projects) > 1 and raw > 0.5: raw = min(1.0, raw * 1.1)
        
        return {
            "score": raw,
            "project_count": len(projects),
            "skill_app_ratio": skill_app,
            "semantic_sim": semantic_sim,
            "role_sim": best_role_sim
        }

    def _match_certificates(self, cand_profile: CandidateProfilePayload, job: JobPayload) -> Dict[str, Any]:
        req_certs = job.required_certificates
        cand_certs = cand_profile.certificates
        
        if not req_certs:
            # No cert requirements configured → neutral score, not a reward
            return {"score": 0.5, "matched": [], "missing": []}
            
        if not cand_certs:
            # Required but candidate has none
            return {"score": 0.2, "matched": [], "missing": [req.certificate_name for req in req_certs]}
            
        matched = []
        missing = []
        cand_cert_names = [c.certificate_name for c in cand_certs]
        
        score_sum = 0.0
        for req in req_certs:
            best_sim = 0.0
            for c_name in cand_cert_names:
                if req.certificate_name.lower() in c_name.lower() or c_name.lower() in req.certificate_name.lower():
                    best_sim = 1.0
                else:
                    best_sim = max(best_sim, semantic_matcher.compute_similarity(req.certificate_name, c_name))
            
            if best_sim > 0.8:
                matched.append(req.certificate_name)
                score_sum += 1.0
            elif best_sim > 0.6:
                matched.append(req.certificate_name) # Partial match
                score_sum += best_sim
            else:
                missing.append(req.certificate_name)
                
        final_score = score_sum / len(req_certs) if req_certs else 1.0
        return {
            "score": final_score,
            "matched": matched,
            "missing": missing
        }

generic_matching_engine = GenericMatchingEngine()
