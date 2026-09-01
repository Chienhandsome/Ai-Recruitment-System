import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from app.schemas.matching import CandidateProfilePayload, JobPayload
from app.services.matching.experience_level_evaluator import experience_level_evaluator
from app.services.matching.semantic import semantic_matcher
from app.services.matching.knowledge_graph import skill_kg
from app.services.matching.temporal_engine import temporal_engine
from app.services.matching.late_interaction import late_interaction_scorer
from app.services.matching.fraud_auditor import anti_inflation_auditor
from app.utils.normalizer import normalize_skill_name


class GenericMatchingEngine:
    """
    Unified Cognitive Matching Architecture (H-CAME V4):
    Integrates 4 Unified Pillars:
    1. Dynamic Skill & Ontology Knowledge Graph (Cross-skill Transferability)
    2. Temporal Dynamics (Skill Recency Time-Decay e^-lambda*t & Career Velocity)
    3. Dual-Stream Late Interaction (ColBERT-style MaxSim Token Matching)
    4. Multi-Agent Anti-Inflation & Evidence Credibility Verification
    """

    def evaluate(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> Dict[str, Any]:
        semantic_matcher.prefetch(self._collect_semantic_texts(cand_profile, job))
        try:
            job_subdomain = self._detect_subdomain(f"{job.title} {job.description or ''} {job.requirements or ''}")

            cand_exp_texts = " ".join([f"{exp.position_title} {exp.company_name} {exp.description or ''}" for exp in cand_profile.work_experiences])
            prof = cand_profile.profile
            cand_header = f"{prof.desired_title if prof else ''} {prof.professional_summary if prof else ''}"
            cand_subdomain = self._detect_subdomain(f"{cand_header} {cand_exp_texts}")

            domain_compat = self._calc_domain_compatibility(job_subdomain, cand_subdomain)

            # V4 Audit & Temporal Diagnostics
            audit_res = anti_inflation_auditor.audit_profile(cand_profile, job)
            career_vel_res = temporal_engine.calculate_career_velocity(cand_profile.work_experiences)

            skills_res = self._match_skills(cand_profile, job, domain_compat, job_subdomain, cand_subdomain)
            exp_res = self._match_experience(cand_profile, job, domain_compat)
            edu_res = self._match_education(cand_profile, job)
            other_res = self._match_certificates(cand_profile, job)

            # V4 Late Interaction token alignment
            jd_clauses = late_interaction_scorer.extract_clauses_from_job(job)
            cand_passages = late_interaction_scorer.extract_passages_from_profile(cand_profile)
            late_score, late_alignments = late_interaction_scorer.compute_clause_maxsim(jd_clauses, cand_passages)

            return {
                "skills": skills_res,
                "experience": exp_res,
                "education": edu_res,
                "other": other_res,
                "job_subdomain": job_subdomain,
                "cand_subdomain": cand_subdomain,
                "domain_compatibility": domain_compat,
                "audit": audit_res,
                "career_velocity": career_vel_res,
                "late_interaction_score": late_score,
                "late_interaction_alignments": late_alignments,
            }
        finally:
            semantic_matcher.clear_cache()

    def _detect_subdomain(self, text: str) -> str:
        """
        Tự động phân lớp Ngành nghề dọc & Mô hình Kinh doanh (14 Nhóm Ngành Lớn - 38 Phân ngành Chuyên sâu).
        """
        t = (text or "").lower()

        # 1. IT & SOFTWARE ENGINEERING (IT_) - Ưu tiên nhận diện vai trò kỹ thuật phần mềm
        if any(k in t for k in ["fullstack", "full stack", "web developer", "lập trình web", "kỹ sư phần mềm"]):
            return "IT_FULLSTACK_DEV"
        if any(k in t for k in ["react", "vue", "nextjs", "next.js", "angular", "frontend", "front-end", "html/css", "tailwind", "ui developer"]):
            return "IT_FRONTEND_WEB"
        if any(k in t for k in ["java", "spring", "backend", "back-end", "microservices", "postgresql", "kafka", "redis", "golang", "nodejs", "node.js", "rest api", "database", "sql"]):
            return "IT_BACKEND_SYSTEMS"
        if any(k in t for k in ["devops", "kubernetes", "docker", "ci/cd", "aws", "terraform", "cloud architect", "sysadmin"]):
            return "IT_DEVOPS_CLOUD"
        if any(k in t for k in ["ai engineer", "machine learning", "deep learning", "nlp", "llm", "pytorch", "tensorflow", "data science", "data engineer"]):
            return "IT_AI_DATA_SCIENCE"
        if any(k in t for k in ["embedded", "firmware", "iot", "microcontroller", "stm32", "arm", "rtos", "c/c++", "phần cứng"]):
            return "IT_EMBEDDED_FIRMWARE"

        # 2. DESIGN & CREATIVE (DESIGN_)
        if any(k in t for k in ["figma", "ui/ux", "design system", "wirefram", "product design", "ux design", "ui designer", "product designer"]):
            return "DESIGN_UI_UX"
        if any(k in t for k in ["3d artist", "blender", "maya", "3d animation", "game art", "concept art"]):
            return "DESIGN_3D_GAME_ART"
        if any(k in t for k in ["graphic designer", "illustrator", "photoshop", "thiết kế đồ họa", "in ấn", "branding"]):
            return "DESIGN_GRAPHIC_BRANDING"

        # 3. FINANCE & ACCOUNTING (FIN_)
        if any(k in t for k in ["chứng khoán", "định giá cổ phiếu", "equity research", "cfa", "quỹ đầu tư", "investment", "bloomberg", "m&a", "thẩm định đầu tư"]):
            return "FIN_INVESTMENT_BANKING"
        if any(k in t for k in ["kiểm toán", "auditing", "big 4", "soát xét", "internal audit", "kiểm soát nội bộ"]):
            return "FIN_AUDIT_INTERNAL_CONTROL"
        if any(k in t for k in ["kế toán", "quyết toán thuế", "báo cáo thuế", "hạch toán", "misa", "sổ sách", "thuế tndn", "tax accountant", "kế toán trưởng", "cpa việt nam", "chứng chỉ cpa"]):
            return "FIN_TAX_ACCOUNTING"
        if any(k in t for k in ["tín dụng", "ngân hàng bán lẻ", "thẩm định tín dụng", "credit risk", "teller", "giao dịch viên"]):
            return "FIN_RETAIL_BANKING"

        # 4. MARKETING & GROWTH (MKT_)
        if any(k in t for k in ["game", "gaming", "app install", "user acquisition", "cpi", "appsflyer", "adjust", "skadnetwork", "unity ads"]):
            return "MKT_MOBILE_GAMING_UA"
        if any(k in t for k in ["b2b marketing", "b2b saas", "lead gen", "mql", "sql lead", "hubspot"]):
            return "MKT_B2B_SAAS"
        if any(k in t for k in ["agency", "media planner", "tài khoản khách hàng", "nhãn hàng", "media executive"]):
            return "MKT_AGENCY_SERVICES"
        if any(k in t for k in ["e-commerce", "ecommerce", "d2c", "shopee", "tiktok shop", "shopify", "lazada", "bán lẻ", "giỏ hàng", "fmcg"]):
            return "MKT_ECOMMERCE_D2C"
        if any(k in t for k in ["content", "fanpage", "social media", "post engagement", "livestream", "canva", "copywriter"]):
            return "MKT_SOCIAL_CONTENT"

        # 5. EDUCATION & TRAINING (EDU_)
        if any(k in t for k in ["ielts", "academic english", "celta", "tesol", "tiếng anh học thuật", "giáo viên tiếng anh"]):
            return "EDU_ACADEMIC_ESL"
        if any(k in t for k in ["mầm non", "montessori", "tiểu học", "k12", "giáo viên tiểu học"]):
            return "EDU_EARLY_CHILDHOOD_K12"
        if any(k in t for k in ["đào tạo nội bộ", "corporate trainer", "instructional design", "l&d"]):
            return "EDU_CORPORATE_TRAINING"

        # 6. HEALTHCARE & MEDICINE (MED_)
        if any(k in t for k in ["bác sĩ", "chẩn đoán lâm sàng", "khám chữa bệnh", "doctor", "medical practitioner"]):
            return "MED_CLINICAL_DOCTOR"
        if any(k in t for k in ["dược sĩ", "dược lâm sàng", "pharma", "trình dược viên", "thuốc", "pharmacist"]):
            return "MED_PHARMACEUTICAL"
        if any(k in t for k in ["điều dưỡng", "y tá", "chăm sóc bệnh nhân", "nursing"]):
            return "MED_NURSING_CARE"

        # 7. LOGISTICS & SUPPLY CHAIN (LOG_)
        if any(k in t for k in ["kho bãi", "wms", "quản lý kho", "inventory", "kho vận", "warehouse"]):
            return "LOG_WAREHOUSE_WMS"
        if any(k in t for k in ["xuất nhập khẩu", "hải quan", "forwarding", "import export", "freight", "incoterms"]):
            return "LOG_CUSTOMS_FORWARDING"
        if any(k in t for k in ["đội xe", "fleet", "vận tải", "giao nhận", "last mile", "tài xế"]):
            return "LOG_FLEET_TRANSPORT"

        # 8. HUMAN RESOURCES (HR_)
        if any(k in t for k in ["tuyển dụng", "recruiter", "headhunt", "talent acquisition", "sourcing"]):
            return "HR_RECRUITMENT_TALENT"
        if any(k in t for k in ["c&b", "lương thưởng", "phúc lợi", "bảo hiểm xã hội", "payroll"]):
            return "HR_COMPENSATION_BENEFITS"
        if any(k in t for k in ["hành chính nhân sự", "hr generalist", "văn hóa doanh nghiệp", "employee relations"]):
            return "HR_GENERAL_OPERATIONS"

        # 9. LEGAL & COMPLIANCE (LAW_)
        if any(k in t for k in ["luật sư", "hợp đồng thương mại", "pháp chế doanh nghiệp", "corporate legal", "m&a legal"]):
            return "LAW_CORPORATE_LEGAL"
        if any(k in t for k in ["sở hữu trí tuệ", "patent", "bản quyền", "trademark", "ip attorney"]):
            return "LAW_INTELLECTUAL_PROPERTY"
        if any(k in t for k in ["tuân thủ", "compliance", "regulatory", "pháp lý rủi ro"]):
            return "LAW_REGULATORY_COMPLIANCE"

        # 10. MANUFACTURING & INDUSTRIAL (MFG_)
        if any(k in t for k in ["plc", "scada", "tự động hóa", "kỹ sư điện tự động", "automation engineer"]):
            return "MFG_AUTOMATION_PLC"
        if any(k in t for k in ["qa/qc", "quản lý chất lượng", "iso 9001", "kiểm soát chất lượng", "qc nhà máy"]):
            return "MFG_QUALITY_CONTROL"
        if any(k in t for k in ["quản đốc", "sản xuất nhà máy", "dây chuyền sản xuất", "plant manager", "lean 5s"]):
            return "MFG_PLANT_OPERATIONS"

        # 11. HOSPITALITY & F&B (HOSP_)
        if any(k in t for k in ["khách sạn", "hotel manager", "resort", "tiền sảnh", "front office", "buồng phòng"]):
            return "HOSP_HOTEL_RESORT"
        if any(k in t for k in ["nhà hàng", "bếp trưởng", "f&b", "barista", "phục vụ bàn", "quản lý nhà hàng"]):
            return "HOSP_FB_RESTAURANT"

        # 12. REAL ESTATE & CONSTRUCTION (REAL_)
        if any(k in t for k in ["môi giới bđs", "bất động sản", "nhà đất", "căn hộ", "real estate broker"]):
            return "REAL_PROPERTY_BROKERAGE"
        if any(k in t for k in ["kỹ sư xây dựng", "chỉ huy trưởng", "thi công công trình", "civil engineer", "autocad xây dựng"]):
            return "REAL_CIVIL_CONSTRUCTION"

        # 13. AGRICULTURE & AGRITECH (AGRI_)
        if any(k in t for k in ["trồng trọt", "nông nghiệp công nghệ cao", "nhà màng", "thổ nhưỡng", "cây trồng", "agritech"]):
            return "AGRI_CROP_FARMING"
        if any(k in t for k in ["chăn nuôi", "thú y", "thức ăn chăn nuôi", "gia súc", "gia cầm", "veterinary"]):
            return "AGRI_LIVESTOCK_VET"

        # 14. CUSTOMER SERVICE & SUPPORT (CS_)
        if any(k in t for k in ["cskh", "chăm sóc khách hàng", "call center", "tổng đài", "customer support"]):
            return "CS_CUSTOMER_CARE"
        if any(k in t for k in ["it support", "helpdesk", "hỗ trợ kỹ thuật", "cài đặt phần cứng"]):
            return "CS_TECH_HELPDESK"

        return "GENERAL_PROFESSIONAL"

    def _calc_domain_compatibility(self, job_dom: str, cand_dom: str) -> float:
        """
        Tính toán Hệ số Tương thích Mô hình Doanh nghiệp (Domain Compatibility Gating)
        trên Ma trận Taxonomy 14 Ngành Lớn.
        """
        if job_dom == cand_dom:
            return 1.0
        if "GENERAL" in job_dom or "GENERAL" in cand_dom:
            return 0.85

        job_family = job_dom.split("_")[0]
        cand_family = cand_dom.split("_")[0]

        # Khác khối ngành hoàn toàn (ví dụ: Y tế vs IT, Logistics vs Pháp lý, Marketing vs Nông nghiệp)
        if job_family != cand_family:
            # Ngoại lệ chuyển giao kỹ thuật công nghệ
            if ("MFG_AUTOMATION" in job_dom and "IT_EMBEDDED" in cand_dom) or ("IT_EMBEDDED" in job_dom and "MFG_AUTOMATION" in cand_dom):
                return 0.65
            if ("IT_BACKEND" in job_dom and "DESIGN_UI_UX" in cand_dom) or ("DESIGN_UI_UX" in job_dom and "IT_BACKEND" in cand_dom):
                return 0.40
            return 0.15

        # CÙNG KHỐI NGÀNH (Intra-Family Distance)

        # 1. IT & Engineering
        if "IT_" in job_dom and "IT_" in cand_dom:
            if "FULLSTACK" in job_dom or "FULLSTACK" in cand_dom:
                return 0.95
            if ("FRONTEND" in job_dom and "BACKEND" in cand_dom) or ("BACKEND" in job_dom and "FRONTEND" in cand_dom):
                return 0.85
            if ("DEVOPS" in job_dom and "BACKEND" in cand_dom) or ("BACKEND" in job_dom and "DEVOPS" in cand_dom):
                return 0.85
            if ("AI" in job_dom and "BACKEND" in cand_dom) or ("BACKEND" in job_dom and "AI" in cand_dom):
                return 0.80
            if ("EMBEDDED" in job_dom or "EMBEDDED" in cand_dom):
                return 0.35
            return 0.90

        # 2. Marketing
        if ("AGENCY" in job_dom and "ECOMMERCE" in cand_dom) or ("ECOMMERCE" in job_dom and "AGENCY" in cand_dom):
            return 0.88
        if ("B2B" in job_dom and "ECOMMERCE" in cand_dom) or ("ECOMMERCE" in job_dom and "B2B" in cand_dom):
            return 0.75
        if ("CONTENT" in job_dom or "CONTENT" in cand_dom):
            return 0.45
        if ("GAMING" in job_dom or "GAMING" in cand_dom):
            return 0.22

        # 3. Finance & Accounting
        if ("TAX" in job_dom and "AUDIT" in cand_dom) or ("AUDIT" in job_dom and "TAX" in cand_dom):
            return 0.75
        if ("TAX" in job_dom and "INVESTMENT" in cand_dom) or ("INVESTMENT" in job_dom and "TAX" in cand_dom):
            return 0.22
        if ("RETAIL" in job_dom and "INVESTMENT" in cand_dom) or ("INVESTMENT" in job_dom and "RETAIL" in cand_dom):
            return 0.40

        # 4. Healthcare
        if ("CLINICAL" in job_dom and "PHARMACEUTICAL" in cand_dom) or ("PHARMACEUTICAL" in job_dom and "CLINICAL" in cand_dom):
            return 0.60
        if ("CLINICAL" in job_dom and "NURSING" in cand_dom) or ("NURSING" in job_dom and "CLINICAL" in cand_dom):
            return 0.65

        # 5. Logistics
        if ("WAREHOUSE" in job_dom and "CUSTOMS" in cand_dom) or ("CUSTOMS" in job_dom and "WAREHOUSE" in cand_dom):
            return 0.75
        if ("FLEET" in job_dom and "WAREHOUSE" in cand_dom) or ("WAREHOUSE" in job_dom and "FLEET" in cand_dom):
            return 0.70

        # 6. Human Resources
        if ("RECRUITMENT" in job_dom and "COMPENSATION" in cand_dom) or ("COMPENSATION" in job_dom and "RECRUITMENT" in cand_dom):
            return 0.65
        if ("GENERAL" in job_dom and "RECRUITMENT" in cand_dom) or ("RECRUITMENT" in job_dom and "GENERAL" in cand_dom):
            return 0.80

        # 7. Legal
        if ("CORPORATE" in job_dom and "INTELLECTUAL" in cand_dom) or ("INTELLECTUAL" in job_dom and "CORPORATE" in cand_dom):
            return 0.70
        if ("CORPORATE" in job_dom and "REGULATORY" in cand_dom) or ("REGULATORY" in job_dom and "CORPORATE" in cand_dom):
            return 0.80

        # 8. Manufacturing
        if ("AUTOMATION" in job_dom and "PLANT" in cand_dom) or ("PLANT" in job_dom and "AUTOMATION" in cand_dom):
            return 0.70
        if ("QUALITY" in job_dom and "PLANT" in cand_dom) or ("PLANT" in job_dom and "QUALITY" in cand_dom):
            return 0.75

        # 9. Hospitality
        if ("HOTEL" in job_dom and "FB" in cand_dom) or ("FB" in job_dom and "HOTEL" in cand_dom):
            return 0.65

        # 10. Real Estate
        if ("PROPERTY" in job_dom and "CIVIL" in cand_dom) or ("CIVIL" in job_dom and "PROPERTY" in cand_dom):
            return 0.40

        # 11. Agriculture
        if ("CROP" in job_dom and "LIVESTOCK" in cand_dom) or ("LIVESTOCK" in job_dom and "CROP" in cand_dom):
            return 0.55

        # 12. Customer Service
        if ("CUSTOMER" in job_dom and "TECH" in cand_dom) or ("TECH" in job_dom and "CUSTOMER" in cand_dom):
            return 0.65

        # Mặc định các phân ngành cùng họ
        return 0.65

    def _collect_semantic_texts(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> List[str]:
        texts: List[str] = []

        def add(*values: str | None) -> None:
            texts.extend(value for value in values if value and value.strip())

        job_full_text = f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        add(job.title, job_full_text)
        job_subdom = self._detect_subdomain(job_full_text)
        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode or 'Professional'}"

        for skill in job.required_skills:
            add(f"{job_context} [CONTENT] {skill.skill_name}")

        for skill in cand_profile.skills:
            cand_s_domain = self._detect_subdomain(skill.skill_name)
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: {cand_s_domain} | Seniority: experienced"
            add(f"{cand_context_pro} [CONTENT] {normalize_skill_name(skill.skill_name)}")

        for exp in cand_profile.work_experiences:
            exp_text = f"{exp.position_title} {exp.description or ''} {exp.achievements or ''}"
            exp_domain = self._detect_subdomain(exp_text)
            seniority = "senior" if any(k in (exp.position_title or "").lower() for k in ["senior", "trưởng", "manager", "lead", "head"]) else "experienced"
            add(f"[CONTEXT] Type: professional_employment | Domain: {exp_domain} | Seniority: {seniority} [CONTENT] {exp_text}")

        for education in cand_profile.educations:
            edu_domain = self._detect_subdomain(education.major or "")
            add(f"[CONTEXT] Type: academic | Domain: {edu_domain} | Seniority: intern [CONTENT] {education.major}")

        for project in cand_profile.projects:
            proj_text = f"{project.project_name} {project.description or ''} {' '.join(project.technologies)}"
            proj_domain = self._detect_subdomain(proj_text)
            add(f"[CONTEXT] Type: project | Domain: {proj_domain} | Seniority: experienced [CONTENT] {proj_text}")

        for certificate in job.required_certificates: add(certificate.certificate_name)
        for certificate in cand_profile.certificates: add(certificate.certificate_name)

        return texts

    def _is_entry_level(self, job: JobPayload) -> bool:
        if not job:
            return False
        exp_lvl = (job.experience_level or "").lower()
        emp_type = (job.employment_type or "").lower()
        j_title = (job.title or "").lower()
        return any(kw in (exp_lvl or j_title) for kw in ["intern", "fresher", "tập sự", "thực tập"]) or any(kw in emp_type for kw in ["internship"])

    def _match_skills(
        self,
        cand_profile: CandidateProfilePayload,
        job: JobPayload,
        domain_compat: float = 1.0,
        job_subdom: str | None = None,
        cand_subdom: str | None = None,
    ) -> Dict[str, Any]:
        job_req_skills = job.required_skills
        if not job_req_skills:
            return {"score": 1.0, "matched": [], "missing": [], "missing_mandatory": [], "evidence": [], "mandatory_ratio": 1.0}

        job_subdom = job_subdom or self._detect_subdomain(
            f"{job.title} {job.description or ''} {job.requirements or ''}"
        )
        cand_skill_id_map = {
            str(cs.skill_id): cs for cs in cand_profile.skills if cs.skill_id
        }
        cand_skill_map = {
            self._skill_match_key(cs): cs for cs in cand_profile.skills
        }
        cand_norm_names = set(cand_skill_map.keys())

        # Ngưỡng động (Đồng nghĩa thực sự vs Chuyển giao)
        mandatory_threshold = 0.88
        transferable_threshold = 0.68

        mandatory_scores = []
        optional_scores = []
        mandatory_credits = []
        matched = []
        missing = []
        missing_mandatory = []
        evidence_list = []

        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode or 'Professional'}"

        for req in job_req_skills:
            norm_req_name = self._skill_match_key(req)
            is_man = req.is_mandatory
            req_min_years = float(getattr(req, "minimum_years", 0.0) or 0.0)
            cand_skill_years = self._calculate_skill_years(req.skill_name, cand_profile)

            # 1. Khớp chính xác danh sách kỹ năng
            cand_s = (
                cand_skill_id_map.get(str(req.skill_id)) if req.skill_id else None
            )
            if cand_s is None:
                cand_s = cand_skill_map.get(norm_req_name)

            if cand_s is not None:
                level_mult = min(1.0, self._get_level_val(cand_s.proficiency_level) / float(self._get_level_val(req.minimum_level)))
                score = 1.0 * level_mult * (0.5 + 0.5 * domain_compat)
                
                # Check skill experience years requirement
                years_gap_info = None
                if req_min_years > 0:
                    if cand_skill_years < req_min_years:
                        ratio = cand_skill_years / req_min_years
                        penalty_mult = 0.65 + 0.35 * max(0.2, min(1.0, ratio))
                        score *= penalty_mult
                        years_gap_info = {
                            "req_years": req_min_years,
                            "actual_years": cand_skill_years,
                            "ratio": round(ratio, 2),
                            "penalty_msg": f"Kỹ năng '{req.skill_name}': Thâm niên thực tế ({cand_skill_years:.1f} năm) chưa đủ số năm yêu cầu của JD ({req_min_years:.1f} năm). Đã trừ điểm thâm niên kỹ năng tương ứng."
                        }
                    else:
                        years_gap_info = {
                            "req_years": req_min_years,
                            "actual_years": cand_skill_years,
                            "bonus_msg": f"Kỹ năng '{req.skill_name}': Thâm niên thực tế ({cand_skill_years:.1f} năm) đáp ứng đủ yêu cầu ({req_min_years:.1f} năm)."
                        }

                matched.append({
                    "name": req.skill_name,
                    "isMandatory": is_man,
                    "source": "skills_list",
                    "actual_years": cand_skill_years,
                    "req_years": req_min_years,
                    "years_gap": years_gap_info
                })
                if is_man:
                    mandatory_scores.append(score)
                    mandatory_credits.append(1.0)
                else:
                    optional_scores.append(score)
                continue

            # 2. Khớp Ngữ nghĩa AI Đa ngành & Chuyển giao Năng lực (Transferable Skills)
            ai_matched = False
            best_sem_score = 0.0
            best_cs_match = None
            for cs in cand_profile.skills:
                # Kiểm tra tương đương trực tiếp qua semantic embedding
                raw_sem = semantic_matcher.compute_similarity(req.skill_name.strip(), cs.skill_name.strip())
                gated_sem = raw_sem * (0.2 + 0.8 * domain_compat)
                if gated_sem >= mandatory_threshold and gated_sem > best_sem_score:
                    best_sem_score = gated_sem
                    best_cs_match = cs

            if best_sem_score >= mandatory_threshold and best_cs_match:
                level_multiplier = min(1.0, self._get_level_val(best_cs_match.proficiency_level) / float(self._get_level_val(req.minimum_level)))
                final_skill_score = best_sem_score * level_multiplier

                # Check skill experience years requirement
                years_gap_info = None
                if req_min_years > 0:
                    if cand_skill_years < req_min_years:
                        ratio = cand_skill_years / req_min_years
                        penalty_mult = 0.65 + 0.35 * max(0.2, min(1.0, ratio))
                        final_skill_score *= penalty_mult
                        years_gap_info = {
                            "req_years": req_min_years,
                            "actual_years": cand_skill_years,
                            "ratio": round(ratio, 2),
                            "penalty_msg": f"Kỹ năng '{req.skill_name}': Thâm niên thực tế ({cand_skill_years:.1f} năm) chưa đủ số năm yêu cầu của JD ({req_min_years:.1f} năm). Đã trừ điểm thâm niên kỹ năng tương ứng."
                        }

                matched.append({
                    "name": req.skill_name,
                    "isMandatory": is_man,
                    "source": f"Kỹ năng tương đương: {best_cs_match.skill_name}",
                    "actual_years": cand_skill_years,
                    "req_years": req_min_years,
                    "years_gap": years_gap_info
                })
                evidence_list.append({
                    "skillName": req.skill_name,
                    "evidenceText": f"AI nhận diện kỹ năng '{best_cs_match.skill_name}' tương đương '{req.skill_name}' (Độ khớp: {best_sem_score*100:.1f}%)",
                    "source": "semantic_embedding"
                })
                if is_man:
                    mandatory_scores.append(final_skill_score)
                    mandatory_credits.append(1.0)
                else:
                    optional_scores.append(final_skill_score)
                ai_matched = True
            else:
                # Kiểm tra năng lực chuyển giao trong cùng nhóm nghiệp vụ (Functional Cluster)
                for cs in cand_profile.skills:
                    is_trans, trans_credit = self._is_transferable_skill(req.skill_name, cs.skill_name)
                    if is_trans:
                        level_multiplier = min(1.0, self._get_level_val(cs.proficiency_level) / float(self._get_level_val(req.minimum_level)))
                        final_skill_score = trans_credit * level_multiplier

                        matched.append({
                            "name": req.skill_name,
                            "isMandatory": is_man,
                            "source": f"Kỹ năng chuyển giao: {cs.skill_name}",
                            "actual_years": cand_skill_years,
                            "req_years": req_min_years,
                            "years_gap": None
                        })
                        evidence_list.append({
                            "skillName": req.skill_name,
                            "evidenceText": f"Kỹ năng '{cs.skill_name}' có thể chuyển giao sang '{req.skill_name}' (Cùng phân khúc công nghệ)",
                            "source": "transferable_skill"
                        })
                        if is_man:
                            mandatory_scores.append(final_skill_score)
                            mandatory_credits.append(trans_credit)
                            missing_mandatory.append(req.skill_name)
                        else:
                            optional_scores.append(final_skill_score)
                        ai_matched = True
                        break

            if ai_matched:
                continue

            # 3. Tìm kiếm trong Bối cảnh (Kinh nghiệm làm việc & Dự án thực tế)
            ctx_score, ctx_text, ctx_source = self._search_in_context(norm_req_name, req.skill_name, cand_profile, job, domain_compat, job_subdom)
            if ctx_score >= mandatory_threshold:
                matched.append({
                    "name": req.skill_name,
                    "isMandatory": is_man,
                    "source": ctx_source,
                    "actual_years": cand_skill_years,
                    "req_years": req_min_years
                })
                evidence_list.append({"skillName": req.skill_name, "evidenceText": ctx_text, "source": ctx_source})
                if is_man:
                    mandatory_scores.append(ctx_score)
                    mandatory_credits.append(0.95)
                else:
                    optional_scores.append(ctx_score)
            elif ctx_score >= transferable_threshold:
                matched.append({
                    "name": req.skill_name,
                    "isMandatory": is_man,
                    "source": f"{ctx_source} (Chuyển giao)",
                    "actual_years": cand_skill_years,
                    "req_years": req_min_years
                })
                evidence_list.append({"skillName": req.skill_name, "evidenceText": ctx_text, "source": ctx_source})
                if is_man:
                    mandatory_scores.append(ctx_score * 0.85)
                    mandatory_credits.append(0.50 * ctx_score)
                    missing_mandatory.append(req.skill_name)
                else:
                    optional_scores.append(ctx_score * 0.85)
            else:
                domain_credit = self._calc_domain_transferability(req.skill_name, cand_norm_names, is_man, job, domain_compat, job_subdom)
                if is_man:
                    mandatory_scores.append(domain_credit)
                    missing_mandatory.append(req.skill_name)
                    mandatory_credits.append(0.20 * domain_credit)
                else:
                    optional_scores.append(max(0.0, domain_credit))
                missing.append({
                    "name": req.skill_name,
                    "isMandatory": is_man,
                    "transfer_credit": domain_credit,
                    "req_years": req_min_years
                })

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

        total_man = sum(1 for r in job_req_skills if r.is_mandatory)
        man_ratio = (sum(mandatory_credits) / float(total_man)) if total_man > 0 else 1.0
        man_ratio = max(0.0, min(1.0, man_ratio))

        return {
            "score": raw_score * p_density,
            "matched": matched,
            "missing": missing,
            "missing_mandatory": missing_mandatory,
            "mandatory_ratio": man_ratio,
            "evidence": evidence_list,
            "p_density": p_density
        }

    def _get_level_val(self, lvl: str) -> int:
        return {"BEGINNER": 1, "INTERMEDIATE": 2, "ADVANCED": 3, "EXPERT": 4}.get((lvl or "BEGINNER").upper(), 1)

    def _is_transferable_skill(self, skill_a: str, skill_b: str) -> Tuple[bool, float]:
        """
        Determines whether skill_a and skill_b belong to the same functional skill cluster
        and returns (is_transferable, credit_score).
        """
        s_a = skill_a.lower().strip()
        s_b = skill_b.lower().strip()

        clusters = [
            # Frontend Modern Frameworks
            {"react", "reactjs", "react.js", "next.js", "nextjs", "vue", "vuejs", "vue.js", "nuxt", "nuxtjs", "nuxt.js", "angular", "angularjs", "svelte"},
            # Backend Runtimes & Frameworks
            {"node.js", "nodejs", "node", "nestjs", "express", "express.js", "fastapi", "django", "flask", "spring", "spring boot", "golang", "go", ".net", "dotnet", "asp.net", "laravel", "ruby on rails"},
            # Relational SQL Databases
            {"postgresql", "postgres", "mysql", "mariadb", "oracle", "sql server", "mssql", "sqlite"},
            # NoSQL Document & Key-Value Databases
            {"mongodb", "redis", "dynamodb", "cassandra", "couchdb", "elasticsearch"},
            # DevOps, Containers & Orchestration
            {"docker", "kubernetes", "k8s", "podman", "containerd", "helm", "terraform"},
            # Cloud Service Providers
            {"aws", "amazon web services", "azure", "gcp", "google cloud"},
            # Accounting, ERP & Tax Software
            {"misa", "bravo", "fast", "sap fico", "sap", "báo cáo tài chính", "kế toán thuế", "quyết toán thuế", "vas", "ifrs"},
            # Digital Marketing Ad Platforms
            {"facebook ads", "fb ads", "meta ads", "google ads", "tiktok ads", "zalo ads", "performance marketing"},
            # Design & UI/UX Tools
            {"figma", "sketch", "adobe xd", "photoshop", "illustrator"}
        ]

        for cluster in clusters:
            if any(k in s_a for k in cluster) and any(k in s_b for k in cluster):
                return True, 0.85

        return False, 0.0

    def _calculate_skill_years(self, skill_name: str, cand_profile: CandidateProfilePayload) -> float:
        """Calculates cumulative years candidate has explicitly worked with this specific technology."""
        s_clean = skill_name.lower().strip()
        total_months = 0.0

        # Strict explicit technology aliases mapping (no broad role spillover like 'frontend' or 'backend')
        strict_tech_aliases: Dict[str, List[str]] = {
            "react": ["react", "reactjs", "react.js", "react-native"],
            "next.js": ["next.js", "nextjs", "next js"],
            "node.js": ["node.js", "nodejs", "node js", "express", "expressjs", "nestjs"],
            "postgresql": ["postgresql", "postgres", "psql"],
            "typescript": ["typescript", "ts"],
            "tailwind css": ["tailwind", "tailwindcss", "tailwind css"],
            "docker": ["docker", "dockerfile", "docker-compose", "containerization"]
        }
        target_aliases = strict_tech_aliases.get(s_clean, [s_clean])

        def contains_alias(text: str) -> bool:
            if not text:
                return False
            text_lower = text.lower()
            return any(re.search(rf"\b{re.escape(alias)}\b", text_lower) for alias in target_aliases)

        for exp in getattr(cand_profile, "work_experiences", []) or []:
            exp_text = f"{exp.position_title or ''} {exp.description or ''} {exp.achievements or ''}"
            if contains_alias(exp_text):
                start_d = getattr(exp, "start_date", None)
                end_d = getattr(exp, "end_date", None)
                if start_d:
                    try:
                        dt_start = datetime.fromisoformat(str(start_d).replace("Z", "+00:00"))
                        if getattr(exp, "is_current", False) or not end_d:
                            dt_end = datetime.now(timezone.utc)
                        else:
                            dt_end = datetime.fromisoformat(str(end_d).replace("Z", "+00:00"))
                        months = max(1.0, (dt_end.year - dt_start.year) * 12 + (dt_end.month - dt_start.month))
                        total_months += months
                    except Exception:
                        total_months += 6.0

        for proj in getattr(cand_profile, "projects", []) or []:
            proj_techs = [t.lower().strip() for t in (getattr(proj, "technologies", []) or [])]
            proj_text = f"{proj.project_name or ''} {proj.description or ''}"
            has_in_techs = any(any(re.search(rf"\b{re.escape(alias)}\b", t) for alias in target_aliases) for t in proj_techs)
            if has_in_techs or contains_alias(proj_text):
                if getattr(proj, "start_date", None) and getattr(proj, "end_date", None):
                    try:
                        dt_start = datetime.fromisoformat(str(proj.start_date).replace("Z", "+00:00"))
                        dt_end = datetime.fromisoformat(str(proj.end_date).replace("Z", "+00:00"))
                        months = max(1.0, (dt_end.year - dt_start.year) * 12 + (dt_end.month - dt_start.month))
                        total_months += min(months, 12.0)
                    except Exception:
                        total_months += 3.0
                else:
                    total_months += 3.0

        # If total_months is 0 but candidate explicitly listed skill in profile.skills:
        if total_months == 0:
            for cs in getattr(cand_profile, "skills", []) or []:
                cs_name = cs.skill_name.lower().strip()
                if any(alias == cs_name or alias in cs_name for alias in target_aliases):
                    lvl = (getattr(cs, "proficiency_level", None) or "BEGINNER").upper()
                    if lvl == "EXPERT": total_months = 48.0
                    elif lvl == "ADVANCED": total_months = 24.0
                    elif lvl == "INTERMEDIATE": total_months = 12.0
                    else: total_months = 6.0
                    break

        return round(total_months / 12.0, 1)

    def _skill_match_key(self, skill) -> str:
        """Return a stable key while preserving V3 matching semantics."""
        canonical_name = getattr(skill, "normalized_name", None)
        if canonical_name and canonical_name.strip():
            return canonical_name.strip().casefold()
        return normalize_skill_name(skill.skill_name).strip().casefold()

    def _calc_domain_transferability(
        self, target_skill: str, cand_skills: set, is_man: bool, job: JobPayload = None, domain_compat: float = 1.0, job_subdom: str = "GENERAL"
    ) -> float:
        if not is_man or not cand_skills: return 0.0
        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode if job else 'Professional'}"
        target_skill_v2 = f"{job_context} [CONTENT] {target_skill}"

        sim_scores = []
        for cs in cand_skills:
            cs_domain = self._detect_subdomain(cs)
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: {cs_domain} | Seniority: experienced"
            sim_scores.append(semantic_matcher.compute_similarity(target_skill_v2, f"{cand_context_pro} [CONTENT] {cs}") * (0.2 + 0.8 * domain_compat))

        best_sim = max(sim_scores + [0.0])
        is_entry_level = self._is_entry_level(job)
        threshold = 0.70 if is_entry_level else 0.78
        if is_man and best_sim < threshold:
            return 0.0
        return best_sim

    def _search_in_context(
        self, norm_req, req_name, profile, job: JobPayload = None, domain_compat: float = 1.0, job_subdom: str = "GENERAL"
    ):
        best_score, best_text, best_source = 0.0, "", ""
        is_explicit = False
        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode if job else 'Professional'}"
        req_name_v2 = f"{job_context} [CONTENT] {req_name}"

        multiplier = (0.2 + 0.8 * domain_compat)
        target_aliases = [norm_req, req_name] if norm_req else [req_name]
        alias_clean = [a.lower().strip() for a in target_aliases if a]

        for exp in profile.work_experiences:
            exp_text = f"{exp.position_title or ''} {exp.description or ''} {exp.achievements or ''}"
            exp_text_lower = exp_text.lower()
            exp_domain = self._detect_subdomain(exp_text)
            seniority = "senior" if any(k in (exp.position_title or "").lower() for k in ["senior", "trưởng", "manager", "lead", "head"]) else "experienced"
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: {exp_domain} | Seniority: {seniority}"
            text_v2 = f"{cand_context_pro} [CONTENT] {exp_text}"

            has_direct_kw = any(re.search(rf"\b{re.escape(a)}\b", exp_text_lower) for a in alias_clean)
            if has_direct_kw:
                score_val = 0.95 * multiplier
                if score_val > best_score:
                    best_score, best_text, best_source = score_val, exp_text, f"Kinh nghiệm: {exp.position_title}"
                    is_explicit = True
            elif not is_explicit:
                sim = semantic_matcher.compute_similarity(req_name_v2, text_v2) * multiplier
                # Gián tiếp qua văn cảnh chỉ đạt tối đa mức chuyển giao (capped at 0.70)
                sim = min(0.70, sim * 0.80)
                if sim > best_score:
                    best_score, best_text, best_source = sim, exp_text, f"Kinh nghiệm: {exp.position_title}"

        for proj in profile.projects:
            proj_text = f"{proj.project_name or ''} {proj.description or ''} {' '.join(proj.technologies or [])}"
            proj_text_lower = proj_text.lower()
            proj_domain = self._detect_subdomain(proj_text)
            cand_context_proj = f"[CONTEXT] Type: project | Domain: {proj_domain} | Seniority: experienced"
            text_v2 = f"{cand_context_proj} [CONTENT] {proj_text}"

            has_direct_kw = any(re.search(rf"\b{re.escape(a)}\b", proj_text_lower) for a in alias_clean)
            if has_direct_kw:
                score_val = 0.95 * multiplier
                if score_val > best_score:
                    best_score, best_text, best_source = score_val, proj_text, f"Dự án: {proj.project_name}"
                    is_explicit = True
            elif not is_explicit:
                sim = semantic_matcher.compute_similarity(req_name_v2, text_v2) * multiplier
                sim = min(0.70, sim * 0.80)
                if sim > best_score:
                    best_score, best_text, best_source = sim, proj_text, f"Dự án: {proj.project_name}"

        is_entry_level = self._is_entry_level(job)
        if "Dự án" in best_source and not is_entry_level:
            best_score *= 0.85

        return best_score, best_text, best_source

    def _match_experience(self, cand_profile: CandidateProfilePayload, job: JobPayload, domain_compat: float) -> Dict[str, Any]:
        level_assessment = None
        if job.experience_level:
            level_assessment = experience_level_evaluator.evaluate(
                cand_profile.work_experiences,
                job.experience_level,
                job.level_requirement_mode,
                job.evaluation_date,
            )

        total_years = self._calculate_total_years(cand_profile.work_experiences)
        req_years = float(job.required_experience_years or 0.0)

        duration_ratio = (total_years / req_years) if req_years > 0.0 else 1.0
        if duration_ratio < 0.6:
            duration_score = max(0.1, (duration_ratio ** 1.3))
        else:
            duration_score = min(1.0, duration_ratio)

        candidate_titles = [exp.position_title for exp in cand_profile.work_experiences if exp.position_title]
        j_title_lower = job.title.lower()
        is_job_intern = "intern" in j_title_lower

        best_rel = 0.0
        for c_title in candidate_titles:
            c_title_lower = c_title.lower()
            rel = 1.0 if (c_title_lower in j_title_lower or j_title_lower in c_title_lower) else semantic_matcher.compute_similarity(job.title, c_title)
            if "intern" in c_title_lower and not is_job_intern: rel *= 0.55
            best_rel = max(best_rel, rel)

        relevance_score = (0.6 * best_rel + 0.4 * (0.3 + 0.7 * domain_compat))
        exp_score = 0.5 * duration_score + 0.5 * relevance_score if cand_profile.work_experiences else 0.2

        project_metrics = self._eval_projects(cand_profile, job)
        project_score = project_metrics["score"]

        if cand_profile.work_experiences and cand_profile.projects:
            final_score = 0.7 * exp_score + 0.3 * project_score
        elif cand_profile.work_experiences:
            final_score = exp_score
        elif cand_profile.projects:
            final_score = project_score
        else:
            final_score = 0.2

        if level_assessment is not None:
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
            "domain_compat": domain_compat,
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
        if not educations: return {"score": 0.2, "has_degree": False, "best_major": None, "best_sim": 0.0}

        job_desc = f"{job.title} {job.description or ''}"
        majors = [e.major for e in educations if e.major]
        if not majors: return {"score": 0.2, "has_degree": True, "best_major": None, "best_sim": 0.0}

        job_domain = self._detect_subdomain(job_desc)
        job_edu_ctx = f"[CONTEXT] Domain: {job_domain} | Environment: Academic [CONTENT] Tuyển dụng {job.title}"

        best_sim = 0.0
        best_major = None
        for m in majors:
            major_domain = self._detect_subdomain(m)
            cand_edu_ctx = f"[CONTEXT] Type: academic | Domain: {major_domain} | Seniority: intern [CONTENT] Cử nhân {m}"
            sim = semantic_matcher.compute_similarity(job_edu_ctx, cand_edu_ctx)

            if sim > best_sim:
                best_sim, best_major = sim, m

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
            return {"score": 1.0 if cand_certs else 0.8, "matched": [], "missing": []}

        if not cand_certs:
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
                matched.append(req.certificate_name)
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
