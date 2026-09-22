import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from app.schemas.matching import CandidateProfilePayload, JobPayload
from app.services.matching.experience_level_evaluator import experience_level_evaluator
from app.services.matching.semantic import semantic_matcher
from app.services.matching.knowledge_graph import skill_kg
from app.services.matching.temporal_engine import temporal_engine
from app.services.matching.late_interaction import late_interaction_scorer
from app.services.matching.fraud_auditor import anti_inflation_auditor
from app.services.matching.language_matcher import language_matcher
from app.services.matching.transferable_skills import transferable_skills_engine
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
            job_title_subdom = self._detect_subdomain(job.title or "")
            if job_title_subdom != "GENERAL_PROFESSIONAL":
                job_subdomain = job_title_subdom
            else:
                job_subdomain = self._detect_subdomain(
                    f"{job.title} {job.description or ''} {job.requirements or ''}"
                )

            prof = cand_profile.profile
            desired_title = (prof.desired_title or "").strip() if prof else ""
            exp_titles = " ".join(
                [
                    exp.position_title
                    for exp in (cand_profile.work_experiences or [])
                    if exp.position_title
                ]
            )
            cand_role_titles = f"{desired_title} {exp_titles}".strip()
            cand_subdomain = "GENERAL_PROFESSIONAL"
            if cand_role_titles:
                cand_subdomain = self._detect_subdomain(cand_role_titles)

            if cand_subdomain == "GENERAL_PROFESSIONAL":
                cand_summary = (prof.professional_summary or "") if prof else ""
                cand_exp_texts = " ".join(
                    [
                        f"{exp.position_title} {exp.company_name} {exp.description or ''}"
                        for exp in (cand_profile.work_experiences or [])
                    ]
                )
                cand_subdomain = self._detect_subdomain(
                    f"{cand_role_titles} {cand_summary} {cand_exp_texts}"
                )

            domain_compat = self._calc_domain_compatibility(
                job_subdomain, cand_subdomain
            )

            # V4 Audit & Temporal Diagnostics
            audit_res = anti_inflation_auditor.audit_profile(cand_profile, job)
            career_vel_res = temporal_engine.calculate_career_velocity(
                cand_profile.work_experiences
            )

            skills_res = self._match_skills(
                cand_profile, job, domain_compat, job_subdomain, cand_subdomain
            )
            exp_res = self._match_experience(cand_profile, job, domain_compat)
            edu_res = self._match_education(cand_profile, job)
            cert_res = self._match_certificates(cand_profile, job)
            lang_res = language_matcher.match(cand_profile, job)

            # Combine Pillar 4: Certification & Language
            has_lang_req = lang_res.get("has_requirements", False)
            has_cert_req = bool(job.required_certificates)

            if has_lang_req and has_cert_req:
                other_score = 0.5 * lang_res["score"] + 0.5 * cert_res["score"]
            elif has_lang_req:
                other_score = lang_res["score"]
            elif has_cert_req:
                other_score = cert_res["score"]
            else:
                other_score = 1.0

            other_res = {
                "score": round(other_score, 4),
                "certificates": cert_res,
                "language": lang_res,
                "has_cert_req": has_cert_req,
                "has_lang_req": has_lang_req,
                "cand_cert_count": len(getattr(cand_profile, "certificates", []) or []),
                "cand_lang_count": len(getattr(cand_profile, "languages", []) or []),
            }

            # V4 Late Interaction token alignment
            jd_clauses = late_interaction_scorer.extract_clauses_from_job(job)
            cand_passages = late_interaction_scorer.extract_passages_from_profile(
                cand_profile
            )
            late_score, late_alignments = late_interaction_scorer.compute_clause_maxsim(
                jd_clauses, cand_passages
            )

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

        # REAL ESTATE & BROKERAGE (REAL_) - Bất động sản & Địa ốc
        if any(
            k in t
            for k in [
                "bất động sản",
                "địa ốc",
                "nhà đất",
                "sàn giao dịch",
                "môi giới bất động sản",
                "condotel",
                "đất nền",
                "novaland",
                "vinhomes",
                "căn hộ",
                "biệt thự",
            ]
        ):
            return "REAL_ESTATE_BROKERAGE"

        # 0. SALES & COMMERCIAL DISTRIBUTION (SALES_) - Ưu tiên nhận diện vai trò bán hàng & quản lý kênh phân phối
        if any(
            k in t
            for k in [
                "area sales manager",
                " asm ",
                "asm,",
                "asm.",
                "(asm)",
                "rsm",
                "nsm",
                "quản lý bán hàng",
                "giám sát bán hàng",
                "sales supervisor",
                "quản lý kinh doanh",
                "kênh phân phối",
                "nhà phân phối",
                "npp",
                "horeca",
                "foodservice",
                "sell-in",
                "sell-out",
                "điểm bán lẻ",
                "tổng thầu phân phối",
                "commercial negotiation",
                "key accounts",
                "sales team management",
                "territory leadership",
            ]
        ):
            if any(
                k in t
                for k in [
                    "pharma",
                    "dược",
                    "thuốc",
                    "trình dược",
                    "bệnh viện",
                    "kênh etc",
                    "kênh otc",
                    "nhà thuốc",
                ]
            ):
                return "SALES_PHARMA_HEALTHCARE"
            if any(
                k in t
                for k in [
                    "fmcg",
                    "thực phẩm",
                    "đồ uống",
                    "f&b",
                    "bánh kẹo",
                    "gia vị",
                    "hóa mỹ phẩm",
                    "tiêu dùng nhanh",
                    "sauce",
                    "nước mắm",
                    "mì ăn liền",
                    "nước ngọt",
                ]
            ):
                return "SALES_FMCG_CONSUMER"
            if any(
                k in t
                for k in [
                    "b2b",
                    "doanh nghiệp",
                    "khách hàng doanh nghiệp",
                    "giải pháp b2b",
                    "thiết bị",
                ]
            ):
                return "SALES_B2B_ENTERPRISE"
            return "SALES_DISTRIBUTION_CHANNELS"

        if any(k in t for k in ["fmcg", "tiêu dùng nhanh"]) and any(
            k in t
            for k in ["sales", "bán hàng", "kinh doanh", "thị trường", "phân phối"]
        ):
            return "SALES_FMCG_CONSUMER"

        if any(
            k in t
            for k in [
                "trình dược viên",
                "trình dược y tế",
                "sales pharma",
                "quản lý trình dược",
            ]
        ):
            return "SALES_PHARMA_HEALTHCARE"

        # 1. IT & SOFTWARE ENGINEERING (IT_) - Ưu tiên nhận diện vai trò kỹ thuật phần mềm
        if any(
            k in t
            for k in [
                "fullstack",
                "full stack",
                "web developer",
                "lập trình web",
                "kỹ sư phần mềm",
            ]
        ):
            return "IT_FULLSTACK_DEV"
        if any(
            k in t
            for k in [
                "flutter",
                "dart",
                "react native",
                "react-native",
                "mobile developer",
                "mobile app",
                "lập trình mobile",
                "lập trình di động",
                "swiftui",
                "jetpack compose",
                "ios developer",
                "android developer",
                "lập trình ios",
                "lập trình android",
            ]
        ) or bool(
            re.search(
                r"\b(?:swift|kotlin|xcode|objective[- ]c|cocoapods)\b",
                t,
            )
        ) or bool(
            re.search(
                r"\b(?:ios|android)\s+(?:developer|engineer|dev|app|application|sdk)\b",
                t,
            )
        ):
            return "IT_MOBILE_APP"
        if any(
            k in t
            for k in [
                "react",
                "vue",
                "nextjs",
                "next.js",
                "angular",
                "frontend",
                "front-end",
                "html/css",
                "tailwind",
                "ui developer",
            ]
        ):
            return "IT_FRONTEND_WEB"
        if any(
            k in t
            for k in [
                "java",
                "spring",
                "backend",
                "back-end",
                "microservices",
                "postgresql",
                "kafka",
                "redis",
                "golang",
                "nodejs",
                "node.js",
                "rest api",
                "database",
                "sql",
            ]
        ):
            return "IT_BACKEND_SYSTEMS"
        if any(
            k in t
            for k in [
                "devops",
                "kubernetes",
                "docker",
                "ci/cd",
                "aws",
                "terraform",
                "cloud architect",
                "sysadmin",
            ]
        ):
            return "IT_DEVOPS_CLOUD"
        if any(
            k in t
            for k in [
                "ai engineer",
                "machine learning",
                "deep learning",
                "nlp",
                "llm",
                "pytorch",
                "tensorflow",
                "data science",
                "data engineer",
            ]
        ):
            return "IT_AI_DATA_SCIENCE"
        if any(
            k in t
            for k in [
                "embedded",
                "firmware",
                "iot",
                "microcontroller",
                "stm32",
                "arm",
                "rtos",
                "c/c++",
                "phần cứng",
            ]
        ):
            return "IT_EMBEDDED_FIRMWARE"

        # 2. DESIGN & CREATIVE (DESIGN_)
        if any(
            k in t
            for k in [
                "figma",
                "ui/ux",
                "design system",
                "wirefram",
                "product design",
                "ux design",
                "ui designer",
                "product designer",
            ]
        ):
            return "DESIGN_UI_UX"
        if any(
            k in t
            for k in [
                "3d artist",
                "blender",
                "maya",
                "3d animation",
                "game art",
                "concept art",
            ]
        ):
            return "DESIGN_3D_GAME_ART"
        if any(
            k in t
            for k in [
                "graphic designer",
                "illustrator",
                "photoshop",
                "thiết kế đồ họa",
                "in ấn",
                "branding",
            ]
        ):
            return "DESIGN_GRAPHIC_BRANDING"

        # 3. FINANCE & ACCOUNTING (FIN_)
        if any(
            k in t
            for k in [
                "chứng khoán",
                "định giá cổ phiếu",
                "equity research",
                "cfa",
                "quỹ đầu tư",
                "investment",
                "bloomberg",
                "m&a",
                "thẩm định đầu tư",
            ]
        ):
            return "FIN_INVESTMENT_BANKING"
        if any(
            k in t
            for k in [
                "kiểm toán",
                "auditing",
                "big 4",
                "soát xét",
                "internal audit",
                "kiểm soát nội bộ",
            ]
        ):
            return "FIN_AUDIT_INTERNAL_CONTROL"
        if any(
            k in t
            for k in [
                "kế toán",
                "quyết toán thuế",
                "báo cáo thuế",
                "hạch toán",
                "misa",
                "sổ sách kế toán",
                "thuế tndn",
                "tax accountant",
                "kế toán trưởng",
                "cpa việt nam",
                "chứng chỉ cpa",
            ]
        ):
            return "FIN_TAX_ACCOUNTING"
        if any(
            k in t
            for k in [
                "ngân hàng bán lẻ",
                "thẩm định tín dụng",
                "credit risk",
                "teller",
                "giao dịch viên",
                "tín dụng ngân hàng",
                "hồ sơ vay tín chấp",
                "tín dụng thế chấp",
            ]
        ):
            return "FIN_RETAIL_BANKING"

        # 4. MARKETING & GROWTH (MKT_)
        if any(
            k in t
            for k in [
                "app install",
                "user acquisition",
                "cpi",
                "appsflyer",
                "adjust",
                "skadnetwork",
                "unity ads",
                "game marketing",
                "mobile game marketing",
                "game ua",
            ]
        ) or (
            any(g in t for g in ["game", "gaming"])
            and any(
                m in t
                for m in [
                    "marketing",
                    "ua",
                    "acquisition",
                    "user acquisition",
                    "ads",
                    "publisher",
                    "phát hành",
                ]
            )
        ):
            return "MKT_MOBILE_GAMING_UA"
        if any(
            k in t
            for k in [
                "b2b marketing",
                "b2b saas",
                "lead gen",
                "mql",
                "sql lead",
                "hubspot",
            ]
        ):
            return "MKT_B2B_SAAS"
        if any(
            k in t
            for k in [
                "agency",
                "media planner",
                "tài khoản khách hàng",
                "nhãn hàng",
                "media executive",
            ]
        ):
            return "MKT_AGENCY_SERVICES"
        if any(
            k in t
            for k in [
                "e-commerce",
                "ecommerce",
                "d2c",
                "shopee",
                "tiktok shop",
                "shopify",
                "lazada",
                "bán lẻ trực tuyến",
                "giỏ hàng",
            ]
        ):
            return "MKT_ECOMMERCE_D2C"
        if any(
            k in t
            for k in [
                "content",
                "fanpage",
                "social media",
                "post engagement",
                "livestream",
                "canva",
                "copywriter",
            ]
        ):
            return "MKT_SOCIAL_CONTENT"

        # 5. EDUCATION & TRAINING (EDU_)
        if any(
            k in t
            for k in [
                "ielts",
                "academic english",
                "celta",
                "tesol",
                "tiếng anh học thuật",
                "giáo viên tiếng anh",
            ]
        ):
            return "EDU_ACADEMIC_ESL"
        if any(
            k in t
            for k in ["mầm non", "montessori", "tiểu học", "k12", "giáo viên tiểu học"]
        ):
            return "EDU_EARLY_CHILDHOOD_K12"
        if any(
            k in t
            for k in [
                "đào tạo nội bộ",
                "corporate trainer",
                "instructional design",
                "l&d",
            ]
        ):
            return "EDU_CORPORATE_TRAINING"

        # 6. HEALTHCARE & MEDICINE (MED_)
        if any(
            k in t
            for k in [
                "bác sĩ",
                "chẩn đoán lâm sàng",
                "khám chữa bệnh",
                "doctor",
                "medical practitioner",
            ]
        ):
            return "MED_CLINICAL_DOCTOR"
        if any(k in t for k in ["dược sĩ", "dược lâm sàng", "pharmacist"]):
            return "MED_PHARMACEUTICAL"
        if any(k in t for k in ["điều dưỡng", "y tá", "chăm sóc bệnh nhân", "nursing"]):
            return "MED_NURSING_CARE"

        # 7. LOGISTICS & SUPPLY CHAIN (LOG_)
        if any(
            k in t
            for k in [
                "kho bãi",
                "wms",
                "quản lý kho",
                "inventory",
                "kho vận",
                "warehouse",
            ]
        ):
            return "LOG_WAREHOUSE_WMS"
        if any(
            k in t
            for k in [
                "xuất nhập khẩu",
                "hải quan",
                "forwarding",
                "import export",
                "freight",
                "incoterms",
            ]
        ):
            return "LOG_CUSTOMS_FORWARDING"
        if any(
            k in t
            for k in ["đội xe", "fleet", "vận tải", "giao nhận", "last mile", "tài xế"]
        ):
            return "LOG_FLEET_TRANSPORT"

        # 8. HUMAN RESOURCES (HR_)
        if any(
            k in t
            for k in [
                "tuyển dụng",
                "recruiter",
                "headhunt",
                "talent acquisition",
                "sourcing",
            ]
        ):
            return "HR_RECRUITMENT_TALENT"
        if any(
            k in t
            for k in ["c&b", "lương thưởng", "phúc lợi", "bảo hiểm xã hội", "payroll"]
        ):
            return "HR_COMPENSATION_BENEFITS"
        if any(
            k in t
            for k in [
                "hành chính nhân sự",
                "hr generalist",
                "văn hóa doanh nghiệp",
                "employee relations",
            ]
        ):
            return "HR_GENERAL_OPERATIONS"

        # 9. LEGAL & COMPLIANCE (LAW_)
        if any(
            k in t
            for k in [
                "luật sư",
                "hợp đồng thương mại",
                "pháp chế doanh nghiệp",
                "corporate legal",
                "m&a legal",
            ]
        ):
            return "LAW_CORPORATE_LEGAL"
        if any(
            k in t
            for k in [
                "sở hữu trí tuệ",
                "patent",
                "bản quyền",
                "trademark",
                "ip attorney",
            ]
        ):
            return "LAW_INTELLECTUAL_PROPERTY"
        if any(
            k in t for k in ["tuân thủ", "compliance", "regulatory", "pháp lý rủi ro"]
        ):
            return "LAW_REGULATORY_COMPLIANCE"

        # 10. MANUFACTURING & INDUSTRIAL (MFG_)
        if any(
            k in t
            for k in [
                "plc",
                "scada",
                "tự động hóa",
                "kỹ sư điện tự động",
                "automation engineer",
            ]
        ):
            return "MFG_AUTOMATION_PLC"
        if any(
            k in t
            for k in [
                "qa/qc",
                "quản lý chất lượng",
                "iso 9001",
                "kiểm soát chất lượng",
                "qc nhà máy",
            ]
        ):
            return "MFG_QUALITY_CONTROL"
        if any(
            k in t
            for k in [
                "quản đốc",
                "sản xuất nhà máy",
                "dây chuyền sản xuất",
                "plant manager",
                "lean 5s",
            ]
        ):
            return "MFG_PLANT_OPERATIONS"

        # 11. HOSPITALITY & F&B (HOSP_)
        if any(
            k in t
            for k in [
                "khách sạn",
                "hotel manager",
                "resort",
                "tiền sảnh",
                "front office",
                "buồng phòng",
            ]
        ):
            return "HOSP_HOTEL_RESORT"
        if any(
            k in t
            for k in [
                "nhà hàng",
                "bếp trưởng",
                "barista",
                "phục vụ bàn",
                "quản lý nhà hàng",
            ]
        ):
            return "HOSP_FB_RESTAURANT"

        # 12. REAL ESTATE & CONSTRUCTION (REAL_)
        if any(
            k in t
            for k in [
                "môi giới bđs",
                "bất động sản",
                "nhà đất",
                "căn hộ",
                "real estate broker",
            ]
        ):
            return "REAL_PROPERTY_BROKERAGE"
        if any(
            k in t
            for k in [
                "kỹ sư xây dựng",
                "chỉ huy trưởng",
                "thi công công trình",
                "civil engineer",
                "autocad xây dựng",
            ]
        ):
            return "REAL_CIVIL_CONSTRUCTION"

        # 13. AGRICULTURE & AGRITECH (AGRI_)
        if any(
            k in t
            for k in [
                "trồng trọt",
                "nông nghiệp công nghệ cao",
                "nhà màng",
                "thổ nhưỡng",
                "cây trồng",
                "agritech",
            ]
        ):
            return "AGRI_CROP_FARMING"
        if any(
            k in t
            for k in [
                "chăn nuôi",
                "thú y",
                "thức ăn chăn nuôi",
                "gia súc",
                "gia cầm",
                "veterinary",
            ]
        ):
            return "AGRI_LIVESTOCK_VET"

        # 14. CUSTOMER SERVICE & SUPPORT (CS_)
        if any(
            k in t
            for k in [
                "cskh",
                "chăm sóc khách hàng",
                "call center",
                "tổng đài",
                "customer support",
            ]
        ):
            return "CS_CUSTOMER_CARE"
        if any(
            k in t
            for k in ["it support", "helpdesk", "hỗ trợ kỹ thuật", "cài đặt phần cứng"]
        ):
            return "CS_TECH_HELPDESK"

        return "GENERAL_PROFESSIONAL"

    def _calc_domain_compatibility(self, job_dom: str, cand_dom: str) -> float:
        """
        Tính toán Hệ số Tương thích Mô hình Doanh nghiệp (Domain Compatibility Gating)
        trên Ma trận Taxonomy 15 Ngành Lớn.
        """
        if job_dom == cand_dom:
            return 1.0
        if "GENERAL" in job_dom or "GENERAL" in cand_dom:
            return 0.85

        job_family = job_dom.split("_")[0]
        cand_family = cand_dom.split("_")[0]

        # Khác khối ngành hoàn toàn
        if job_family != cand_family:
            # Ngoại lệ chuyển giao kỹ thuật công nghệ
            if ("MFG_AUTOMATION" in job_dom and "IT_EMBEDDED" in cand_dom) or (
                "IT_EMBEDDED" in job_dom and "MFG_AUTOMATION" in cand_dom
            ):
                return 0.65
            if ("IT_BACKEND" in job_dom and "DESIGN_UI_UX" in cand_dom) or (
                "DESIGN_UI_UX" in job_dom and "IT_BACKEND" in cand_dom
            ):
                return 0.40
            # Ngoại lệ chuyển giao Bán hàng FMCG vs Dược phẩm/Y tế
            if ("SALES_FMCG" in job_dom and "MED_PHARMACEUTICAL" in cand_dom) or (
                "MED_PHARMACEUTICAL" in job_dom and "SALES_FMCG" in cand_dom
            ):
                return 0.75
            if ("SALES_" in job_dom and "MKT_ECOMMERCE" in cand_dom) or (
                "MKT_ECOMMERCE" in job_dom and "SALES_" in cand_dom
            ):
                return 0.75
            if ("SALES_" in job_dom and "HOSP_FB" in cand_dom) or (
                "HOSP_FB" in job_dom and "SALES_" in cand_dom
            ):
                return 0.65
            if ("SALES_" in job_dom and "REAL_" in cand_dom) or (
                "REAL_" in job_dom and "SALES_" in cand_dom
            ):
                return 0.20
            return 0.15

        # CÙNG KHỐI NGÀNH (Intra-Family Distance)

        # 1. IT & Engineering
        if "IT_" in job_dom and "IT_" in cand_dom:
            if "FULLSTACK" in job_dom or "FULLSTACK" in cand_dom:
                return 0.95
            if ("MOBILE" in job_dom and "FRONTEND" in cand_dom) or (
                "FRONTEND" in job_dom and "MOBILE" in cand_dom
            ):
                return 0.95
            if ("MOBILE" in job_dom and "BACKEND" in cand_dom) or (
                "BACKEND" in job_dom and "MOBILE" in cand_dom
            ):
                return 0.85
            if ("FRONTEND" in job_dom and "BACKEND" in cand_dom) or (
                "BACKEND" in job_dom and "FRONTEND" in cand_dom
            ):
                return 0.85
            if ("DEVOPS" in job_dom and "BACKEND" in cand_dom) or (
                "BACKEND" in job_dom and "DEVOPS" in cand_dom
            ):
                return 0.85
            if ("AI" in job_dom and "BACKEND" in cand_dom) or (
                "BACKEND" in job_dom and "AI" in cand_dom
            ):
                return 0.80
            if "EMBEDDED" in job_dom or "EMBEDDED" in cand_dom:
                return 0.35
            return 0.90

        # 2. Marketing
        if ("AGENCY" in job_dom and "ECOMMERCE" in cand_dom) or (
            "ECOMMERCE" in job_dom and "AGENCY" in cand_dom
        ):
            return 0.88
        if ("B2B" in job_dom and "ECOMMERCE" in cand_dom) or (
            "ECOMMERCE" in job_dom and "B2B" in cand_dom
        ):
            return 0.75
        if "CONTENT" in job_dom or "CONTENT" in cand_dom:
            return 0.45
        if "GAMING" in job_dom or "GAMING" in cand_dom:
            return 0.22

        # 3. Finance & Accounting
        if ("TAX" in job_dom and "AUDIT" in cand_dom) or (
            "AUDIT" in job_dom and "TAX" in cand_dom
        ):
            return 0.75
        if ("TAX" in job_dom and "INVESTMENT" in cand_dom) or (
            "INVESTMENT" in job_dom and "TAX" in cand_dom
        ):
            return 0.22
        if ("RETAIL" in job_dom and "INVESTMENT" in cand_dom) or (
            "INVESTMENT" in job_dom and "RETAIL" in cand_dom
        ):
            return 0.40

        # 4. Healthcare
        if ("CLINICAL" in job_dom and "PHARMACEUTICAL" in cand_dom) or (
            "PHARMACEUTICAL" in job_dom and "CLINICAL" in cand_dom
        ):
            return 0.60
        if ("CLINICAL" in job_dom and "NURSING" in cand_dom) or (
            "NURSING" in job_dom and "CLINICAL" in cand_dom
        ):
            return 0.65

        # 5. Logistics
        if ("WAREHOUSE" in job_dom and "CUSTOMS" in cand_dom) or (
            "CUSTOMS" in job_dom and "WAREHOUSE" in cand_dom
        ):
            return 0.75
        if ("FLEET" in job_dom and "WAREHOUSE" in cand_dom) or (
            "WAREHOUSE" in job_dom and "FLEET" in cand_dom
        ):
            return 0.70

        # 6. Human Resources
        if ("RECRUITMENT" in job_dom and "COMPENSATION" in cand_dom) or (
            "COMPENSATION" in job_dom and "RECRUITMENT" in cand_dom
        ):
            return 0.65
        if ("GENERAL" in job_dom and "RECRUITMENT" in cand_dom) or (
            "RECRUITMENT" in job_dom and "GENERAL" in cand_dom
        ):
            return 0.80

        # 7. Legal
        if ("CORPORATE" in job_dom and "INTELLECTUAL" in cand_dom) or (
            "INTELLECTUAL" in job_dom and "CORPORATE" in cand_dom
        ):
            return 0.70
        if ("CORPORATE" in job_dom and "REGULATORY" in cand_dom) or (
            "REGULATORY" in job_dom and "CORPORATE" in cand_dom
        ):
            return 0.80

        # 8. Manufacturing
        if ("AUTOMATION" in job_dom and "PLANT" in cand_dom) or (
            "PLANT" in job_dom and "AUTOMATION" in cand_dom
        ):
            return 0.70
        if ("QUALITY" in job_dom and "PLANT" in cand_dom) or (
            "PLANT" in job_dom and "QUALITY" in cand_dom
        ):
            return 0.75

        # 9. Hospitality
        if ("HOTEL" in job_dom and "FB" in cand_dom) or (
            "FB" in job_dom and "HOTEL" in cand_dom
        ):
            return 0.65

        # 10. Real Estate
        if ("PROPERTY" in job_dom and "CIVIL" in cand_dom) or (
            "CIVIL" in job_dom and "PROPERTY" in cand_dom
        ):
            return 0.40

        # 11. Agriculture
        if ("CROP" in job_dom and "LIVESTOCK" in cand_dom) or (
            "LIVESTOCK" in job_dom and "CROP" in cand_dom
        ):
            return 0.55

        # 12. Customer Service
        if ("CUSTOMER" in job_dom and "TECH" in cand_dom) or (
            "TECH" in job_dom and "CUSTOMER" in cand_dom
        ):
            return 0.65

        # 13. Sales & Commercial Distribution
        if "SALES_" in job_dom and "SALES_" in cand_dom:
            if ("FMCG" in job_dom and "DISTRIBUTION" in cand_dom) or (
                "DISTRIBUTION" in job_dom and "FMCG" in cand_dom
            ):
                return 0.95
            if ("FMCG" in job_dom and "PHARMA" in cand_dom) or (
                "PHARMA" in job_dom and "FMCG" in cand_dom
            ):
                return 0.75
            if ("DISTRIBUTION" in job_dom and "PHARMA" in cand_dom) or (
                "PHARMA" in job_dom and "DISTRIBUTION" in cand_dom
            ):
                return 0.80
            if ("B2B" in job_dom and "FMCG" in cand_dom) or (
                "FMCG" in job_dom and "B2B" in cand_dom
            ):
                return 0.70
            return 0.85

        # Mặc định các phân ngành cùng họ
        return 0.65

    def _collect_semantic_texts(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> List[str]:
        texts: List[str] = []

        def add(*values: str | None) -> None:
            texts.extend(value for value in values if value and value.strip())

        job_full_text = (
            f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        )
        add(job.title, job_full_text)
        job_subdom = self._detect_subdomain(job_full_text)
        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode or 'Professional'}"

        for skill in job.required_skills:
            add(f"{job_context} [CONTENT] {skill.skill_name}")

        for skill in cand_profile.skills:
            cand_s_domain = self._detect_subdomain(skill.skill_name)
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: {cand_s_domain} | Seniority: experienced"
            add(
                f"{cand_context_pro} [CONTENT] {normalize_skill_name(skill.skill_name)}"
            )

        for exp in cand_profile.work_experiences:
            exp_text = (
                f"{exp.position_title} {exp.description or ''} {exp.achievements or ''}"
            )
            exp_domain = self._detect_subdomain(exp_text)
            seniority = (
                "senior"
                if any(
                    k in (exp.position_title or "").lower()
                    for k in ["senior", "trưởng", "manager", "lead", "head"]
                )
                else "experienced"
            )
            add(
                f"[CONTEXT] Type: professional_employment | Domain: {exp_domain} | Seniority: {seniority} [CONTENT] {exp_text}"
            )

        for education in cand_profile.educations:
            edu_domain = self._detect_subdomain(education.major or "")
            add(
                f"[CONTEXT] Type: academic | Domain: {edu_domain} | Seniority: intern [CONTENT] {education.major}"
            )

        for project in cand_profile.projects:
            proj_text = f"{project.project_name} {project.description or ''} {' '.join(project.technologies)}"
            proj_domain = self._detect_subdomain(proj_text)
            add(
                f"[CONTEXT] Type: project | Domain: {proj_domain} | Seniority: experienced [CONTENT] {proj_text}"
            )

        for certificate in job.required_certificates:
            add(certificate.certificate_name)
        for certificate in cand_profile.certificates:
            add(certificate.certificate_name)

        return texts

    def _is_entry_level(self, job: JobPayload) -> bool:
        if not job:
            return False
        exp_lvl = (job.experience_level or "").lower()
        emp_type = (job.employment_type or "").lower()
        j_title = (job.title or "").lower()
        return any(
            kw in (exp_lvl or j_title)
            for kw in ["intern", "fresher", "tập sự", "thực tập"]
        ) or any(kw in emp_type for kw in ["internship"])

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
            return {
                "score": 1.0,
                "matched": [],
                "missing": [],
                "missing_mandatory": [],
                "conditional_mandatory": [],
                "evidence": [],
                "mandatory_ratio": 1.0,
            }

        job_subdom = job_subdom or self._detect_subdomain(
            f"{job.title} {job.description or ''} {job.requirements or ''}"
        )
        cand_skill_id_map = {
            str(cs.skill_id): cs for cs in cand_profile.skills if cs.skill_id
        }
        cand_skill_map = {self._skill_match_key(cs): cs for cs in cand_profile.skills}
        cand_norm_names = set(cand_skill_map.keys())

        # Ngưỡng động (Đồng nghĩa thực sự vs Chuyển giao)
        mandatory_threshold = 0.78
        transferable_threshold = 0.60

        mandatory_scores = []
        optional_scores = []
        mandatory_credits = []
        matched = []
        missing = []
        missing_mandatory = []
        conditional_mandatory = []
        evidence_list = []

        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode or 'Professional'}"

        for req in job_req_skills:
            norm_req_name = self._skill_match_key(req)
            is_man = req.is_mandatory
            req_min_years = float(getattr(req, "minimum_years", 0.0) or 0.0)
            cand_skill_years = self._calculate_skill_years(req.skill_name, cand_profile)

            # 1. Khớp chính xác danh sách kỹ năng
            cand_s = cand_skill_id_map.get(str(req.skill_id)) if req.skill_id else None
            if cand_s is None:
                cand_s = cand_skill_map.get(norm_req_name)

            if cand_s is not None:
                level_mult = min(
                    1.0,
                    self._get_level_val(cand_s.proficiency_level)
                    / float(self._get_level_val(req.minimum_level)),
                )
                score = 1.0 * level_mult

                # Check skill experience years requirement
                years_gap_info = None
                if req_min_years > 0:
                    if cand_skill_years < req_min_years:
                        ratio = cand_skill_years / req_min_years
                        if ratio < 0.25:
                            penalty_mult = 0.35 + 0.35 * max(0.0, ratio * 2.0)
                        else:
                            penalty_mult = 0.65 + 0.35 * max(0.2, min(1.0, ratio))
                        score *= penalty_mult
                        years_gap_info = {
                            "req_years": req_min_years,
                            "actual_years": cand_skill_years,
                            "ratio": round(ratio, 2),
                            "penalty_msg": f"Kỹ năng '{req.skill_name}': Thâm niên thực tế ({cand_skill_years:.1f} năm) chưa đủ số năm yêu cầu của JD ({req_min_years:.1f} năm). Đã trừ điểm thâm niên kỹ năng tương ứng.",
                        }
                    else:
                        years_gap_info = {
                            "req_years": req_min_years,
                            "actual_years": cand_skill_years,
                            "bonus_msg": f"Kỹ năng '{req.skill_name}': Thâm niên thực tế ({cand_skill_years:.1f} năm) đáp ứng đủ yêu cầu ({req_min_years:.1f} năm).",
                        }

                matched.append(
                    {
                        "name": req.skill_name,
                        "isMandatory": is_man,
                        "source": "skills_list",
                        "actual_years": cand_skill_years,
                        "req_years": req_min_years,
                        "years_gap": years_gap_info,
                    }
                )
                if is_man:
                    mandatory_scores.append(score)
                    if req_min_years > 0 and cand_skill_years < req_min_years * 0.3:
                        mand_credit = max(0.2, (cand_skill_years / req_min_years))
                        mandatory_credits.append(mand_credit)
                        missing_mandatory.append(req.skill_name)
                    else:
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
                raw_sem = semantic_matcher.compute_similarity(
                    req.skill_name.strip(), cs.skill_name.strip()
                )
                gated_sem = raw_sem * (0.35 + 0.65 * domain_compat)
                if raw_sem >= 0.80 and domain_compat >= 0.5:
                    gated_sem = max(gated_sem, raw_sem * 0.95)
                if gated_sem >= mandatory_threshold and gated_sem > best_sem_score:
                    best_sem_score = gated_sem
                    best_cs_match = cs

            if best_sem_score >= mandatory_threshold and best_cs_match:
                level_multiplier = min(
                    1.0,
                    self._get_level_val(best_cs_match.proficiency_level)
                    / float(self._get_level_val(req.minimum_level)),
                )
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
                            "penalty_msg": f"Kỹ năng '{req.skill_name}': Thâm niên thực tế ({cand_skill_years:.1f} năm) chưa đủ số năm yêu cầu của JD ({req_min_years:.1f} năm). Đã trừ điểm thâm niên kỹ năng tương ứng.",
                        }

                matched.append(
                    {
                        "name": req.skill_name,
                        "isMandatory": is_man,
                        "source": f"Kỹ năng tương đương: {best_cs_match.skill_name}",
                        "actual_years": cand_skill_years,
                        "req_years": req_min_years,
                        "years_gap": years_gap_info,
                    }
                )
                evidence_list.append(
                    {
                        "skillName": req.skill_name,
                        "evidenceText": f"AI nhận diện kỹ năng '{best_cs_match.skill_name}' tương đương '{req.skill_name}' (Độ khớp: {best_sem_score * 100:.1f}%)",
                        "source": "semantic_embedding",
                    }
                )
                if is_man:
                    mandatory_scores.append(final_skill_score)
                    mandatory_credits.append(1.0)
                else:
                    optional_scores.append(final_skill_score)
                ai_matched = True
            else:
                # Kiểm tra năng lực chuyển giao có hướng (Directed Transferable Skills & Experience Inheritance)
                best_trans = transferable_skills_engine.evaluate_best_candidate_skill(
                    target_skill=req.skill_name,
                    target_min_years=req_min_years,
                    target_min_level=req.minimum_level,
                    candidate_skills=cand_profile.skills,
                    get_level_val_fn=self._get_level_val,
                    calc_skill_years_fn=self._calculate_skill_years,
                    cand_profile=cand_profile,
                    domain_context=job_subdom,
                )
                if best_trans is not None and best_trans.is_transferable:
                    matching_cs = next(
                        (cs for cs in cand_profile.skills if cs.skill_name == best_trans.source_skill),
                        None,
                    )
                    cs_level = matching_cs.proficiency_level if matching_cs else "BEGINNER"
                    level_multiplier = min(
                        1.0,
                        self._get_level_val(cs_level)
                        / float(self._get_level_val(req.minimum_level)),
                    )
                    final_skill_score = best_trans.credit * level_multiplier

                    # Experience inheritance & years gap evaluation
                    years_gap_info = None
                    if req_min_years > 0:
                        if best_trans.transferred_years < req_min_years:
                            ratio = (
                                best_trans.transferred_years / req_min_years
                                if req_min_years > 0
                                else 1.0
                            )
                            if ratio < 0.25:
                                penalty_mult = 0.35 + 0.35 * max(0.0, ratio * 2.0)
                            else:
                                penalty_mult = 0.65 + 0.35 * max(0.2, min(1.0, ratio))
                            final_skill_score *= penalty_mult
                            years_gap_info = {
                                "req_years": req_min_years,
                                "actual_years": best_trans.transferred_years,
                                "source_years": best_trans.source_years,
                                "ratio": round(ratio, 2),
                                "penalty_msg": (
                                    f"Kỹ năng chuyển giao '{req.skill_name}': Thâm niên kế thừa từ '{best_trans.source_skill}' "
                                    f"({best_trans.transferred_years:.1f} năm) chưa đủ yêu cầu của JD ({req_min_years:.1f} năm). "
                                    f"Đã trừ điểm thâm niên kỹ năng tương ứng."
                                ),
                            }
                        else:
                            years_gap_info = {
                                "req_years": req_min_years,
                                "actual_years": best_trans.transferred_years,
                                "source_years": best_trans.source_years,
                                "bonus_msg": (
                                    f"Kỹ năng chuyển giao '{req.skill_name}': Thâm niên kế thừa từ '{best_trans.source_skill}' "
                                    f"({best_trans.transferred_years:.1f} năm) đáp ứng tốt yêu cầu ({req_min_years:.1f} năm)."
                                ),
                            }

                    matched.append(
                        {
                            "name": req.skill_name,
                            "isMandatory": is_man,
                            "source": f"Kỹ năng chuyển giao: {best_trans.source_skill}",
                            "source_skill": best_trans.source_skill,
                            "actual_years": best_trans.transferred_years,
                            "source_years": best_trans.source_years,
                            "req_years": req_min_years,
                            "years_gap": years_gap_info,
                            "transfer_direction": best_trans.direction.value,
                            "transfer_credit": best_trans.credit,
                            "transfer_explanation": best_trans.explanation,
                            "is_conditional_pass": best_trans.is_high_grade if is_man else False,
                        }
                    )

                    pct_credit = int(best_trans.credit * 100)
                    evidence_list.append(
                        {
                            "skillName": req.skill_name,
                            "evidenceText": (
                                f"Kỹ năng '{best_trans.source_skill}' ({best_trans.source_years:.1f} năm) "
                                f"có thể chuyển giao sang '{req.skill_name}' "
                                f"({best_trans.explanation} - Tương thích: {pct_credit}%, Kế thừa: {best_trans.transferred_years:.1f} năm thâm niên)"
                            ),
                            "source": "transferable_skill",
                            "source_skill": best_trans.source_skill,
                            "transferred_years": best_trans.transferred_years,
                            "transfer_credit": best_trans.credit,
                        }
                    )
                    if is_man:
                        mandatory_scores.append(final_skill_score)
                        mandatory_credits.append(best_trans.credit)
                        if best_trans.is_high_grade:
                            conditional_mandatory.append(req.skill_name)
                        else:
                            missing_mandatory.append(req.skill_name)
                    else:
                        optional_scores.append(final_skill_score)
                    ai_matched = True

            if ai_matched:
                continue

            # 3. Tìm kiếm trong Bối cảnh (Kinh nghiệm làm việc & Dự án thực tế)
            ctx_score, ctx_text, ctx_source = self._search_in_context(
                norm_req_name,
                req.skill_name,
                cand_profile,
                job,
                domain_compat,
                job_subdom,
            )
            if ctx_score >= mandatory_threshold:
                is_unverified = "(Cần phỏng vấn xác minh)" in ctx_source
                matched.append(
                    {
                        "name": req.skill_name,
                        "isMandatory": is_man,
                        "source": ctx_source,
                        "actual_years": cand_skill_years,
                        "req_years": req_min_years,
                        "requires_interview_verification": is_unverified,
                    }
                )
                evidence_list.append(
                    {
                        "skillName": req.skill_name,
                        "evidenceText": (
                            f"[Cần phỏng vấn xác minh] {ctx_text}"
                            if is_unverified
                            else ctx_text
                        ),
                        "source": ctx_source,
                        "requires_interview_verification": is_unverified,
                    }
                )
                if is_man:
                    mandatory_scores.append(ctx_score)
                    mandatory_credits.append(0.75 if is_unverified else 0.95)
                    if is_unverified or (req_min_years > 0 and cand_skill_years < req_min_years * 0.3):
                        missing_mandatory.append(req.skill_name)
                else:
                    optional_scores.append(ctx_score)
            elif ctx_score >= transferable_threshold:
                is_unverified = "(Cần phỏng vấn xác minh)" in ctx_source
                matched.append(
                    {
                        "name": req.skill_name,
                        "isMandatory": is_man,
                        "source": f"{ctx_source} (Chuyển giao)",
                        "actual_years": cand_skill_years,
                        "req_years": req_min_years,
                        "requires_interview_verification": is_unverified,
                    }
                )
                evidence_list.append(
                    {
                        "skillName": req.skill_name,
                        "evidenceText": (
                            f"[Cần phỏng vấn xác minh] {ctx_text}"
                            if is_unverified
                            else ctx_text
                        ),
                        "source": ctx_source,
                        "requires_interview_verification": is_unverified,
                    }
                )
                if is_man:
                    mandatory_scores.append(ctx_score * 0.85)
                    mandatory_credits.append(0.50 * ctx_score)
                    missing_mandatory.append(req.skill_name)
                else:
                    optional_scores.append(ctx_score * 0.85)
            else:
                domain_credit = self._calc_domain_transferability(
                    req.skill_name,
                    cand_norm_names,
                    is_man,
                    job,
                    domain_compat,
                    job_subdom,
                )
                if is_man:
                    mandatory_scores.append(domain_credit)
                    missing_mandatory.append(req.skill_name)
                    mandatory_credits.append(0.20 * domain_credit)
                else:
                    optional_scores.append(max(0.0, domain_credit))
                missing.append(
                    {
                        "name": req.skill_name,
                        "isMandatory": is_man,
                        "transfer_credit": domain_credit,
                        "req_years": req_min_years,
                    }
                )

        if mandatory_scores and optional_scores:
            raw_score = 0.75 * (
                sum(mandatory_scores) / len(mandatory_scores)
            ) + 0.25 * (sum(optional_scores) / len(optional_scores))
        elif mandatory_scores:
            raw_score = sum(mandatory_scores) / len(mandatory_scores)
        elif optional_scores:
            raw_score = sum(optional_scores) / len(optional_scores)
        else:
            raw_score = 1.0

        p_density = 1.0
        if cand_profile.skills:
            p_density = min(
                1.0, (len(cand_norm_names) / float(len(cand_profile.skills))) * 1.2
            )

        total_man = sum(1 for r in job_req_skills if r.is_mandatory)
        man_ratio = (
            (sum(mandatory_credits) / float(total_man)) if total_man > 0 else 1.0
        )
        man_ratio = max(0.0, min(1.0, man_ratio))

        return {
            "score": raw_score * p_density,
            "matched": matched,
            "missing": missing,
            "missing_mandatory": missing_mandatory,
            "conditional_mandatory": conditional_mandatory,
            "mandatory_ratio": man_ratio,
            "evidence": evidence_list,
            "p_density": p_density,
        }

    def _get_level_val(self, lvl: str) -> int:
        return {"BEGINNER": 1, "INTERMEDIATE": 2, "ADVANCED": 3, "EXPERT": 4}.get(
            (lvl or "BEGINNER").upper(), 1
        )

    def _is_transferable_skill(self, skill_a: str, skill_b: str) -> Tuple[bool, float]:
        """
        Determines whether candidate skill_b can transfer to target skill_a
        and returns (is_transferable, credit_score).
        """
        is_trans, credit, _, _ = transferable_skills_engine.check_transferable(skill_a, skill_b)
        return is_trans, credit

    def _calculate_skill_years(
        self, skill_name: str, cand_profile: CandidateProfilePayload
    ) -> float:
        """Calculates cumulative years candidate has explicitly worked with this specific technology or skill."""
        s_clean = skill_name.lower().strip()
        total_months = 0.0

        # Strict explicit technology aliases mapping & related skill families
        strict_tech_aliases: Dict[str, List[str]] = {
            "react": ["react", "reactjs", "react.js", "react-native"],
            "next.js": ["next.js", "nextjs", "next js"],
            "node.js": [
                "node.js",
                "nodejs",
                "node js",
                "express",
                "expressjs",
                "nestjs",
            ],
            "postgresql": ["postgresql", "postgres", "psql"],
            "typescript": ["typescript", "ts"],
            "tailwind css": ["tailwind", "tailwindcss", "tailwind css"],
            "docker": ["docker", "dockerfile", "docker-compose", "containerization"],
            "java": ["java", "spring", "spring boot", "springboot", "hibernate", "jvm"],
            "spring boot": ["spring boot", "springboot", "spring", "java"],
            "python": ["python", "django", "fastapi", "flask", "pandas", "numpy"],
            "performance marketing": [
                "performance marketing",
                "google ads",
                "meta ads",
                "facebook ads",
                "tiktok ads",
                "paid ads",
                "sem",
                "ppc",
                "growth marketing",
            ],
            "google ads": ["google ads", "adwords", "performance marketing", "sem", "ppc"],
            "meta ads": ["meta ads", "facebook ads", "fb ads", "performance marketing"],
            "ui/ux": ["ui/ux", "ui/ux design", "ui design", "ux design", "figma", "user experience"],
            "figma": ["figma", "ui/ux", "ui design", "ux design"],
            "data analytics": ["data analytics", "data analysis", "power bi", "tableau", "sql"],
            "front office": ["front office", "lễ tân", "front desk", "tiền sảnh", "guest service", "guest experience"],
            "guest relations": ["guest relations", "quan hệ khách hàng", "chăm sóc khách hàng", "guest experience", "customer service"],
            "opera pms": ["opera pms", "opera", "pms", "property management system"],
            "customer service": ["customer service", "chăm sóc khách hàng", "cskh", "dịch vụ khách hàng"],
            "reservation systems": ["reservation systems", "hệ thống đặt phòng", "booking system", "opera pms", "reservation"],
        }
        target_aliases = list(strict_tech_aliases.get(s_clean, [s_clean]))

        # Expand target aliases if skill contains composite parts (e.g. Vietnamese (English) or A & B)
        if "(" in s_clean:
            parts = [p.strip().rstrip(")") for p in s_clean.split("(") if p.strip()]
            for p in parts:
                if p not in target_aliases:
                    target_aliases.append(p)
                for sub in re.split(r"&|/|,", p):
                    sub_strip = sub.strip()
                    if len(sub_strip) > 3 and sub_strip not in target_aliases:
                        target_aliases.append(sub_strip)
        elif "&" in s_clean or "/" in s_clean:
            for sub in re.split(r"&|/|,", s_clean):
                sub_strip = sub.strip()
                if len(sub_strip) > 3 and sub_strip not in target_aliases:
                    target_aliases.append(sub_strip)

        def contains_alias(text: str) -> bool:
            if not text:
                return False
            text_lower = text.lower()
            return any(
                re.search(rf"\b{re.escape(alias)}\b", text_lower)
                for alias in target_aliases
            )

        intervals: List[Tuple[datetime, datetime]] = []

        # Also check candidate header / professional summary
        prof = getattr(cand_profile, "profile", None)
        prof_header = f"{getattr(prof, 'professional_summary', '') or ''} {getattr(prof, 'desired_title', '') or ''}".lower()
        has_in_header = contains_alias(prof_header)

        for exp in getattr(cand_profile, "work_experiences", []) or []:
            exp_text = f"{exp.position_title or ''} {exp.description or ''} {exp.achievements or ''}"
            if contains_alias(exp_text) or (has_in_header and len(getattr(cand_profile, "work_experiences", [])) == 1):
                start_d = getattr(exp, "start_date", None)
                end_d = getattr(exp, "end_date", None)
                if start_d:
                    try:
                        dt_start = datetime.fromisoformat(
                            str(start_d).replace("Z", "+00:00")
                        )
                        if getattr(exp, "is_current", False) or not end_d:
                            dt_end = datetime.now(timezone.utc)
                        else:
                            dt_end = datetime.fromisoformat(
                                str(end_d).replace("Z", "+00:00")
                            )
                        if dt_start <= dt_end:
                            intervals.append((dt_start, dt_end))
                    except Exception:
                        pass

        for proj in getattr(cand_profile, "projects", []) or []:
            proj_techs = [
                t.lower().strip() for t in (getattr(proj, "technologies", []) or [])
            ]
            proj_text = f"{proj.project_name or ''} {proj.description or ''}"
            has_in_techs = any(
                any(
                    re.search(rf"\b{re.escape(alias)}\b", t) for alias in target_aliases
                )
                for t in proj_techs
            )
            if has_in_techs or contains_alias(proj_text):
                if getattr(proj, "start_date", None) and getattr(
                    proj, "end_date", None
                ):
                    try:
                        dt_start = datetime.fromisoformat(
                            str(proj.start_date).replace("Z", "+00:00")
                        )
                        dt_end = datetime.fromisoformat(
                            str(proj.end_date).replace("Z", "+00:00")
                        )
                        if dt_start <= dt_end:
                            intervals.append((dt_start, dt_end))
                    except Exception:
                        pass
                else:
                    if not intervals:
                        total_months += 3.0

        if intervals:
            intervals.sort(key=lambda x: x[0])
            merged = []
            for s, e in intervals:
                if not merged:
                    merged.append((s, e))
                else:
                    ls, le = merged[-1]
                    if s <= le:
                        merged[-1] = (ls, max(le, e))
                    else:
                        merged.append((s, e))
            total_days = sum((e - s).days for s, e in merged)
            total_months += max(1.0, total_days / 30.44)

        # If total_months is 0 but candidate explicitly listed skill in profile.skills:
        if total_months == 0:
            for cs in getattr(cand_profile, "skills", []) or []:
                cs_name = cs.skill_name.lower().strip()
                if any(
                    alias == cs_name or alias in cs_name or cs_name in alias
                    for alias in target_aliases
                ):
                    work_exps = getattr(cand_profile, "work_experiences", None) or []
                    if work_exps:
                        # Candidate explicitly possesses skill and has verified career history
                        # Calculate cumulative tenure across relevant positions
                        tot_exp_days = 0
                        for exp in work_exps:
                            start_d = getattr(exp, "start_date", None)
                            end_d = getattr(exp, "end_date", None)
                            if start_d:
                                try:
                                    dt_s = datetime.fromisoformat(str(start_d).replace("Z", "+00:00"))
                                    dt_e = datetime.now(timezone.utc) if (getattr(exp, "is_current", False) or not end_d) else datetime.fromisoformat(str(end_d).replace("Z", "+00:00"))
                                    if dt_s <= dt_e:
                                        tot_exp_days += (dt_e - dt_s).days
                                except Exception:
                                    pass
                        if tot_exp_days > 0:
                            total_months = max(18.0, (tot_exp_days / 30.44) * 0.75)
                        else:
                            total_months = 12.0
                    else:
                        lvl = (
                            getattr(cs, "proficiency_level", None) or "BEGINNER"
                        ).upper()
                        if lvl == "EXPERT":
                            total_months = 24.0
                        elif lvl == "ADVANCED":
                            total_months = 18.0
                        elif lvl == "INTERMEDIATE":
                            total_months = 12.0
                        else:
                            total_months = 6.0
                    break

        return round(total_months / 12.0, 1)

    def _skill_match_key(self, skill) -> str:
        """Return a stable key while preserving V3 matching semantics."""
        canonical_name = getattr(skill, "normalized_name", None)
        if canonical_name and canonical_name.strip():
            return canonical_name.strip().casefold()
        return normalize_skill_name(skill.skill_name).strip().casefold()

    def _calc_domain_transferability(
        self,
        target_skill: str,
        cand_skills: set,
        is_man: bool,
        job: JobPayload = None,
        domain_compat: float = 1.0,
        job_subdom: str = "GENERAL",
    ) -> float:
        if not is_man or not cand_skills:
            return 0.0
        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode if job else 'Professional'}"
        target_skill_v2 = f"{job_context} [CONTENT] {target_skill}"

        sim_scores = []
        for cs in cand_skills:
            cs_domain = self._detect_subdomain(cs)
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: {cs_domain} | Seniority: experienced"
            sim_scores.append(
                semantic_matcher.compute_similarity(
                    target_skill_v2, f"{cand_context_pro} [CONTENT] {cs}"
                )
                * (0.2 + 0.8 * domain_compat)
            )

        best_sim = max(sim_scores + [0.0])
        is_entry_level = self._is_entry_level(job)
        threshold = 0.70 if is_entry_level else 0.78
        if is_man and best_sim < threshold:
            return 0.0
        return best_sim

    def _search_in_context(
        self,
        norm_req,
        req_name,
        profile,
        job: JobPayload = None,
        domain_compat: float = 1.0,
        job_subdom: str = "GENERAL",
    ):
        best_score, best_text, best_source = 0.0, "", ""
        is_explicit = False
        job_context = f"[CONTEXT] Domain: {job_subdom} | Environment: {job.work_mode if job else 'Professional'}"
        req_name_v2 = f"{job_context} [CONTENT] {req_name}"

        multiplier = 0.2 + 0.8 * domain_compat
        target_aliases = [norm_req, req_name] if norm_req else [req_name]
        alias_clean = [a.lower().strip() for a in target_aliases if a]

        for exp in profile.work_experiences:
            exp_text = f"{exp.position_title or ''} {exp.description or ''} {exp.achievements or ''}"
            exp_text_lower = exp_text.lower()
            exp_domain = self._detect_subdomain(exp_text)
            seniority = (
                "senior"
                if any(
                    k in (exp.position_title or "").lower()
                    for k in ["senior", "trưởng", "manager", "lead", "head"]
                )
                else "experienced"
            )
            cand_context_pro = f"[CONTEXT] Type: professional_employment | Domain: {exp_domain} | Seniority: {seniority}"
            text_v2 = f"{cand_context_pro} [CONTENT] {exp_text}"

            has_direct_kw = any(
                re.search(rf"\b{re.escape(a)}\b", exp_text_lower) for a in alias_clean
            )
            if has_direct_kw:
                # Detect if the context mention is passive / observation / receipt from third-party
                is_passive = any(
                    re.search(p, exp_text_lower)
                    for p in [
                        r"\b(?:xem|đọc|nhận|theo dõi|review|view|monitor)\b(?:(?!\b(?:trực tiếp|triển khai)\b).){0,35}?\b(?:báo cáo|kết quả|report|reports|dashboard|traffic|số liệu)\b",
                        r"\b(?:báo cáo|report|reports|dashboard)\b(?:(?!\b(?:trực tiếp)\b).){0,25}?\b(?:do|từ|from)\b",
                        r"\b(?:agency|đội ngũ|team|đối tác|bên thứ ba)\b(?:(?!\b(?:trực tiếp)\b).){0,25}?\b(?:gửi|cung cấp|thực hiện|triển khai|sent)\b",
                        r"\b(?:hỗ trợ|tham khảo|quan sát)\b",
                    ]
                )
                if is_passive:
                    score_val = 0.72 * multiplier
                    source_desc = f"Ngữ cảnh gián tiếp: {exp.position_title} (Cần phỏng vấn xác minh)"
                else:
                    score_val = 0.95 * multiplier
                    source_desc = f"Kinh nghiệm: {exp.position_title}"

                if score_val > best_score:
                    best_score, best_text, best_source = (
                        score_val,
                        exp_text,
                        source_desc,
                    )
                    is_explicit = True
            elif not is_explicit and domain_compat >= 0.40:
                sim = (
                    semantic_matcher.compute_similarity(req_name_v2, text_v2)
                    * multiplier
                )
                # Rich context evidence with semantic similarity
                sim = min(0.90, sim * 0.92)
                if sim > best_score:
                    best_score, best_text, best_source = (
                        sim,
                        exp_text,
                        f"Suy luận ngữ cảnh: {exp.position_title} (Cần phỏng vấn xác minh)",
                    )

        for proj in profile.projects:
            proj_text = f"{proj.project_name or ''} {proj.description or ''} {' '.join(proj.technologies or [])}"
            proj_text_lower = proj_text.lower()
            proj_domain = self._detect_subdomain(proj_text)
            cand_context_proj = f"[CONTEXT] Type: project | Domain: {proj_domain} | Seniority: experienced"
            text_v2 = f"{cand_context_proj} [CONTENT] {proj_text}"

            has_direct_kw = any(
                re.search(rf"\b{re.escape(a)}\b", proj_text_lower) for a in alias_clean
            )
            if has_direct_kw:
                is_passive = any(
                    re.search(p, proj_text_lower)
                    for p in [
                        r"\b(?:xem|đọc|nhận|theo dõi|review|view|monitor)\b(?:(?!\b(?:trực tiếp|triển khai)\b).){0,35}?\b(?:báo cáo|kết quả|report|reports|dashboard|traffic|số liệu)\b",
                        r"\b(?:báo cáo|report|reports|dashboard)\b(?:(?!\b(?:trực tiếp)\b).){0,25}?\b(?:do|từ|from)\b",
                        r"\b(?:agency|đội ngũ|team|đối tác|bên thứ ba)\b(?:(?!\b(?:trực tiếp)\b).){0,25}?\b(?:gửi|cung cấp|thực hiện|triển khai|sent)\b",
                        r"\b(?:hỗ trợ|tham khảo|quan sát)\b",
                    ]
                )
                if is_passive:
                    score_val = 0.72 * multiplier
                    source_desc = f"Dự án gián tiếp: {proj.project_name} (Cần phỏng vấn xác minh)"
                else:
                    score_val = 0.95 * multiplier
                    source_desc = f"Dự án: {proj.project_name}"

                if score_val > best_score:
                    best_score, best_text, best_source = (
                        score_val,
                        proj_text,
                        source_desc,
                    )
                    is_explicit = True
            elif not is_explicit and domain_compat >= 0.40:
                sim = (
                    semantic_matcher.compute_similarity(req_name_v2, text_v2)
                    * multiplier
                )
                sim = min(0.85, sim * 0.88)
                if sim > best_score:
                    best_score, best_text, best_source = (
                        sim,
                        proj_text,
                        f"Suy luận từ dự án: {proj.project_name} (Cần phỏng vấn xác minh)",
                    )

        is_entry_level = self._is_entry_level(job)
        if "Dự án" in best_source and not is_entry_level:
            best_score *= 0.85

        return best_score, best_text, best_source

    def _match_experience(
        self,
        cand_profile: CandidateProfilePayload,
        job: JobPayload,
        domain_compat: float,
    ) -> Dict[str, Any]:
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

        # Check management/leadership requirements if job level is MANAGER/LEAD/DIRECTOR
        req_level = (job.experience_level or "").upper()
        if req_level in {"MANAGER", "LEAD", "DIRECTOR"} and req_years > 0.0:
            mgmt_years = experience_level_evaluator.calculate_management_years(
                cand_profile.work_experiences, job.evaluation_date
            )
            total_duration_ratio = (total_years / req_years) if req_years > 0.0 else 1.0
            mgmt_duration_ratio = (mgmt_years / req_years) if req_years > 0.0 else 1.0

            if mgmt_duration_ratio < 0.2:
                # Almost zero management tenure for a Management role
                duration_score = 0.15
            elif mgmt_duration_ratio < 0.5:
                # Partial management tenure (e.g. 2 years vs 5 years required)
                duration_score = 0.45 * mgmt_duration_ratio + 0.25 * min(
                    1.0, total_duration_ratio
                )
            else:
                duration_score = 0.6 * min(1.0, mgmt_duration_ratio) + 0.4 * min(
                    1.0, total_duration_ratio
                )
            duration_score = max(0.1, min(1.0, duration_score))
        else:
            # EPSILON_YEARS = 0.05 (~18 days tolerance for leap-year and calendar term calculations)
            EPSILON_YEARS = 0.05
            if req_years > 0.0 and (req_years - total_years) <= EPSILON_YEARS:
                duration_score = 1.0
            else:
                duration_ratio = (total_years / req_years) if req_years > 0.0 else 1.0
                if duration_ratio < 0.6:
                    duration_score = max(0.1, (duration_ratio**1.3))
                else:
                    duration_score = min(1.0, duration_ratio)

        candidate_titles = [
            exp.position_title
            for exp in cand_profile.work_experiences
            if exp.position_title
        ]
        j_title_lower = job.title.lower()
        is_job_intern = "intern" in j_title_lower

        best_rel = 0.0
        for c_title in candidate_titles:
            c_title_lower = c_title.lower()
            rel = (
                1.0
                if (c_title_lower in j_title_lower or j_title_lower in c_title_lower)
                else semantic_matcher.compute_similarity(job.title, c_title)
            )
            if "intern" in c_title_lower and not is_job_intern:
                rel *= 0.55
            best_rel = max(best_rel, rel)

        relevance_score = 0.6 * best_rel + 0.4 * (0.3 + 0.7 * domain_compat)
        exp_score = (
            0.5 * duration_score + 0.5 * relevance_score
            if cand_profile.work_experiences
            else 0.0
        )

        project_metrics = self._eval_projects(cand_profile, job)
        project_score = project_metrics["score"]

        if cand_profile.work_experiences and cand_profile.projects:
            if total_years >= 2.0 or (req_years > 0 and total_years >= (req_years - 0.05)):
                final_score = 0.85 * exp_score + 0.15 * project_score
            else:
                final_score = 0.70 * exp_score + 0.30 * project_score
        elif cand_profile.work_experiences:
            final_score = exp_score
        elif cand_profile.projects:
            final_score = project_score * 0.85
        else:
            final_score = 0.0

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
        if not experiences:
            return 0.0
        now = datetime.now()
        intervals = []
        for exp in experiences:
            try:
                start = (
                    datetime.strptime(str(exp.start_date).split("T")[0], "%Y-%m-%d")
                    if exp.start_date
                    else now
                )
            except:
                start = now
            try:
                end = (
                    datetime.strptime(str(exp.end_date).split("T")[0], "%Y-%m-%d")
                    if exp.end_date and not exp.is_current
                    else now
                )
            except:
                end = now
            if start > end:
                start, end = end, start
            intervals.append((start, end))
        intervals.sort(key=lambda x: x[0])
        merged = []
        for s, e in intervals:
            if not merged:
                merged.append((s, e))
            else:
                ls, le = merged[-1]
                if s <= le:
                    merged[-1] = (ls, max(le, e))
                else:
                    merged.append((s, e))
        return sum((e - s).days for s, e in merged) / 365.25

    DEGREE_HIERARCHY: Dict[str, int] = {
        "doctorate": 5,
        "tiến sĩ": 5,
        "tiến sỹ": 5,
        "phd": 5,
        "dr": 5,
        "master": 4,
        "thạc sĩ": 4,
        "thạc sỹ": 4,
        "cao học": 4,
        "mba": 4,
        "bachelor": 3,
        "cử nhân": 3,
        "đại học": 3,
        "kỹ sư": 3,
        "engineer": 3,
        "associate": 2,
        "cao đẳng": 2,
        "trung cấp": 2,
        "vocational": 2,
        "high school": 1,
        "cấp 3": 1,
        "thpt": 1,
        "trung học phổ thông": 1,
    }

    ACADEMIC_DISCIPLINES: Dict[str, Dict[str, Any]] = {
        "MARKETING_COMMUNICATION": {
            "name": "Marketing & Truyền thông & Quản trị Kinh doanh",
            "keywords": [
                "marketing",
                "truyền thông",
                "quản trị kinh doanh",
                "thương mại điện tử",
                "kinh doanh quốc tế",
                "pr",
                "quan hệ công chúng",
                "digital marketing",
                "quảng cáo",
                "kinh tế",
                "báo chí",
                "truyền thông đa phương tiện",
                "thương mại",
                "quản trị thương mại",
                "e-commerce",
                "business administration",
                "advertising",
                "mass communication",
                "media studies",
            ],
        },
        "SALES_COMMERCE": {
            "name": "Kinh doanh & Bán hàng & Thương mại",
            "keywords": [
                "quản trị kinh doanh",
                "kinh doanh",
                "bán hàng",
                "thương mại",
                "thương mại quốc tế",
                "kinh tế quốc tế",
                "phát triển thị trường",
                "kinh tế",
                "sales",
                "commerce",
                "business development",
                "international trade",
                "commercial",
            ],
        },
        "ACCOUNTING_FINANCE": {
            "name": "Tài chính & Kế toán & Kiểm toán",
            "keywords": [
                "kế toán",
                "kiểm toán",
                "tài chính",
                "ngân hàng",
                "thuế",
                "tài chính doanh nghiệp",
                "kế toán doanh nghiệp",
                "đầu tư tài chính",
                "kế toán tài chính",
                "accounting",
                "finance",
                "audit",
                "banking",
                "taxation",
                "corporate finance",
                "accountancy",
            ],
        },
        "IT_COMPUTER_SCIENCE": {
            "name": "Công nghệ thông tin & Khoa học máy tính",
            "keywords": [
                "công nghệ thông tin",
                "khoa học máy tính",
                "kỹ thuật phần mềm",
                "hệ thống thông tin",
                "an toàn thông tin",
                "khoa học dữ liệu",
                "cntt",
                "mạng máy tính",
                "trí tuệ nhân tạo",
                "tin học",
                "computer science",
                "software engineering",
                "information technology",
                "information systems",
                "cybersecurity",
                "artificial intelligence",
                "computer engineering",
            ],
        },
        "DATA_ANALYTICS": {
            "name": "Khoa học Dữ liệu & Phân tích & Toán tin",
            "keywords": [
                "khoa học dữ liệu",
                "phân tích dữ liệu",
                "toán tin",
                "toán ứng dụng",
                "thống kê",
                "kinh tế lượng",
                "hệ thống thông tin quản lý",
                "data science",
                "data analytics",
                "statistics",
                "applied mathematics",
                "econometrics",
                "business analytics",
                "mis",
            ],
        },
        "ENGINEERING_TECHNICAL": {
            "name": "Kỹ thuật & Công nghệ kỹ thuật",
            "keywords": [
                "kỹ thuật",
                "cơ khí",
                "điện",
                "điện tử",
                "viễn thông",
                "tự động hóa",
                "xây dựng",
                "kiến trúc",
                "hóa học",
                "môi trường",
                "chế tạo máy",
                "công nghệ sinh học",
                "cơ điện tử",
                "engineering",
                "mechanical",
                "mechanical engineering",
                "electrical",
                "electronics",
                "telecommunications",
                "automation",
                "mechatronics",
                "civil engineering",
                "chemical engineering",
                "industrial engineering",
            ],
        },
        "DESIGN_CREATIVE": {
            "name": "Thiết kế & Đồ họa & Mỹ thuật",
            "keywords": [
                "thiết kế",
                "đồ họa",
                "mỹ thuật",
                "tạo dáng công nghiệp",
                "đa phương tiện",
                "thiết kế đồ họa",
                "thiết kế nội thất",
                "thiết kế thời trang",
                "mỹ thuật ứng dụng",
                "truyền thông thị giác",
                "design",
                "graphic design",
                "fine arts",
                "industrial design",
                "multimedia design",
                "visual arts",
                "ui/ux",
                "animation",
                "visual communication",
            ],
        },
        "LOGISTICS_SUPPLY_CHAIN": {
            "name": "Logistics & Quản lý Chuỗi cung ứng",
            "keywords": [
                "logistics",
                "chuỗi cung ứng",
                "quản lý chuỗi cung ứng",
                "kinh doanh quốc tế",
                "ngoại thương",
                "xuất nhập khẩu",
                "vận tải",
                "kinh tế vận tải",
                "hàng hải",
                "supply chain",
                "international trade",
                "international business",
                "freight",
                "maritime",
                "transportation",
            ],
        },
        "HUMAN_RESOURCES": {
            "name": "Quản trị Nhân sự & Nhân lực",
            "keywords": [
                "quản trị nhân sự",
                "nhân sự",
                "quản lý nguồn nhân lực",
                "tâm lý học",
                "lao động xã hội",
                "kinh tế lao động",
                "human resources",
                "hr",
                "human resource management",
                "personnel management",
                "organizational psychology",
            ],
        },
        "HOSPITALITY_TOURISM": {
            "name": "Quản trị Khách sạn & Du lịch",
            "keywords": [
                "quản trị khách sạn",
                "quản trị du lịch",
                "khách sạn",
                "du lịch",
                "nhà hàng",
                "lữ hành",
                "dịch vụ du lịch",
                "khách sạn du lịch",
                "hotel management",
                "tourism",
                "hospitality",
                "hospitality management",
                "restaurant management",
                "hotel administration",
            ],
        },
        "HEALTHCARE_MEDICINE": {
            "name": "Y tế & Dược & Sức khỏe",
            "keywords": [
                "y khoa",
                "y đa khoa",
                "dược",
                "dược học",
                "điều dưỡng",
                "y tế công cộng",
                "nha khoa",
                "răng hàm mặt",
                "y sinh",
                "medicine",
                "pharmacy",
                "nursing",
                "public health",
                "dentistry",
                "biomedical",
            ],
        },
        "LAW_LEGAL": {
            "name": "Luật & Pháp lý",
            "keywords": [
                "luật",
                "luật kinh tế",
                "luật quốc tế",
                "luật dân sự",
                "pháp lý",
                "law",
                "legal",
                "economic law",
                "international law",
                "jurisprudence",
            ],
        },
        "HUMANITIES_SOCIAL": {
            "name": "Khoa học Xã hội & Nhân văn & Ngôn ngữ",
            "keywords": [
                "ngôn ngữ anh",
                "ngôn ngữ trung",
                "ngôn ngữ nhật",
                "ngôn ngữ hàn",
                "phiên dịch",
                "sư phạm",
                "triết học",
                "lịch sử",
                "văn học",
                "xã hội học",
                "ngôn ngữ học",
                "giáo dục học",
                "pedagogy",
                "philosophy",
                "history",
                "literature",
                "linguistics",
                "sociology",
                "foreign languages",
                "dialectical philosophy",
            ],
        },
    }

    DISCIPLINE_COMPATIBILITY: Dict[str, Set[str]] = {
        "IT_COMPUTER_SCIENCE": {"IT_COMPUTER_SCIENCE", "DATA_ANALYTICS", "ENGINEERING_TECHNICAL"},
        "DATA_ANALYTICS": {"DATA_ANALYTICS", "IT_COMPUTER_SCIENCE"},
        "MARKETING_COMMUNICATION": {"MARKETING_COMMUNICATION", "SALES_COMMERCE", "HUMANITIES_SOCIAL"},
        "SALES_COMMERCE": {"SALES_COMMERCE", "MARKETING_COMMUNICATION", "LOGISTICS_SUPPLY_CHAIN"},
        "ACCOUNTING_FINANCE": {"ACCOUNTING_FINANCE"},
        "HUMAN_RESOURCES": {"HUMAN_RESOURCES", "HUMANITIES_SOCIAL", "MARKETING_COMMUNICATION"},
        "LOGISTICS_SUPPLY_CHAIN": {"LOGISTICS_SUPPLY_CHAIN", "SALES_COMMERCE", "ENGINEERING_TECHNICAL"},
        "DESIGN_CREATIVE": {"DESIGN_CREATIVE", "MARKETING_COMMUNICATION", "IT_COMPUTER_SCIENCE"},
        "ENGINEERING_TECHNICAL": {"ENGINEERING_TECHNICAL", "IT_COMPUTER_SCIENCE"},
        "HOSPITALITY_TOURISM": {"HOSPITALITY_TOURISM", "MARKETING_COMMUNICATION", "HUMANITIES_SOCIAL"},
        "HEALTHCARE_MEDICINE": {"HEALTHCARE_MEDICINE"},
        "LAW_LEGAL": {"LAW_LEGAL"},
        "HUMANITIES_SOCIAL": {"HUMANITIES_SOCIAL", "MARKETING_COMMUNICATION", "HUMAN_RESOURCES"},
    }

    def _parse_degree_level(self, text: str) -> int:
        if not text:
            return 0
        t = text.lower()
        for kw, lvl in self.DEGREE_HIERARCHY.items():
            if re.search(rf"\b{re.escape(kw)}\b", t):
                return lvl
        return 0

    def _extract_job_field(self, job: JobPayload) -> str:
        reqs = f"{job.requirements or ''} {job.description or ''}"
        match = re.search(
            r"(?:chuyên\s*ngành|ngành|major\s*(?:in|of)?|tốt\s*nghiệp\s*(?:đại\s*học|cao\s*đẳng|thạc\s*sĩ)?\s*(?:ngành|chuyên\s*ngành)?\s*|cử\s*nhân|bachelor|kỹ\s*sư|thạc\s*sĩ|master)\s*([A-Za-zÀ-ỹ\s]{3,30})",
            reqs,
            re.IGNORECASE,
        )
        if match:
            field = match.group(1).strip().rstrip(".,;")
            field = re.split(
                r"\b(hoặc|và|trở lên|liên quan)\b", field, flags=re.IGNORECASE
            )[0].strip()
            field = re.sub(
                r"^(?:đại\s*học|cao\s*đẳng|thạc\s*sĩ|cử\s*nhân|kỹ\s*sư|chuyên\s*ngành|ngành)\s*",
                "",
                field,
                flags=re.IGNORECASE,
            ).strip()
            if len(field) >= 3:
                return field
        return (job.title or "").strip()

    def _detect_job_disciplines(self, job: JobPayload) -> Tuple[str, List[str]]:
        """
        Extract the primary job field string and identify all matched academic disciplines.
        Prioritizes the Education requirements section and job title.
        """
        reqs = f"{job.requirements or ''}"
        m_sec = re.search(
            r"(?:education|học\s*vấn|bằng\s*cấp|trình\s*độ|degree)[\s:]*([^\n\r]+(?:\n[^\n\r]+)?)",
            reqs,
            re.IGNORECASE,
        )
        edu_text = m_sec.group(1).lower() if m_sec else ""
        target_text = f"{job.title or ''} {edu_text}".lower()

        matched_disciplines = []
        for disc_key, disc_info in self.ACADEMIC_DISCIPLINES.items():
            if any(re.search(rf"\b{re.escape(kw)}\b", target_text) for kw in disc_info["keywords"]):
                matched_disciplines.append(disc_key)

        # Fallback to full requirements if none detected in title/education line
        if not matched_disciplines:
            for disc_key, disc_info in self.ACADEMIC_DISCIPLINES.items():
                if any(re.search(rf"\b{re.escape(kw)}\b", reqs.lower()) for kw in disc_info["keywords"]):
                    matched_disciplines.append(disc_key)

        job_field = self._extract_job_field(job)
        return job_field, matched_disciplines

    def _detect_major_discipline(self, major_name: str) -> Optional[str]:
        if not major_name:
            return None
        m_lower = major_name.lower().strip()
        for disc_key, disc_info in self.ACADEMIC_DISCIPLINES.items():
            if any(re.search(rf"\b{re.escape(kw)}\b", m_lower) for kw in disc_info["keywords"]):
                return disc_key
        return None

    def _extract_job_degree_req(self, job: JobPayload) -> int:
        reqs = f"{job.requirements or ''}"
        desc = f"{job.description or ''}"
        full_text = f"{reqs} {desc}"

        # 1. Isolate the education section from requirements or full text
        edu_section = ""
        m_sec = re.search(
            r"(?:education|học\s*vấn|bằng\s*cấp|trình\s*độ|degree)[\s:]*([^\n\r]+(?:\n[^\n\r]+)?)",
            reqs,
            re.IGNORECASE,
        )
        if m_sec:
            edu_section = m_sec.group(1).lower()
        else:
            edu_section = reqs.lower()

        text_to_check = edu_section if edu_section else full_text.lower()

        # Level 5: Doctorate / PhD
        if re.search(r"\b(?:doctorate|tiến\s*sĩ|tiến\s*sỹ|ph\.?d)\b", text_to_check):
            return 5

        # Check if text specifies "Bachelor's degree or above" / "Đại học trở lên"
        # If so, minimum required degree is Level 3 (Bachelor), NOT Level 4!
        if re.search(r"\b(?:bachelor(?:'s)?(?:\s+degree)?|cử\s*nhân|đại\s*học|kỹ\s*sư)\s+(?:trở\s+lên|or\s+above)\b", text_to_check):
            return 3

        # Level 4: Master's Degree (academic noun, ignore lone verb 'master' or 'scrum master')
        if (
            re.search(r"\b(?:thạc\s*sĩ|thạc\s*sỹ|cao\s*học|mba)\b", text_to_check)
            or re.search(r"\bmaster(?:'s)?\s+(?:degree|bằng|in\b)\b", text_to_check)
            or re.search(r"\b(?:degree|bằng|qualification)[\s:]+\bmaster\b", text_to_check)
        ):
            return 4

        # Level 3: Bachelor's Degree / Đại học / Cử nhân / Kỹ sư
        if re.search(
            r"\b(?:bachelor(?:'s)?(?:\s+degree)?|cử\s*nhân|đại\s*học|kỹ\s*sư|engineer)\b",
            text_to_check,
        ):
            return 3

        # Level 2: Associate / Cao đẳng / Trung cấp
        if re.search(r"\b(?:associate(?:'s)?(?:\s+degree)?|cao\s*đẳng|trung\s*cấp|vocational)\b", text_to_check):
            return 2

        # Level 1: High School / Cấp 3 / THPT
        if re.search(r"\b(?:thpt|cấp\s*3|trung\s*học\s*phổ\s*thông|high\s*school)\b", text_to_check):
            return 1

        return 0

    def _match_education(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> Dict[str, Any]:
        educations = cand_profile.educations
        req_degree_level = self._extract_job_degree_req(job)
        job_has_edu_req = req_degree_level > 0 or any(
            k in f"{job.requirements or ''} {job.description or ''}".lower()
            for k in ["tốt nghiệp", "chuyên ngành", "bằng cấp", "đại học", "cao đẳng", "bachelor", "master", "degree", "education"]
        )

        if not educations:
            if job_has_edu_req:
                return {
                    "score": 0.0,
                    "has_degree": False,
                    "degree_level": 0,
                    "req_degree_level": req_degree_level,
                    "degree_passed": False,
                    "major_passed": False,
                    "best_major": None,
                    "best_sim": 0.0,
                    "failures": [
                        {
                            "type": "EDUCATION",
                            "requirement": (
                                f"Học vấn tối thiểu: bậc {req_degree_level}"
                                if req_degree_level > 0
                                else "Yêu cầu bằng cấp / Học vấn"
                            ),
                            "candidateValue": "Chưa có thông tin học vấn",
                            "status": "FAIL",
                            "reason": "Ứng viên chưa cung cấp thông tin học vấn.",
                        }
                    ]
                    if req_degree_level > 0
                    else [],
                }
            return {
                "score": 1.0,
                "has_degree": False,
                "degree_level": 0,
                "req_degree_level": 0,
                "degree_passed": True,
                "major_passed": True,
                "best_major": None,
                "best_sim": 0.0,
                "failures": [],
            }

        # 1. Degree Level Assessment
        cand_degree_levels = [
            self._parse_degree_level(f"{e.degree or ''} {e.description or ''}")
            for e in educations
        ]
        best_cand_degree = max(cand_degree_levels + [0])

        if req_degree_level > 0:
            if best_cand_degree >= req_degree_level:
                degree_score = 1.0
                degree_passed = True
            else:
                degree_score = max(0.0, best_cand_degree / float(req_degree_level))
                degree_passed = False
        else:
            degree_score = 1.0
            degree_passed = True

        # 2. Major Relevance Assessment (discipline taxonomy + semantic comparison)
        job_field, matched_job_disciplines = self._detect_job_disciplines(job)
        majors = [e.major for e in educations if e.major]

        best_sim = 0.0
        best_major = None
        for m in majors:
            m_lower = m.lower().strip()
            jf_lower = job_field.lower().strip()
            m_disc = self._detect_major_discipline(m)

            # 1. Direct keyword match for major vs job title/field
            if m_lower in jf_lower or jf_lower in m_lower:
                sim = 1.0
            # 2. Academic discipline match
            elif matched_job_disciplines and m_disc:
                is_compat = any(
                    m_disc == jd or m_disc in self.DISCIPLINE_COMPATIBILITY.get(jd, set())
                    for jd in matched_job_disciplines
                )
                if is_compat:
                    sim = 0.90
                else:
                    # Incompatible disciplines (e.g. Accounting vs Engineering/Philosophy)
                    sim = 0.15
            elif matched_job_disciplines and not m_disc:
                raw_sim = semantic_matcher.compute_similarity(job_field, m)
                sim = raw_sim if raw_sim >= 0.70 else 0.20
            else:
                # 3. Fallback semantic similarity
                sim = semantic_matcher.compute_similarity(job_field, m)

            if sim > best_sim:
                best_sim, best_major = sim, m

        # Relevance threshold: >= 0.55 considered relevant
        major_passed = best_sim >= 0.55 if (job_has_edu_req and majors) else True

        if majors:
            edu_score = 0.4 * degree_score + 0.6 * best_sim
        else:
            edu_score = 0.5 * degree_score

        failures = []
        if req_degree_level > 0 and not degree_passed:
            failures.append(
                {
                    "type": "EDUCATION",
                    "requirement": f"Trình độ học vấn tối thiểu: bậc {req_degree_level}",
                    "candidateValue": f"Bậc {best_cand_degree}",
                    "status": "FAIL",
                    "reason": f"Bằng cấp của ứng viên (bậc {best_cand_degree}) chưa đạt mức tối thiểu của công việc (bậc {req_degree_level}).",
                }
            )

        if job_has_edu_req and majors and not major_passed:
            failures.append(
                {
                    "type": "EDUCATION",
                    "requirement": f"Chuyên ngành đào tạo phù hợp: {job_field}",
                    "candidateValue": best_major or "Chưa rõ",
                    "status": "FAIL",
                    "reason": f"Chuyên ngành đào tạo ({best_major}) không phù hợp với yêu cầu chuyên môn của công việc ({job_field}).",
                }
            )

        return {
            "score": round(max(0.0, min(1.0, edu_score)), 2),
            "has_degree": best_cand_degree > 0,
            "degree_level": best_cand_degree,
            "req_degree_level": req_degree_level,
            "degree_passed": degree_passed,
            "major_passed": major_passed,
            "best_major": best_major,
            "best_sim": round(best_sim, 3),
            "failures": failures,
        }

    def _eval_projects(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> Dict[str, Any]:
        projects = cand_profile.projects
        if not projects:
            return {"score": 0.0, "project_count": 0}

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
                if r_lower in j_title_lower or j_title_lower in r_lower:
                    best_role_sim = 1.0
                else:
                    best_role_sim = max(
                        best_role_sim,
                        semantic_matcher.compute_similarity(
                            job.title, proj.project_role
                        ),
                    )
            else:
                best_role_sim = max(
                    best_role_sim, semantic_matcher.compute_similarity(job.title, desc)
                )

        all_text = all_text.lower()
        matched_skills = 0
        if job_req_skills:
            for s in job_req_skills:
                if normalize_skill_name(s).lower() in all_text or s.lower() in all_text:
                    matched_skills += 1
            skill_app = matched_skills / float(len(job_req_skills))
        else:
            skill_app = 1.0

        job_full_text = (
            f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        )
        semantic_sim = semantic_matcher.compute_best_similarity(
            job_full_text, project_descs
        )

        raw = 0.4 * skill_app + 0.4 * semantic_sim + 0.2 * best_role_sim
        if len(projects) > 1 and raw > 0.5:
            raw = min(1.0, raw * 1.1)

        return {
            "score": raw,
            "project_count": len(projects),
            "skill_app_ratio": skill_app,
            "semantic_sim": semantic_sim,
            "role_sim": best_role_sim,
        }

    CERTIFICATE_DOMAINS: Dict[str, List[str]] = {
        "FINANCE_ACCOUNTING": [
            "cpa",
            "acca",
            "cfa",
            "kế toán",
            "ke toan",
            "kiểm toán",
            "kiem toan",
            "thuế",
            "thue",
            "cma",
            "cia",
            "chief accountant",
            "kế toán trưởng",
            "audit",
        ],
        "PROJECT_MANAGEMENT": [
            "pmp",
            "prince2",
            "scrum",
            "agile",
            "csm",
            "pmi",
            "itil",
            "product owner",
            "psm",
        ],
        "CLOUD_DEVOPS": [
            "aws",
            "azure",
            "gcp",
            "google cloud",
            "kubernetes",
            "cka",
            "ckad",
            "terraform",
            "cissp",
            "ceh",
            "comptia",
        ],
        "MARKETING_ADVERTISING": [
            "digital marketing",
            "google ads",
            "facebook ads",
            "meta certified",
            "seo",
            "content marketing",
            "hubspot",
            "marketing",
        ],
        "DATA_ANALYTICS": [
            "data analytics",
            "power bi",
            "tableau",
            "data analyst",
            "data science",
        ],
        "HUMAN_RESOURCES": [
            "shrm",
            "phr",
            "chrp",
            "nhân sự",
            "human resources",
        ],
    }

    def _detect_cert_domain(self, text: str) -> Optional[str]:
        t = text.lower()
        for dom, kw_list in self.CERTIFICATE_DOMAINS.items():
            if any(kw in t for kw in kw_list):
                return dom
        return None

    def _match_certificates(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> Dict[str, Any]:
        req_certs = job.required_certificates
        cand_certs = cand_profile.certificates

        if not req_certs:
            return {"score": 1.0, "matched": [], "missing": [], "failures": []}

        if not cand_certs:
            missing_names = [req.certificate_name for req in req_certs]
            failures = [
                {
                    "type": "CERTIFICATE",
                    "requirement": req.certificate_name,
                    "candidateValue": "Không có chứng chỉ",
                    "status": "FAIL",
                    "reason": f"Ứng viên thiếu chứng chỉ bắt buộc: {req.certificate_name}.",
                }
                for req in req_certs
                if getattr(req, "is_mandatory", True)
            ]
            return {
                "score": 0.0,
                "matched": [],
                "missing": missing_names,
                "failures": failures,
            }

        matched = []
        missing = []
        failures = []
        cand_cert_names = [
            c.certificate_name.strip() for c in cand_certs if c.certificate_name
        ]

        EQUIVALENCES: Dict[str, List[str]] = {
            "cpa": ["cpa", "acca", "certified public accountant"],
            "pmp": ["pmp", "project management professional", "prince2"],
            "aws certified solutions architect": [
                "aws certified solutions architect",
                "aws solutions architect",
                "azure solutions architect",
                "google professional cloud architect",
            ],
        }

        score_sum = 0.0
        for req in req_certs:
            req_name = req.certificate_name.strip()
            req_lower = req_name.lower()
            is_mand = getattr(req, "is_mandatory", True)
            req_dom = self._detect_cert_domain(req_name)

            # 1. Exact match
            is_exact = any(
                req_lower == c.lower()
                or (
                    len(req_lower) > 3
                    and (req_lower in c.lower() or c.lower() in req_lower)
                )
                for c in cand_cert_names
            )
            if is_exact:
                matched.append(req_name)
                score_sum += 1.0
                continue

            # 2. Equivalent check
            is_equiv = False
            for canonical, equiv_list in EQUIVALENCES.items():
                if any(eq in req_lower for eq in equiv_list):
                    if any(
                        any(eq in c.lower() for eq in equiv_list)
                        for c in cand_cert_names
                    ):
                        is_equiv = True
                        break
            if is_equiv:
                matched.append(f"{req_name} (Equivalent)")
                score_sum += 0.95
                continue

            # 3. Domain validation check
            has_domain_mismatch = False
            has_domain_match = False
            for c in cand_cert_names:
                c_dom = self._detect_cert_domain(c)
                if req_dom and c_dom:
                    if req_dom == c_dom:
                        has_domain_match = True
                    else:
                        has_domain_mismatch = True

            if has_domain_match:
                score_sum += 0.60
                matched.append(f"{req_name} (Related)")
                if is_mand:
                    failures.append(
                        {
                            "type": "CERTIFICATE",
                            "requirement": req_name,
                            "candidateValue": "Chứng chỉ cùng lĩnh vực (Chưa đạt mức tương đương)",
                            "status": "FAIL",
                            "reason": f"Ứng viên có chứng chỉ cùng lĩnh vực nhưng chưa đạt cấp độ hoặc tính tương đương bắt buộc của '{req_name}'.",
                        }
                    )
                continue

            if has_domain_mismatch and not has_domain_match:
                missing.append(req_name)
                if is_mand:
                    failures.append(
                        {
                            "type": "CERTIFICATE",
                            "requirement": req_name,
                            "candidateValue": "Chứng chỉ không cùng lĩnh vực chuyên môn (Không tương đương)",
                            "status": "FAIL",
                            "reason": f"Ứng viên không có chứng chỉ thuộc lĩnh vực '{req_name}'.",
                        }
                    )
                continue

            # 4. Semantic similarity fallback
            best_sim = max(
                (
                    semantic_matcher.compute_similarity(req_name, c)
                    for c in cand_cert_names
                ),
                default=0.0,
            )

            if best_sim >= 0.80:
                score_sum += 0.60
                matched.append(f"{req_name} (Related: {best_sim:.2f})")
                if is_mand:
                    failures.append(
                        {
                            "type": "CERTIFICATE",
                            "requirement": req_name,
                            "candidateValue": f"Chứng chỉ liên quan ({cand_cert_names[0] if cand_cert_names else 'N/A'})",
                            "status": "FAIL",
                            "reason": f"Chứng chỉ liên quan nhưng không phải là chứng chỉ tương đương trực tiếp của '{req_name}'.",
                        }
                    )
            else:
                missing.append(req_name)
                if is_mand:
                    failures.append(
                        {
                            "type": "CERTIFICATE",
                            "requirement": req_name,
                            "candidateValue": "Không có chứng chỉ phù hợp",
                            "status": "FAIL",
                            "reason": f"Ứng viên thiếu chứng chỉ bắt buộc '{req_name}'.",
                        }
                    )

        final_score = score_sum / len(req_certs) if req_certs else 1.0
        return {
            "score": round(final_score, 2),
            "matched": matched,
            "missing": missing,
            "failures": failures,
        }


generic_matching_engine = GenericMatchingEngine()
