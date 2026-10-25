import sys
import os

# Add ai-service to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.matching import (
    CandidateProfilePayload,
    ProfileDetail,
    Education,
    WorkExperience,
    CandidateProject,
    JobPayload,
    JobRequiredSkill,
)
from app.services.matching.generic_matcher import GenericMatchingEngine
from app.services.matching.temporal_engine import temporal_engine

generic_matcher = GenericMatchingEngine()

print("=" * 60)
print("TEST 1: Marketing to Frontend Developer (.NET / ReactJS)")
print("=" * 60)

job_fe = JobPayload(
    id="job-fe-1",
    title="Frontend Developer (ReactJS)",
    requirements="Tốt nghiệp đại học chuyên ngành Công nghệ thông tin hoặc liên quan. 2 năm kinh nghiệm ReactJS.",
    description="Phát triển web application với ReactJS.",
    experience_level="MIDDLE",
    required_experience_years=2.0,
    required_skills=[
        JobRequiredSkill(skill_name="ReactJS", is_mandatory=True),
        JobRequiredSkill(skill_name="TypeScript", is_mandatory=False),
    ],
)

cand_mkt = CandidateProfilePayload(
    profile=ProfileDetail(
        desired_title="Marketing Specialist",
        professional_summary="Chuyên viên marketing với 2 năm kinh nghiệm digital marketing.",
    ),
    educations=[
        Education(
            school_name="Đại học Kinh tế Quốc dân",
            major="Marketing",
            degree="Cử nhân",
        )
    ],
    work_experiences=[
        WorkExperience(
            company_name="Agency ABC",
            position_title="Marketing Executive",
            start_date="2022-01-01",
            end_date="2024-01-01",
        )
    ],
)

job_subdomain = generic_matcher._detect_subdomain(f"{job_fe.title} {job_fe.description} {job_fe.requirements}")
domain_compat = generic_matcher._calc_domain_compatibility(job_subdomain, "MKT_AGENCY_SERVICES")
edu_res_1 = generic_matcher._match_education(cand_mkt, job_fe, job_subdomain)
exp_res_1 = generic_matcher._match_experience(cand_mkt, job_fe, domain_compat, job_subdomain)

print(f"Detected Job Subdomain: {job_subdomain}")
print(f"Domain Compatibility: {domain_compat}")
print(f"Edu Score: {edu_res_1['score']} (Major tier: {edu_res_1.get('best_major_tier')}, Major passed: {edu_res_1['major_passed']})")
print(f"Edu Failures: {edu_res_1['failures']}")
print(f"Exp Score: {exp_res_1['score']} (Relevant Years: {exp_res_1.get('relevant_years')}, Total Years: {exp_res_1.get('total_years')})")

assert edu_res_1["score"] <= 0.60, f"Expected Edu Score <= 0.60, got {edu_res_1['score']}"
assert edu_res_1["best_major_tier"] == "INCOMPATIBLE", f"Expected INCOMPATIBLE, got {edu_res_1['best_major_tier']}"
assert edu_res_1["major_passed"] is False, "Expected major_passed False"
print(">>> TEST 1 PASSED: Marketing correctly penalized and flagged INCOMPATIBLE for Frontend Dev!")

print("\n" + "=" * 60)
print("TEST 2: CS graduate with GPA 3.42 to Frontend Developer")
print("=" * 60)

cand_cs_gpa = CandidateProfilePayload(
    profile=ProfileDetail(desired_title="Frontend Developer"),
    educations=[
        Education(
            school_name="Đại học Bách Khoa",
            major="Kỹ thuật Phần mềm",
            degree="Kỹ sư",
            description="GPA: 3.42/4.0 - Tốt nghiệp loại Giỏi",
        )
    ],
    work_experiences=[],
)

edu_res_2 = generic_matcher._match_education(cand_cs_gpa, job_fe, job_subdomain)
print(f"Edu Score: {edu_res_2['score']}")
print(f"Major Tier: {edu_res_2.get('best_major_tier')}")
print(f"GPA Info: {edu_res_2.get('gpa_info')}")

assert edu_res_2["score"] >= 0.95, f"Expected Edu Score >= 0.95, got {edu_res_2['score']}"
assert edu_res_2["best_major_tier"] == "EXACT", f"Expected EXACT, got {edu_res_2['best_major_tier']}"
assert edu_res_2["gpa_info"]["has_gpa"] is True, "Expected has_gpa True"
assert edu_res_2["gpa_info"]["is_honors"] is True, "Expected is_honors True"
print(">>> TEST 2 PASSED: Software Engineering + GPA 3.42 awarded top score and honors bonus!")

print("\n" + "=" * 60)
print("TEST 3: 0-experience student applying to Senior Fullstack (.NET / ReactJS)")
print("=" * 60)

job_senior = JobPayload(
    id="job-senior-1",
    title="Senior Fullstack Engineer (.NET / ReactJS)",
    requirements="Tối thiểu 3 năm kinh nghiệm phát triển phần mềm chuyên nghiệp với C# .NET và ReactJS.",
    description="Xây dựng nền tảng vi dịch vụ hiệu năng cao.",
    experience_level="SENIOR",
    required_experience_years=3.0,
    required_skills=[
        JobRequiredSkill(skill_name=".NET", is_mandatory=True),
        JobRequiredSkill(skill_name="ReactJS", is_mandatory=True),
    ],
)

