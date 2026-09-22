from typing import List, Dict, Any


class SummaryGenerator:
    """
    Synthesizes deep, transparent, human-like HR diagnostic summaries
    explaining exactly WHY the candidate received their specific score and match level
    across all 14 canonical industries and 38 specialized sub-domains.
    """

    @staticmethod
    def generate_summary(
        candidate_name: str,
        job_title: str,
        overall_score: float,
        match_level: str,
        skills_score: float,
        experience_score: float,
        education_score: float,
        other_score: float = 0.0,
        domain_compatibility: float = 1.0,
        job_subdomain: str = "GENERAL_PROFESSIONAL",
        cand_subdomain: str = "GENERAL_PROFESSIONAL",
        missing_required_skills: List[str] | None = None,
        strengths: List[str] | None = None,
        gaps: List[str] | None = None,
        project_score: float | None = None,
        mandatory_status: str = "PASS",
        mandatory_failures: List[Dict[str, Any]] | None = None,
        requires_verification_skills: List[str] | None = None,
        conditional_mandatory_skills: List[str] | None = None,
    ) -> str:
        missing_required_skills = missing_required_skills or []
        strengths = strengths or []
        gaps = gaps or []
        mandatory_failures = mandatory_failures or []
        requires_verification_skills = requires_verification_skills or []
        conditional_mandatory_skills = conditional_mandatory_skills or []

        domain_labels = {
            # 1. Design & Creative
            "DESIGN_UI_UX": "Thiết kế Sản phẩm UI/UX & Design System",
            "DESIGN_3D_GAME_ART": "Thiết kế 3D Art & Hoạt họa Game",
            "DESIGN_GRAPHIC_BRANDING": "Thiết kế Đồ họa Thương hiệu & In ấn",

            # 2. Finance & Accounting
            "FIN_TAX_ACCOUNTING": "Kế toán Thuế & Báo cáo Tài chính Doanh nghiệp",
            "FIN_INVESTMENT_BANKING": "Tài chính Đầu tư, Định giá & Ngân hàng Đầu tư",
            "FIN_AUDIT_INTERNAL_CONTROL": "Kiểm toán & Kiểm soát Nội bộ",
            "FIN_RETAIL_BANKING": "Tín dụng & Dịch vụ Ngân hàng Bán lẻ",

            # 3. Marketing & Growth
            "MKT_ECOMMERCE_D2C": "Bán lẻ E-commerce & Tăng trưởng D2C",
            "MKT_MOBILE_GAMING_UA": "Mobile Gaming & App User Acquisition",
            "MKT_B2B_SAAS": "B2B SaaS & Tiếp thị Khách hàng Doanh nghiệp",
            "MKT_AGENCY_SERVICES": "Digital Agency & Quản lý Chiến dịch Đa nhãn hàng",
            "MKT_SOCIAL_CONTENT": "Content & Truyền thông Mạng xã hội",

            # 4. IT & Software Engineering
            "IT_FRONTEND_WEB": "Lập trình Web Frontend",
            "IT_BACKEND_SYSTEMS": "Hệ thống Backend & Cơ sở Dữ liệu Phân tán",
            "IT_EMBEDDED_FIRMWARE": "Lập trình Nhúng, Vi điều khiển & Phần cứng IoT",
            "IT_AI_DATA_SCIENCE": "Trí tuệ Nhân tạo, Machine Learning & Khoa học Dữ liệu",
            "IT_DEVOPS_CLOUD": "Hạ tầng Đám mây Cloud & DevOps CI/CD",

            # 5. Education & Training
            "EDU_ACADEMIC_ESL": "Giảng dạy Tiếng Anh Học thuật & Luyện thi Khảo thí",
            "EDU_EARLY_CHILDHOOD_K12": "Giáo dục Mầm non & Tiểu học K12",
            "EDU_CORPORATE_TRAINING": "Đào tạo & Phát triển Năng lực Doanh nghiệp (L&D)",

            # 6. Healthcare & Medicine
            "MED_CLINICAL_DOCTOR": "Y khoa Lâm sàng & Khám chữa bệnh",
            "MED_PHARMACEUTICAL": "Dược phẩm Lâm sàng & Trình dược Y tế",
            "MED_NURSING_CARE": "Điều dưỡng & Chăm sóc Y tế",

            # 7. Logistics & Supply Chain
            "LOG_WAREHOUSE_WMS": "Quản trị Kho vận & Hệ thống WMS",
            "LOG_CUSTOMS_FORWARDING": "Thủ tục Xuất nhập khẩu & Hải quan Forwarding",
            "LOG_FLEET_TRANSPORT": "Quản lý Đội xe Vận tải & Giao nhận Last-mile",

            # 8. Human Resources
            "HR_RECRUITMENT_TALENT": "Tuyển dụng & Thu hút Tài năng (Talent Acquisition)",
            "HR_COMPENSATION_BENEFITS": "Chính sách Lương thưởng & Phúc lợi (C&B)",
            "HR_GENERAL_OPERATIONS": "Quản trị Nhân sự Tổng hợp & Vận hành",

            # 9. Legal & Compliance
            "LAW_CORPORATE_LEGAL": "Pháp chế Doanh nghiệp & Hợp đồng Thương mại",
            "LAW_INTELLECTUAL_PROPERTY": "Sở hữu Trí tuệ, Bản quyền & Sáng chế",
            "LAW_REGULATORY_COMPLIANCE": "Tuân thủ Quy chế & Pháp lý Ngành",

            # 10. Manufacturing & Industrial
            "MFG_AUTOMATION_PLC": "Kỹ thuật Tự động hóa & Lập trình PLC",
            "MFG_QUALITY_CONTROL": "Quản lý Chất lượng Sản xuất (QA/QC ISO)",
            "MFG_PLANT_OPERATIONS": "Vận hành Phân xưởng & Dây chuyền Sản xuất",

            # 11. Hospitality & Tourism
            "HOSP_HOTEL_RESORT": "Quản lý Khách sạn & Khu nghỉ dưỡng",
            "HOSP_FB_RESTAURANT": "Vận hành Nhà hàng & Dịch vụ Ẩm thực (F&B)",

            # 12. Real Estate & Construction
            "REAL_PROPERTY_BROKERAGE": "Môi giới Bất động sản & Phân phối Dự án",
            "REAL_CIVIL_CONSTRUCTION": "Kỹ thuật Xây dựng Dân dụng & Thi công",

            # 13. Agriculture & Agritech
            "AGRI_CROP_FARMING": "Trồng trọt & Nông nghiệp Công nghệ cao",
            "AGRI_LIVESTOCK_VET": "Chăn nuôi & Thú y Nông nghiệp",

            # 14. Customer Support
            "CS_CUSTOMER_CARE": "Dịch vụ Chăm sóc Khách hàng & Call Center",
            "CS_TECH_HELPDESK": "Hỗ trợ Kỹ thuật & Helpdesk IT",

            # 15. Sales & Commercial Distribution
            "SALES_FMCG_CONSUMER": "Bán hàng Tiêu dùng nhanh FMCG & F&B",
            "SALES_DISTRIBUTION_CHANNELS": "Quản trị Kênh Phân phối & Bán lẻ (GT/MT/Horeca)",
            "SALES_B2B_ENTERPRISE": "Bán hàng Doanh nghiệp B2B & Giải pháp Thương mại",
            "SALES_PHARMA_HEALTHCARE": "Quản lý Bán hàng Dược phẩm & Kênh Y tế",

            "GENERAL_PROFESSIONAL": "Nghiệp vụ Chuyên môn Chung"
        }

        job_dom_label = domain_labels.get(job_subdomain, job_subdomain)
        cand_dom_label = domain_labels.get(cand_subdomain, cand_subdomain)

        parts = []

        # =========================================================================
        # 1. TRƯỜNG HỢP: KHÔNG ĐẠT TIÊU CHÍ TIÊN QUYẾT (MANDATORY GATING FAIL)
        # =========================================================================
        if mandatory_status == "FAIL":
            failure_items = []
            for f in mandatory_failures:
                t = f.get("type", "YÊU CẦU")
                req = f.get("requirement", "")
                reason = f.get("reason") or f.get("candidateValue") or "Chưa đạt yêu cầu"
                failure_items.append(f"[{t}: {req} - {reason}]")
            failures_text = "; ".join(failure_items)

            has_hard_fail = any(f.get("type") in ["SKILL", "EDUCATION"] for f in mandatory_failures)
            is_minor_gap = (
                not has_hard_fail
                and len(mandatory_failures) <= 2
                and overall_score >= 80.0
            )

            if overall_score >= 75.0:
                parts.append(
                    f"ỨNG VIÊN CÓ NĂNG LỰC TỐT NHƯNG CHƯA ĐẠT TIÊU CHÍ BẮT BUỘC ({overall_score:.1f}/100 - CẤP ĐỘ {match_level} - TRẠNG THÁI: KHÔNG ĐẠT TIÊN QUYẾT) cho vị trí '{job_title}'."
                )
                parts.append(
                    f"Hồ sơ ứng viên có điểm kỹ năng chuyên môn ({skills_score:.1f}/100) và kinh nghiệm ({experience_score:.1f}/100) tương đồng tốt với yêu cầu thực tế ({cand_dom_label} khớp với {job_dom_label})."
                )
                if failures_text:
                    parts.append(f"Cảnh báo vi phạm điều kiện tiên quyết: {failures_text}.")
                if is_minor_gap:
                    parts.append(
                        "Khuyến nghị HR: Cân nhắc phỏng vấn nếu chấp nhận linh hoạt điều chỉnh tiêu chuẩn tiên quyết (Ngoại ngữ/Kinh nghiệm), hoặc xem xét cho vị trí cấp bậc tương đương (Middle thay vì Senior)."
                    )
                else:
                    parts.append(
                        "Khuyến nghị HR: Cân nhắc loại hồ sơ (Reject) do không thỏa mãn tiêu chuẩn bắt buộc của vị trí tuyển dụng."
                    )
            else:
                parts.append(
                    f"ỨNG VIÊN KHÔNG PHÙ HỢP ({overall_score:.1f}/100 - CẤP ĐỘ {match_level} - TRẠNG THÁI: KHÔNG ĐẠT TIÊN QUYẾT) cho vị trí '{job_title}'."
                )
                if failures_text:
                    parts.append(f"Lý do cốt lõi: Vi phạm tiêu chí tiên quyết ({failures_text}).")
                else:
                    parts.append(
                        f"Hồ sơ ứng viên có khoảng cách năng lực và kinh nghiệm quá lớn (Kỹ năng: {skills_score:.1f}, Kinh nghiệm: {experience_score:.1f})."
                    )
                parts.append("Khuyến nghị: Từ chối hồ sơ (Auto-Reject).")

        # =========================================================================
        # 2. TRƯỜNG HỢP: THÔNG QUA CÓ ĐIỀU KIỆN (CONDITIONAL PASS QUA KỸ NĂNG CHUYỂN GIAO)
        # =========================================================================
        elif mandatory_status == "CONDITIONAL_PASS":
            cond_list = conditional_mandatory_skills or []
            cond_text = ", ".join(f"'{s}'" for s in cond_list) if cond_list else "tiêu chí bắt buộc"
            parts.append(
                f"ỨNG VIÊN TIỀM NĂNG - THÔNG QUA CÓ ĐIỀU KIỆN ({overall_score:.1f}/100 - CẤP ĐỘ {match_level} - TRẠNG THÁI: CHUYỂN GIAO NĂNG LỰC) cho vị trí '{job_title}'."
            )
            parts.append(
                f"Ứng viên đạt chuẩn qua cơ chế Kỹ năng Chuyển giao Năng lực cấp cao (Transferable Skills) cho kỹ năng bắt buộc: {cond_text}. "
                f"Nền tảng chuyên môn vững chắc từ {cand_dom_label} liên thông tương thích tốt với {job_dom_label}."
            )
            if strengths:
                top_str = "; ".join(strengths[:2])
                parts.append(f"Điểm nổi bật: {top_str}.")
            parts.append(
                f"Khuyến nghị HR: KHÔNG LOẠI HỒ SƠ. Mời ứng viên vào vòng phỏng vấn để đánh giá chuyên sâu về tốc độ làm quen công nghệ (Ramp-up period) "
                f"và khả năng chuyển giao thực tế vào {cond_text}."
            )

        # =========================================================================
        # 3. TRƯỜNG HỢP: ĐẠT TIÊU CHÍ TIÊN QUYẾT (MANDATORY PASS HOẶC N/A)
        # =========================================================================
        else:
            if match_level == "HIGH":
                parts.append(
                    f"ỨNG VIÊN PHÙ HỢP HÀNG ĐẦU ({overall_score:.1f}/100 - CẤP ĐỘ {match_level}) cho vị trí '{job_title}'."
                )
                parts.append(
                    f"Hồ sơ ứng viên thể hiện sự đồng điệu xuất sắc về mô hình chuyên môn ({cand_dom_label} khớp với {job_dom_label}) "
                    f"với điểm kỹ năng chuyên môn đạt {skills_score:.1f}/100 và kinh nghiệm đạt {experience_score:.1f}/100."
                )
                if strengths:
                    top_str = "; ".join(strengths[:2])
                    parts.append(f"Điểm nổi bật: {top_str}.")
                parts.append("Khuyến nghị: Mời phỏng vấn chuyên sâu ngay.")

            elif match_level == "MEDIUM":
                parts.append(
                    f"ỨNG VIÊN TIỀM NĂNG CHUYỂN GIAO ({overall_score:.1f}/100 - CẤP ĐỘ {match_level}) cho vị trí '{job_title}'."
                )
                if domain_compatibility < 0.75:
                    parts.append(
                        f"Ứng viên có chuyên môn từ mảng '{cand_dom_label}', có thể chuyển giao kỹ năng sang '{job_dom_label}' "
                        f"nhưng có sự khác biệt nhất định về phân khúc mô hình hoạt động và yêu cầu nghiệp vụ đặc thù."
                    )
                if missing_required_skills:
                    parts.append(
                        f"Cần lưu ý ứng viên chưa đáp ứng kỹ năng bắt buộc: {', '.join(missing_required_skills)}."
                    )
                if gaps:
                    top_gaps = "; ".join(gaps[:2])
                    parts.append(f"Hạn chế cần đào tạo thêm: {top_gaps}.")
                parts.append("Khuyến nghị: Phỏng vấn đánh giá khả năng thích ứng và tư duy nghiệp vụ.")

            else: # LOW
                parts.append(
                    f"ỨNG VIÊN CHƯA PHÙ HỢP ({overall_score:.1f}/100 - CẤP ĐỘ {match_level}) cho vị trí '{job_title}'."
                )
                if domain_compatibility < 0.30:
                    parts.append(
                        f"Lý do cốt lõi: Sai lệch bản chất mô hình hoạt động. Ứng viên thuộc mảng '{cand_dom_label}' "
                        f"(vận hành khác biệt hoàn toàn với mô hình '{job_dom_label}' của vị trí tuyển dụng). "
                        f"Các từ khóa kỹ thuật tương đồng (nếu có) chỉ mang tính chất trùng lặp công cụ bề mặt."
                    )
                elif missing_required_skills:
                    parts.append(
                        f"Lý do cốt lõi: Hồ sơ thiếu hụt hầu hết các kỹ năng bắt buộc tiên quyết: {', '.join(missing_required_skills)}."
                    )
                else:
                    parts.append(
                        f"Hồ sơ ứng viên có khoảng cách năng lực và kinh nghiệm quá lớn (Kỹ năng: {skills_score:.1f}, Kinh nghiệm: {experience_score:.1f})."
                    )
                if gaps:
                    parts.append(f"Điểm thiếu sót chính: {gaps[0]}.")
                parts.append("Khuyến nghị: Từ chối hồ sơ hoặc lưu trữ cho các vị trí khác đúng phân khúc.")

        # =========================================================================
        # 3. LƯU Ý PHỎNG VẤN NẾU CÓ KỸ NĂNG TIẾP XÚC GIÁN TIẾP (THIRD-PARTY/PASSIVE)
        # =========================================================================
        if requires_verification_skills:
            sk_names = ", ".join(f"'{s}'" for s in requires_verification_skills)
            parts.append(
                f"Lưu ý phỏng vấn: Kỹ năng {sk_names} được ghi nhận qua ngữ cảnh gián tiếp/theo dõi từ bên thứ ba -> Cần đặt câu hỏi phỏng vấn để xác thực năng lực thực hành độc lập."
            )

        return " ".join(parts)


summary_generator = SummaryGenerator()
