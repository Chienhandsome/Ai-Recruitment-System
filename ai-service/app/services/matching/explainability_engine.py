from typing import Dict, Any, List
# pyrefly: ignore [missing-import]
from app.services.matching.summary_generator import SummaryGenerator

class ExplainabilityEngine:
    """
    Translates numeric match metrics and final scores into human-readable 
    Strengths, Gaps, and Executive Summaries.
    """
    
    def explain(self, metrics: Dict[str, Any], scores: Dict[str, float], candidate_name: str, job_title: str) -> Dict[str, Any]:
        strengths = []
        gaps = []
        
        # 1. Skills Explainability
        sm = metrics["skills"]
        for m in sm["matched"]:
            # Only list top a few matched as strengths if not evidence
            if m.get("source") != "skills_list":
                strengths.append(f"AI nhận diện kỹ năng '{m['name']}' qua {m['source']}.")
            elif m["isMandatory"]:
                strengths.append(f"Thành thạo kỹ năng bắt buộc: {m['name']}.")
                
        for m in sm["missing"]:
            if m["isMandatory"]:
                if m.get("transfer_credit", 0.0) > 0:
                    gaps.append(f"Chưa có kỹ năng bắt buộc '{m['name']}' (Có kỹ năng miền tương đương).")
                else:
                    gaps.append(f"Thiếu hoàn toàn kỹ năng bắt buộc: '{m['name']}'.")
            else:
                gaps.append(f"Thiếu kỹ năng bổ trợ: '{m['name']}'.")
                
        # 2. Experience Explainability
        em = metrics["experience"]
        if em["req_years"] > 0:
            if em["total_years"] >= em["req_years"] - 0.05:
                strengths.append(f"Kinh nghiệm làm việc {em['total_years']:.1f} năm đáp ứng yêu cầu ({em['req_years']} năm).")
            else:
                gaps.append(f"Kinh nghiệm {em['total_years']:.1f} năm chưa đạt số năm yêu cầu ({em['req_years']} năm).")
        if em["title_sim"] >= 0.7 and em.get("best_title"):
            strengths.append(f"Đã từng đảm nhiệm vị trí tương đồng ({em['best_title']}).")
            
        # Incorporate project evaluation into experience
        pm = em.get("project_metrics", {})
        if pm and pm.get("project_count", 0) > 0:
            if pm.get("skill_app_ratio", 0.0) > 0.5 or pm.get("role_sim", 0.0) > 0.7:
                strengths.append(f"Có kinh nghiệm thực tiễn qua {pm['project_count']} dự án liên quan đến chuyên môn.")
            else:
                gaps.append("Nội dung dự án thực tế chưa thể hiện rõ sự tương đồng với yêu cầu JD.")
            
        # 3. Education Explainability
        edm = metrics["education"]
        if edm["has_degree"]:
            if edm["best_sim"] > 0.6 and edm.get("best_major"):
                strengths.append(f"Chuyên ngành đào tạo ({edm['best_major']}) phù hợp cao với yêu cầu công việc.")
            else:
                gaps.append("Chuyên ngành đào tạo khác biệt so với trọng tâm công việc.")
        else:
            gaps.append("Chưa cung cấp thông tin Học vấn.")
            
        # 4. Certificates / Foreign Languages Explainability
        om = metrics["other"]
        for cert in om.get("matched", []):
            strengths.append(f"Có chứng chỉ/ngoại ngữ yêu cầu: {cert}.")
        for cert in om.get("missing", []):
            gaps.append(f"Thiếu chứng chỉ/ngoại ngữ yêu cầu: {cert}.")
            
        # 5. Generate Summary
        summary = SummaryGenerator.generate_summary(
            candidate_name=candidate_name,
            job_title=job_title,
            overall_score=scores["overall_score"],
            match_level=scores["match_level"],
            skills_score=scores["skills_score"],
            experience_score=scores["experience_score"],
            education_score=scores["education_score"],
            other_score=scores["other_score"],
            missing_required_skills=sm["missing_mandatory"],
            strengths=strengths,
            gaps=gaps
        )
        
        return {
            "strengths": strengths,
            "gaps": gaps,
            "summary": summary
        }

explainability_engine = ExplainabilityEngine()