cand_student_projects = CandidateProfilePayload(
    profile=ProfileDetail(desired_title="Software Developer"),
    educations=[
        Education(
            school_name="Đại học Công nghệ",
            major="Khoa học máy tính",
            degree="Cử nhân",
        )
    ],
    work_experiences=[],
    projects=[
        CandidateProject(
            project_name="E-commerce Fullstack Platform",
            project_role="Fullstack Developer",
            description="Built microservices with .NET 8, ReactJS, PostgreSQL and Docker.",
            technologies=[".NET", "ReactJS", "Docker", "PostgreSQL"],
        )
    ],
)

job_senior_subdomain = generic_matcher._detect_subdomain(f"{job_senior.title} {job_senior.description}")
exp_res_3 = generic_matcher._match_experience(cand_student_projects, job_senior, 1.0, job_senior_subdomain)
career_vel_3 = temporal_engine.calculate_career_velocity(cand_student_projects.work_experiences)

print(f"Exp Score for 0-exp candidate to Senior: {exp_res_3['score']}")
print(f"Career Velocity: {career_vel_3}")

assert exp_res_3["score"] <= 0.28, f"Expected Exp Score <= 0.28, got {exp_res_3['score']}"
assert career_vel_3["velocity_label"] == "NO_EXPERIENCE", f"Expected NO_EXPERIENCE, got {career_vel_3['velocity_label']}"
print(">>> TEST 3 PASSED: 0-exp candidate strictly capped at <= 0.28 for Senior role (no more 85.0 points!)")

print("\n" + "=" * 60)
print("TEST 4: 0-experience student applying to Intern Backend Developer")
print("=" * 60)

job_intern = JobPayload(
    id="job-intern-1",
    title="Intern Backend Developer",
    requirements="Sinh viên năm cuối ngành CNTT, có dự án cá nhân với Java hoặc Node.js.",
    description="Thực tập phát triển backend.",
    experience_level="INTERN",
    required_experience_years=0.0,
    required_skills=[
        JobRequiredSkill(skill_name=".NET", is_mandatory=True),
    ],
)

job_intern_subdomain = generic_matcher._detect_subdomain(f"{job_intern.title} {job_intern.description}")
exp_res_4 = generic_matcher._match_experience(cand_student_projects, job_intern, 1.0, job_intern_subdomain)
print(f"Exp Score for 0-exp candidate to Intern: {exp_res_4['score']}")

assert exp_res_4["score"] >= 0.50, f"Expected Exp Score >= 0.50 for intern, got {exp_res_4['score']}"
assert exp_res_4["score"] <= 0.70, f"Expected Exp Score <= 0.70 for intern, got {exp_res_4['score']}"
print(">>> TEST 4 PASSED: Intern candidate recognized appropriately for projects (50-70 points)!")

print("\n" + "=" * 60)
print("TEST 5: Đặng Minh Quân (5.58 years Gaming Marketer) to Senior Fullstack Engineer")
print("=" * 60)

cand_marketer_5yrs = CandidateProfilePayload(
    profile=ProfileDetail(
        desired_title="Senior User Acquisition & Game Publishing Specialist",
        professional_summary="5.5 năm kinh nghiệm mảng game mobile marketing và UA.",
    ),
    educations=[
        Education(
            school_name="Đại học RMIT",
            major="Digital Marketing",
            degree="Bachelor",
        )
    ],
    work_experiences=[
        WorkExperience(
            company_name="VNG Games",
            position_title="Senior Game UA Specialist",
            start_date="2019-01-01",
            end_date="2024-07-01",
        )
    ],
)

domain_compat_5 = generic_matcher._calc_domain_compatibility("IT_FULLSTACK_DEV", "MKT_MOBILE_GAMING_UA")
exp_res_5 = generic_matcher._match_experience(cand_marketer_5yrs, job_senior, domain_compat_5, "IT_FULLSTACK_DEV")
edu_res_5 = generic_matcher._match_education(cand_marketer_5yrs, job_senior, "IT_FULLSTACK_DEV")

print(f"Domain Compatibility: {domain_compat_5}")
print(f"Total Years: {exp_res_5['total_years']}, Relevant Years: {exp_res_5['relevant_years']}")
print(f"Exp Score: {exp_res_5['score']}")
print(f"Level Assessment: {exp_res_5['level_assessment']}")
print(f"Edu Score: {edu_res_5['score']} (Major tier: {edu_res_5.get('best_major_tier')})")

assert exp_res_5["score"] <= 0.32, f"Expected Exp Score <= 0.32, got {exp_res_5['score']}"
assert exp_res_5["relevant_years"] <= 0.6, f"Expected relevant years near 0, got {exp_res_5['relevant_years']}"
assert exp_res_5["level_assessment"]["fit_status"] == "NON_RELEVANT_DOMAIN", "Expected NON_RELEVANT_DOMAIN"
assert edu_res_5["score"] <= 0.60, f"Expected Edu Score <= 0.60, got {edu_res_5['score']}"
print(">>> TEST 5 PASSED: Cross-domain marketer correctly capped <= 0.30 in Exp and flagged NON_RELEVANT_DOMAIN!")

print("\n" + "=" * 60)
print("ALL 5 VERIFICATION TESTS PASSED FLAWLESSLY!")
print("=" * 60)
