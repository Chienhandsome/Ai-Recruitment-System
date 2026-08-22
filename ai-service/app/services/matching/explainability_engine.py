from typing import Dict, Any, List
from app.services.matching.summary_generator import SummaryGenerator


class ExplainabilityEngine:
    """
    Translates numeric match metrics, domain compatibility, and final scores
    into deep, human-like HR Strengths, Gaps, Structured Pillar Point Breakdowns, and Diagnostic Summaries.
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
        # 2. Giải Trình Kỹ Năng (Skills Explainability)
        # -------------------------------------------------------------------------
        sm = metrics.get("skills", {})
        for m in sm.get("matched", []):
            src = m.get("source", "")
            if "Kỹ năng tương đương" in src:
                msg = f"AI nhận diện kỹ năng '{m['name']}' qua {src}."
                strengths.append(msg)
                skills_plus.append(msg)
            elif "Kỹ năng chuyển giao" in src:
                msg = f"Có kỹ năng chuyển giao có thể đáp ứng yêu cầu: '{m['name']}'."
                strengths.append(msg)
                skills_plus.append(msg)
            elif "skills_list" in src:
                if m.get("isMandatory"):
                    msg = f"Thành thạo kỹ năng bắt buộc cốt lõi: '{m['name']}'."
                else:
                    msg = f"Sở hữu kỹ năng bổ trợ: '{m['name']}'."
                strengths.append(msg)
                skills_plus.append(msg)
            else:
                msg = f"Kỹ năng '{m['name']}' được chứng minh qua {src}."
                strengths.append(msg)
                skills_plus.append(msg)

        for m in sm.get("missing", []):
            if m.get("isMandatory"):
                if m.get("transfer_credit", 0.0) > 0:
                    msg = f"Chưa có kỹ năng bắt buộc '{m['name']}' (Mới chỉ có kinh nghiệm chuyển giao một phần)."
                else:
                    msg = f"Thiếu hoàn toàn kỹ năng bắt buộc: '{m['name']}'. Đây là tiêu chí tiên quyết."
                gaps.append(msg)
                skills_minus.append(msg)
            else:
                msg = f"Chưa thể hiện kỹ năng bổ trợ: '{m['name']}'."
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
                msg = f"Tổng thâm niên {total_yrs:.1f} năm đáp ứng hoặc vượt yêu cầu kinh nghiệm ({req_yrs:.1f} năm)."
                strengths.append(msg)
                exp_plus.append(msg)
            else:
                msg = f"Thâm niên tích lũy ({total_yrs:.1f} năm) chưa đạt số năm kinh nghiệm yêu cầu tối thiểu ({req_yrs:.1f} năm). Bị trừ điểm thâm niên tương ứng."
                gaps.append(msg)
                exp_minus.append(msg)

        if em.get("title_sim", 0.0) >= 0.75 and em.get("best_title"):
            msg = f"Đã từng đảm nhiệm vị trí cấp bậc tương đương hoặc tương đồng ({em['best_title']})."
            strengths.append(msg)
            exp_plus.append(msg)
        elif em.get("best_title") and "intern" in em.get("best_title", "").lower():
            msg = f"Vị trí công việc gần nhất ({em['best_title']}) ở cấp độ sơ cấp, chưa đạt cấp bậc theo yêu cầu của vị trí."
            gaps.append(msg)
            exp_minus.append(msg)

        # Dự án thực tế
        pm = em.get("project_metrics", {})
        if pm and pm.get("project_count", 0) > 0:
            if pm.get("skill_app_ratio", 0.0) > 0.5 or pm.get("role_sim", 0.0) > 0.7:
                msg = f"Có năng lực thực tiễn được chứng minh qua {pm['project_count']} dự án chuyên môn liên quan."
                strengths.append(msg)
                exp_plus.append(msg)

        # -------------------------------------------------------------------------
        # 4. Giải Trình Học Vấn (Education)
        # -------------------------------------------------------------------------
        edm = metrics.get("education", {})
        if edm.get("has_degree"):
            if edm.get("best_sim", 0.0) > 0.7 and edm.get("best_major"):
                msg = f"Chuyên ngành đào tạo ({edm['best_major']}) có sự tương đồng và liên quan cao với vị trí tuyển dụng."
                strengths.append(msg)
                edu_plus.append(msg)
            elif edm.get("best_major"):
                msg = f"Chuyên ngành tốt nghiệp ({edm['best_major']}) thuộc khối ngành khác so với trọng tâm chuyên môn công việc."
                gaps.append(msg)
                edu_minus.append(msg)
        else:
            msg = "Chưa cung cấp thông tin văn bằng / học vấn chính thức."
            gaps.append(msg)
            edu_minus.append(msg)

        # -------------------------------------------------------------------------
        # 5. Giải Trình Chứng Chỉ (Certificates)
        # -------------------------------------------------------------------------
        om = metrics.get("other", {})
        for cert in om.get("matched", []):
            msg = f"Sở hữu chứng chỉ chuyên môn / ngoại ngữ đạt chuẩn: '{cert}'."
            strengths.append(msg)
            other_plus.append(msg)
        for cert in om.get("missing", []):
            msg = f"Chưa có chứng chỉ chuyên môn yêu cầu: '{cert}'."
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

        pillar_explanations = {
            "skills": {
                "earned_points": s_earned,
                "max_points": s_max,
                "plus_reasons": skills_plus or ["Đáp ứng các kỹ năng cơ bản của công việc."],
                "minus_reasons": skills_minus or ["Không có điểm trừ đáng kể về kỹ năng."],
                "summary": f"Đạt {s_earned:.1f} / {s_max:.1f} điểm kỹ năng chuyên môn.",
            },
            "experience": {
                "earned_points": e_earned,
                "max_points": e_max,
                "plus_reasons": exp_plus or ["Có kinh nghiệm làm việc liên quan."],
                "minus_reasons": exp_minus or ["Không có điểm trừ đáng kể về kinh nghiệm."],
                "summary": f"Đạt {e_earned:.1f} / {e_max:.1f} điểm kinh nghiệm & cấp bậc.",
            },
            "education": {
                "earned_points": ed_earned,
                "max_points": ed_max,
                "plus_reasons": edu_plus or ["Đạt yêu cầu về trình độ học vấn."],
                "minus_reasons": edu_minus or ["Không có điểm trừ về học vấn."],
                "summary": f"Đạt {ed_earned:.1f} / {ed_max:.1f} điểm trình độ học vấn.",
            },
            "other": {
                "earned_points": o_earned,
                "max_points": o_max,
                "plus_reasons": other_plus or ["Đáp ứng chứng chỉ yêu cầu."],
                "minus_reasons": other_minus or ["Không có điểm trừ về chứng chỉ."],
                "summary": f"Đạt {o_earned:.1f} / {o_max:.1f} điểm chứng chỉ & tiêu chí khác.",
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
