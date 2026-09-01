from app.services.matching.matching_engine import matching_engine
from app.schemas.matching import (
    EvaluationRequest, JobPayload, CandidateProfilePayload,
    JobRequiredSkill, WorkExperience, Education, CandidateSkill, ProfileDetail
)

job = JobPayload(
    title="Quản Lý Kinh Doanh Khu Vực (Area Sales Manager - ASM)",
    description="Chịu trách nhiệm toàn diện về doanh số và thị phần ngành hàng FMCG/F&B. Quản lý hệ thống Nhà phân phối (NPP), đại lý và kênh Horeca/Foodservice.",
    requirements="Ít nhất 5 năm kinh nghiệm quản lý kinh doanh khu vực ngành FMCG/F&B. Tốt nghiệp Đại học.",
    experience_level="MANAGER",
    required_experience_years=5.0,
    required_skills=[
        JobRequiredSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn (Sales Team Management & Territory Leadership)", is_mandatory=True, minimum_years=5.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý (Distributor & Channel Management)", is_mandatory=True, minimum_years=4.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo (Sales Target & Revenue Forecasting)", is_mandatory=True, minimum_years=4.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Khai thác Thị trường Horeca & Foodservice (Horeca & Foodservice Market Penetration)", is_mandatory=True, minimum_years=3.0, minimum_level="INTERMEDIATE"),
        JobRequiredSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account (Commercial Negotiation & Key Accounts)", is_mandatory=True, minimum_years=4.0, minimum_level="ADVANCED"),
        JobRequiredSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng (Sales Coaching & Field Training)", is_mandatory=False, minimum_years=3.0, minimum_level="INTERMEDIATE"),
        JobRequiredSkill(skill_name="Phân tích Thị trường & Nghiên cứu Đối thủ (Market Analysis & Competitor Intelligence)", is_mandatory=False, minimum_years=2.0, minimum_level="INTERMEDIATE"),
        JobRequiredSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực (Area Business Planning & Execution)", is_mandatory=False, minimum_years=3.0, minimum_level="ADVANCED")
    ]
)

# Test UV-01: Vũ Minh Đức
c1 = CandidateProfilePayload(
    profile=ProfileDetail(
        desired_title="Area Sales Manager (ASM) - FMCG",
        professional_summary="Hơn 11 năm kinh nghiệm quản lý kinh doanh ngành hàng tiêu dùng nhanh (FMCG) và F&B. 7 năm giữ vị trí Area Sales Manager quản lý địa bàn Đông Nam Bộ với 24 nhân sự."
    ),
    skills=[
        CandidateSkill(skill_name="Quản lý Đội ngũ Sales & Giám sát Địa bàn", proficiency_level="EXPERT"),
        CandidateSkill(skill_name="Phát triển Mạng lưới Nhà phân phối & Đại lý", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Quản trị Doanh số & Hoạch định Dự báo", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Khai thác Thị trường Horeca & Foodservice", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Đàm phán Điều khoản Thương mại & Key Account", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Huấn luyện & Phát triển Năng lực Bán hàng", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Phân tích Thị trường & Nghiên cứu Đối thủ", proficiency_level="ADVANCED"),
        CandidateSkill(skill_name="Hoạch định Chiến lược Kinh doanh Khu vực", proficiency_level="ADVANCED"),
    ],
    work_experiences=[
        WorkExperience(
            company_name="Tập đoàn Masan Consumer",
            position_title="Area Sales Manager (Quản lý Kinh doanh Khu vực Đông Nam Bộ)",
            start_date="2019-01-01",
            is_current=True,
            description="Quản lý toàn diện hoạt động kinh doanh ngành hàng thực phẩm & gia vị tại Đồng Nai, Bình Dương, Bà Rịa - Vũng Tàu. Lãnh đạo trực tiếp đội ngũ 24 nhân sự gồm 4 Sales Supervisors và 20 Sales Representatives. Phát triển và quản trị mạng lưới 8 Nhà phân phối cấp 1 và hơn 450 điểm bán lẻ/Horeca.",
            achievements="Đạt 115% chỉ tiêu doanh số năm 2023 với doanh thu 130 tỷ VND. Mở rộng thêm 2 NPP cấp 1 mới và tăng độ phủ kênh Horeca lên 35%."
        ),
        WorkExperience(
            company_name="Suntory PepsiCo Vietnam Beverage",
            position_title="Sales Supervisor (Giám sát Bán hàng Khu vực TP.HCM)",
            start_date="2015-06-01",
            end_date="2018-12-31",
            description="Giám sát đội ngũ 12 Sales Reps kênh General Trade (GT) tại khu vực TP.HCM. Đào tạo kỹ năng bán hàng thực địa, theo dõi tồn kho và thúc đẩy sell-out.",
            achievements="Đạt giải Giám sát Bán hàng Xuất sắc nhất vùng Đông Nam Bộ năm 2017."
        )
    ],
    educations=[
        Education(school_name="Đại học Kinh tế TP.HCM (UEH)", degree="Cử nhân", major="Quản trị Kinh doanh Thương mại (Business Administration)", graduation_year=2014)
    ]
)

req1 = EvaluationRequest(job=job, candidate_profile=c1, application_id="test-uv-1")
res1 = matching_engine.evaluate(req1)
print("=== UV-01 RESULTS ===")
print("Overall Score:", res1.overall_score, "| Match Level:", res1.match_level)
print("Breakdown: Skills=", res1.skills_score, "Exp=", res1.experience_score, "Edu=", res1.education_score)
print("Missing Required Skills:", res1.missing_required_skills)
print("Matched Skills Count:", len(res1.matched_skills or []))
print("Job Subdomain:", res1.score_breakdown.get("job_subdomain") if hasattr(res1, "score_breakdown") else "N/A")
print("Summary:", res1.reasoning_summary)
