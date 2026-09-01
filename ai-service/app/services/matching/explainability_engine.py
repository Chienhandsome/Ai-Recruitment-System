from typing import Dict, Any, List
from app.services.matching.summary_generator import SummaryGenerator


class ExplainabilityEngine:
    """
    Translates numeric match metrics, domain compatibility, and final scores
    into deep, human-like HR Strengths, Gaps, Structured Pillar Point Breakdowns, and Diagnostic Summaries.
    Explains the exact quantitative rationale behind every single point awarded or deducted.
    """

    def explain(
        self,
        metrics: Dict[str, Any],
        scores: Dict[str, Any],
        candidate_name: str,
        job_title: str
    ) -> Dict[str, Any]:
        strengths = []
        gaps = []

        skills_plus = []
        skills_minus = []

        exp_plus = []
        exp_minus = []

        edu_plus = []
        edu_minus = []

        other_plus = []
        other_minus = []

        domain_compat = metrics.get("domain_compatibility", 1.0)
        job_subdomain = metrics.get("job_subdomain", "GENERAL")
        cand_subdomain = metrics.get("cand_subdomain", "GENERAL")

        # -------------------------------------------------------------------------
        # 1. Bối Cảnh Mô Hình Doanh Nghiệp (Domain & Business-Model Context)
        # -------------------------------------------------------------------------
        if domain_compat >= 0.85:
            msg = f"Mô hình kinh nghiệm làm việc rất tương đồng với yêu cầu thực tế của vị trí ({job_title})."
            strengths.append(msg)
            exp_plus.append(msg)
        elif domain_compat >= 0.55:
            msg = "Có tư duy và kỹ năng chuyển giao tốt (Transferable Skills) giữa các phân khúc nghiệp vụ liên quan."
            strengths.append(msg)
            skills_plus.append(msg)
            gap_msg = "Có sự khác biệt nhất định về phân khúc mô hình kinh doanh so với vị trí tuyển dụng."
            gaps.append(gap_msg)
            exp_minus.append(gap_msg)
        else:
            gap_msg = "Mô hình kinh nghiệm trước đây không tương thích với mô hình hoạt động cốt lõi của vị trí tuyển dụng."
            gaps.append(gap_msg)
            exp_minus.append(gap_msg)

        # -------------------------------------------------------------------------
        # 2. Giải Trình Kỹ Năng & Thâm Niên Từng Kỹ Năng (Skills & Skill Years)
        # -------------------------------------------------------------------------
        sm = metrics.get("skills", {})
        matched_skills = sm.get("matched", [])
        missing_skills = sm.get("missing", [])
        skill_shortage_count = 0

        for m in matched_skills:
            src = m.get("source", "")
            name = m.get("name", "")
            actual_yrs = m.get("actual_years", 0.0)
            req_yrs = m.get("req_years", 0.0)
            years_gap = m.get("years_gap")

            # Check if skill matched but has experience years shortfall
            if years_gap and isinstance(years_gap, dict) and years_gap.get("penalty_msg"):
                skill_shortage_count += 1
                pen_msg = years_gap["penalty_msg"]
                gaps.append(pen_msg)
                skills_minus.append(pen_msg)
                pos_msg = f"Sở hữu kỹ năng '{name}' ({actual_yrs:.1f} năm kinh nghiệm thực chiến)."
                strengths.append(pos_msg)
                skills_plus.append(pos_msg)
            elif years_gap and isinstance(years_gap, dict) and years_gap.get("bonus_msg"):
                bonus_msg = years_gap["bonus_msg"]
                strengths.append(bonus_msg)
                skills_plus.append(bonus_msg)
            elif "Kỹ năng tương đương" in src:
                msg = f"AI nhận diện kỹ năng '{name}' qua {src} (Đạt chuẩn chuyên môn)."
                strengths.append(msg)
                skills_plus.append(msg)
            elif "Kỹ năng chuyển giao" in src:
                msg = f"Có kỹ năng chuyển giao năng lực có thể đáp ứng tốt yêu cầu: '{name}'."
                strengths.append(msg)
                skills_plus.append(msg)
            elif "skills_list" in src:
                if m.get("isMandatory"):
                    msg = f"Thành thạo kỹ năng bắt buộc cốt lõi: '{name}' (Khai báo đạt chuẩn năng lực)."
                else:
                    msg = f"Sở hữu kỹ năng bổ trợ: '{name}'."
                strengths.append(msg)
                skills_plus.append(msg)
            else:
                msg = f"Kỹ năng '{name}' được chứng minh qua {src}."
                strengths.append(msg)
                skills_plus.append(msg)

        for m in missing_skills:
            name = m.get("name", "")
            if m.get("isMandatory"):
                if m.get("transfer_credit", 0.0) > 0:
                    msg = f"Chưa tìm thấy bằng chứng trực tiếp về kỹ năng bắt buộc '{name}' (Mới chỉ ghi nhận năng lực chuyển giao một phần, đã trừ điểm tiêu chí bắt buộc)."
                else:
                    msg = f"Chưa tìm thấy thông tin hoặc bằng chứng xác thực về kỹ năng bắt buộc: '{name}' trong hồ sơ khai báo (Đã trừ điểm tiêu chí tiên quyết)."
                gaps.append(msg)
                skills_minus.append(msg)
            else:
                msg = f"Chưa ghi nhận bằng chứng về kỹ năng bổ trợ: '{name}' trong hồ sơ khai báo."
                gaps.append(msg)
                skills_minus.append(msg)

        # -------------------------------------------------------------------------
        # 3. Giải Trình Kinh Nghiệm & Thâm Niên (Experience & Seniority)
        # -------------------------------------------------------------------------
        em = metrics.get("experience", {})
        total_yrs = em.get("total_years", 0.0)
        req_yrs = em.get("req_years", 0.0)

        if req_yrs > 0:
            if total_yrs >= req_yrs - 0.05:
                msg = f"Tổng thâm niên tích lũy ({total_yrs:.1f} năm) đáp ứng hoặc vượt yêu cầu kinh nghiệm của JD ({req_yrs:.1f} năm) -> Đạt điểm thâm niên tối đa."
                strengths.append(msg)
                exp_plus.append(msg)
            else:
                gap_val = round(req_yrs - total_yrs, 1)
                msg = f"Tổng thâm niên tích lũy ({total_yrs:.1f} năm) chưa đạt số năm kinh nghiệm yêu cầu tối thiểu ({req_yrs:.1f} năm, thiếu {gap_val} năm) -> Bị trừ điểm thâm niên tương ứng."
                gaps.append(msg)
                exp_minus.append(msg)

        if em.get("title_sim", 0.0) >= 0.75 and em.get("best_title"):
            msg = f"Đã từng đảm nhiệm vị trí cấp bậc tương đương hoặc tương đồng ({em['best_title']}) -> Cộng điểm tương quan cấp bậc."
            strengths.append(msg)
            exp_plus.append(msg)
        elif em.get("best_title") and any(k in em.get("best_title", "").lower() for k in ["intern", "fresher", "thực tập"]):
            msg = f"Vị trí công việc gần nhất ({em['best_title']}) ở cấp độ sơ cấp, chưa đạt cấp bậc theo yêu cầu của vị trí tuyển dụng -> Bị trừ điểm cấp bậc."
            gaps.append(msg)
            exp_minus.append(msg)

        # Dự án thực tế
        pm = em.get("project_metrics", {})
        if pm and pm.get("project_count", 0) > 0:
            if pm.get("skill_app_ratio", 0.0) > 0.5 or pm.get("role_sim", 0.0) > 0.7:
                msg = f"Có năng lực thực tiễn được chứng minh qua {pm['project_count']} dự án chuyên môn liên quan -> Cộng điểm năng lực thực thi dự án."
                strengths.append(msg)
                exp_plus.append(msg)

        # Career Velocity & Audit Diagnostics (V4)
        vel = metrics.get("career_velocity", {})
        if vel.get("velocity_label") == "FAST_TRACK":
            msg = f"Ứng viên có tốc độ học hỏi và thăng tiến nghề nghiệp nhanh ({vel.get('promotion_count', 0)} lần thăng tiến) -> Cộng điểm gia tốc phát triển."
            strengths.append(msg)
            exp_plus.append(msg)
        elif vel.get("velocity_label") == "STEADY_GROWTH":
            msg = f"Quỹ đạo phát triển nghề nghiệp tăng trưởng đều đặn qua các vị trí công việc."
            exp_plus.append(msg)

        audit = metrics.get("audit", {})
        for flag in audit.get("inflation_flags", []):
            gaps.append(flag)
            exp_minus.append(flag)

        # -------------------------------------------------------------------------
        # 4. Giải Trình Học Vấn (Education)
        # -------------------------------------------------------------------------
        edm = metrics.get("education", {})
        if edm.get("has_degree"):
            if edm.get("best_sim", 0.0) > 0.7 and edm.get("best_major"):
                msg = f"Trình độ văn bằng ({edm.get('best_degree', 'Đại học')}) và chuyên ngành ({edm['best_major']}) có độ tương đồng cao với vị trí tuyển dụng -> Đạt điểm tối đa học vấn."
                strengths.append(msg)
                edu_plus.append(msg)
            elif edm.get("best_major"):
                msg = f"Chuyên ngành tốt nghiệp ({edm['best_major']}) thuộc khối ngành gần/khác so với trọng tâm chuyên môn công việc -> Bị trừ điểm tương quan ngành."
                gaps.append(msg)
                edu_minus.append(msg)
        else:
            msg = "Chưa tìm thấy thông tin văn bằng / học vấn chính thức trong hồ sơ khai báo -> Bị trừ điểm tiêu chí học vấn."
            gaps.append(msg)
            edu_minus.append(msg)

        # -------------------------------------------------------------------------
        # 5. Giải Trình Chứng Chỉ (Certificates)
        # -------------------------------------------------------------------------
        om = metrics.get("other", {})
        for cert in om.get("matched", []):
            msg = f"Sở hữu chứng chỉ chuyên môn / ngoại ngữ đạt chuẩn: '{cert}' -> Cộng điểm tiêu chí bổ trợ."
            strengths.append(msg)
            other_plus.append(msg)
        for cert in om.get("missing", []):
            msg = f"Chưa tìm thấy thông tin về chứng chỉ chuyên môn: '{cert}' trong hồ sơ khai báo."
            gaps.append(msg)
            other_minus.append(msg)

        if not other_plus and not other_minus:
            other_plus.append("Đáp ứng tiêu chuẩn chung về chứng chỉ và kỹ năng bổ sung.")

        # -------------------------------------------------------------------------
        # 6. Cấu Trúc Bảng Điểm Từng Trụ Cột (Structured Pillar Explanations)
        # -------------------------------------------------------------------------
        bd = scores.get("score_breakdown", {})
        skills_bd = bd.get("skills", {})
        exp_bd = bd.get("experience", {})
        edu_bd = bd.get("education", {})
        other_bd = bd.get("other", {})

        s_earned = skills_bd.get("earned_points", round(scores.get("skills_score", 0.0) * 0.4, 2))
        s_max = skills_bd.get("max_points", 40.0)

        e_earned = exp_bd.get("earned_points", round(scores.get("experience_score", 0.0) * 0.3, 2))
        e_max = exp_bd.get("max_points", 30.0)

        ed_earned = edu_bd.get("earned_points", round(scores.get("education_score", 0.0) * 0.15, 2))
        ed_max = edu_bd.get("max_points", 15.0)

        o_earned = other_bd.get("earned_points", round(scores.get("other_score", 0.0) * 0.15, 2))
        o_max = other_bd.get("max_points", 15.0)

        # Generate custom explanatory summaries per pillar
        skills_summary = f"Đạt {s_earned:.1f} / {s_max:.1f} điểm: Đã đáp ứng {len(matched_skills)}/{len(matched_skills)+len(missing_skills)} kỹ năng chuyên môn"
        if skill_shortage_count > 0:
            skills_summary += f" (có {skill_shortage_count} kỹ năng bị trừ điểm do chưa đủ số năm kinh nghiệm theo JD)."
        else:
            skills_summary += "."

        exp_summary = f"Đạt {e_earned:.1f} / {e_max:.1f} điểm: Đánh giá dựa trên {total_yrs:.1f} năm thâm niên (Yêu cầu: {req_yrs:.1f} năm), cấp bậc vị trí và dự án thực chiến."
        edu_summary = f"Đạt {ed_earned:.1f} / {ed_max:.1f} điểm: Đánh giá dựa trên cấp bậc văn bằng ({edm.get('best_degree', 'Đại học/Cao đẳng')}) và mức độ phù hợp chuyên ngành ({edm.get('best_major', 'Chuyên ngành')})."
        other_summary = f"Đạt {o_earned:.1f} / {o_max:.1f} điểm: Đánh giá qua các chứng chỉ chuyên môn, ngoại ngữ và tiêu chí bổ trợ."

        pillar_explanations = {
            "skills": {
                "earned_points": s_earned,
                "max_points": s_max,
                "plus_reasons": skills_plus or ["Đáp ứng các kỹ năng cơ bản của công việc."],
                "minus_reasons": skills_minus or ["Không có điểm trừ đáng kể về kỹ năng."],
                "summary": skills_summary,
            },
            "experience": {
                "earned_points": e_earned,
                "max_points": e_max,
                "plus_reasons": exp_plus or ["Có kinh nghiệm làm việc liên quan."],
                "minus_reasons": exp_minus or ["Không có điểm trừ đáng kể về kinh nghiệm."],
                "summary": exp_summary,
            },
            "education": {
                "earned_points": ed_earned,
                "max_points": ed_max,
                "plus_reasons": edu_plus or ["Đạt yêu cầu về trình độ học vấn."],
                "minus_reasons": edu_minus or ["Không có điểm trừ về học vấn."],
                "summary": edu_summary,
            },
            "other": {
                "earned_points": o_earned,
                "max_points": o_max,
                "plus_reasons": other_plus or ["Đáp ứng chứng chỉ yêu cầu."],
                "minus_reasons": other_minus or ["Không có điểm trừ về chứng chỉ."],
                "summary": other_summary,
            },
        }

        # -------------------------------------------------------------------------
        # 7. Tổng Hợp Báo Cáo Chẩn Đoán (Executive Diagnostic Summary)
        # -------------------------------------------------------------------------
        summary = SummaryGenerator.generate_summary(
            candidate_name=candidate_name,
            job_title=job_title,
            overall_score=scores.get("overall_score", 0.0),
            match_level=scores.get("match_level", "LOW"),
            skills_score=scores.get("skills_score", 0.0),
            experience_score=scores.get("experience_score", 0.0),
            education_score=scores.get("education_score", 0.0),
            other_score=scores.get("other_score", 0.0),
            domain_compatibility=domain_compat,
            job_subdomain=job_subdomain,
            cand_subdomain=cand_subdomain,
            missing_required_skills=sm.get("missing_mandatory", []),
            strengths=strengths,
            gaps=gaps,
        )

        return {
            "strengths": strengths,
            "gaps": gaps,
            "summary": summary,
            "pillar_explanations": pillar_explanations,
        }


explainability_engine = ExplainabilityEngine()
