from typing import Dict, Any, List
from app.services.matching.summary_generator import SummaryGenerator


class ExplainabilityEngine:
    """
    Translates numeric match metrics, domain compatibility, and final scores 
    into deep, human-like HR Strengths, Gaps, and Diagnostic Summaries.
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

        domain_compat = metrics.get("domain_compatibility", 1.0)
        job_subdomain = metrics.get("job_subdomain", "GENERAL")
        cand_subdomain = metrics.get("cand_subdomain", "GENERAL")

        # -------------------------------------------------------------------------
        # 1. Bối Cảnh Mô Hình Doanh Nghiệp (Domain & Business-Model Context)
        # -------------------------------------------------------------------------
        if domain_compat >= 0.85:
            strengths.append(f"Mô hình kinh nghiệm làm việc rất tương đồng với yêu cầu thực tế của vị trí ({job_title}).")
        elif domain_compat >= 0.55:
            strengths.append("Có tư duy và kỹ năng chuyển giao tốt (Transferable Skills) giữa các phân khúc nghiệp vụ liên quan.")
            gaps.append(f"Có sự khác biệt nhất định về phân khúc mô hình kinh doanh so với vị trí tuyển dụng.")
        else:
            gaps.append(f"Mô hình kinh nghiệm trước đây không tương thích với mô hình hoạt động cốt lõi của vị trí tuyển dụng.")

        # -------------------------------------------------------------------------
        # 2. Giải Trình Kỹ Năng (Skills Explainability)
        # -------------------------------------------------------------------------
        sm = metrics.get("skills", {})
        for m in sm.get("matched", []):
            src = m.get("source", "")
            if "Kỹ năng tương đương" in src:
                strengths.append(f"AI nhận diện kỹ năng '{m['name']}' qua {src}.")
            elif "Kỹ năng chuyển giao" in src:
                strengths.append(f"Có kỹ năng chuyển giao có thể đáp ứng yêu cầu: '{m['name']}'.")
            elif "skills_list" in src:
                if m.get("isMandatory"):
                    strengths.append(f"Thành thạo kỹ năng bắt buộc cốt lõi: '{m['name']}'.")
                else:
                    strengths.append(f"Sở hữu kỹ năng bổ trợ: '{m['name']}'.")
            else:
                strengths.append(f"Kỹ năng '{m['name']}' được chứng minh qua {src}.")

        for m in sm.get("missing", []):
            if m.get("isMandatory"):
                if m.get("transfer_credit", 0.0) > 0:
                    gaps.append(f"Chưa có kỹ năng bắt buộc '{m['name']}' (Mới chỉ có kinh nghiệm chuyển giao một phần).")
                else:
                    gaps.append(f"Thiếu hoàn toàn kỹ năng bắt buộc: '{m['name']}'. Đây là tiêu chí tiên quyết.")
            else:
                gaps.append(f"Chưa thể hiện kỹ năng bổ trợ: '{m['name']}'.")

        # -------------------------------------------------------------------------
        # 3. Giải Trình Kinh Nghiệm & Thâm Niên (Experience & Seniority)
        # -------------------------------------------------------------------------
        em = metrics.get("experience", {})
        total_yrs = em.get("total_years", 0.0)
        req_yrs = em.get("req_years", 0.0)

        if req_yrs > 0:
            if total_yrs >= req_yrs - 0.05:
                strengths.append(f"Tổng thâm niên {total_yrs:.1f} năm đáp ứng hoặc vượt yêu cầu kinh nghiệm ({req_yrs:.1f} năm).")
            else:
                gaps.append(f"Thâm niên tích lũy ({total_yrs:.1f} năm) chưa đạt số năm kinh nghiệm yêu cầu tối thiểu ({req_yrs:.1f} năm). Điểm kinh nghiệm bị trừ tương ứng.")

        if em.get("title_sim", 0.0) >= 0.75 and em.get("best_title"):
            strengths.append(f"Đã từng đảm nhiệm vị trí cấp bậc tương đương hoặc tương đồng ({em['best_title']}).")
        elif em.get("best_title") and "intern" in em.get("best_title", "").lower():
            gaps.append(f"Vị trí công việc gần nhất ({em['best_title']}) ở cấp độ sơ cấp, chưa đạt cấp bậc quản lý/chuyên viên theo yêu cầu.")

        # Dự án thực tế
        pm = em.get("project_metrics", {})
        if pm and pm.get("project_count", 0) > 0:
            if pm.get("skill_app_ratio", 0.0) > 0.5 or pm.get("role_sim", 0.0) > 0.7:
                strengths.append(f"Có năng lực thực tiễn được chứng minh qua {pm['project_count']} dự án chuyên môn liên quan.")

        # -------------------------------------------------------------------------
        # 4. Giải Trình Học Vấn (Education)
        # -------------------------------------------------------------------------
        edm = metrics.get("education", {})
        if edm.get("has_degree"):
            if edm.get("best_sim", 0.0) > 0.7 and edm.get("best_major"):
                strengths.append(f"Chuyên ngành đào tạo ({edm['best_major']}) có sự tương đồng và liên quan cao với vị trí tuyển dụng.")
            elif edm.get("best_major"):
                gaps.append(f"Chuyên ngành tốt nghiệp ({edm['best_major']}) thuộc khối ngành khác so với trọng tâm chuyên môn công việc.")
        else:
            gaps.append("Chưa cung cấp thông tin văn bằng / học vấn.")

        # -------------------------------------------------------------------------
        # 5. Giải Trình Chứng Chỉ (Certificates)
        # -------------------------------------------------------------------------
        om = metrics.get("other", {})
        for cert in om.get("matched", []):
            strengths.append(f"Sở hữu chứng chỉ chuyên môn / ngoại ngữ đạt chuẩn: '{cert}'.")
        for cert in om.get("missing", []):
            gaps.append(f"Chưa có chứng chỉ chuyên môn yêu cầu: '{cert}'.")

        # -------------------------------------------------------------------------
        # 6. Tổng Hợp Báo Cáo Chẩn Đoán (Executive Diagnostic Summary)
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
            "summary": summary
        }

explainability_engine = ExplainabilityEngine()
