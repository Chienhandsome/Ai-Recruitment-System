import os
import sys

# Ensure app is discoverable
sys.path.insert(0, os.path.abspath("."))

from app.schemas.matching import (
    CandidateProfilePayload,
    CandidateSkill,
    JobPayload,
    JobRequiredSkill,
    WorkExperience,
    CandidateProject,
)
from app.services.matching.generic_matcher import generic_matching_engine
from app.services.matching.transferable_skills import transferable_skills_engine

print("=" * 60)
print("VERIFYING MULTI-INDUSTRY GUARDRAILS & TRANSFERABILITY FIXES")
print("=" * 60)

# SCENARIO 1: Advantage+ Shopping Campaigns (Meta Ads) vs Tailwind CSS
is_trans, credit, direction, reason = transferable_skills_engine.check_transferable(
    target_skill="Tailwind CSS",
    candidate_skill="Advantage+ Shopping Campaigns (Meta Ads)",
    domain_context="IT_FRONTEND",
)
print(f"\n[Test 1] Meta Ads -> Tailwind CSS:")
print(f"  Transferable: {is_trans}, Credit: {credit}, Reason: {reason}")
assert is_trans is False or credit == 0.0, f"Expected False, got {is_trans} with credit {credit}"
print("  ==> PASSED (Cross-industry false positive blocked!)")


# SCENARIO 2: Java 17 Project -> Python Contextual Inference
proj_profile = CandidateProfilePayload(
    skills=[],  # Candidate has NO Python declared
    projects=[
        CandidateProject(
            project_name="Zola: Real-time Messaging Platform (Microservices)",
            description="Auth Service: Developed authentication flow with JWT/Email OTP. Engineered real-time messaging via WebSockets & Redis Pub/Sub, and built responsive React frontend with MongoDB storage.",
            technologies=["Java 17", "Spring Boot 3", "ReactJS", "TypeScript", "Docker", "Redis", "MongoDB", "PostgreSQL"],
        )
    ],
)
java_job = JobPayload(
    title="Backend Engineer",
    required_skills=[
        JobRequiredSkill(skill_name="Python", is_mandatory=True, minimum_years=1.0)
    ],
)
ctx_score, ctx_text, ctx_source = generic_matching_engine._search_in_context(
    norm_req="python",
    req_name="Python",
    profile=proj_profile,
    job=java_job,
    domain_compat=0.85,
    job_subdom="BACKEND",
)
print(f"\n[Test 2] Java 17 Project -> Python Contextual Search:")
print(f"  Score: {ctx_score}, Source: '{ctx_source}'")
assert ctx_score == 0.0, f"Expected 0.0, got {ctx_score} with source {ctx_source}"
print("  ==> PASSED (Discrete entity hallucination from text blocked!)")


# SCENARIO 3: Spring Boot (0.4 yr) -> Django Peer Transfer
sb_candidate = CandidateProfilePayload(
    skills=[CandidateSkill(skill_name="Spring Boot", proficiency_level="INTERMEDIATE")],
    work_experiences=[
        WorkExperience(
            company_name="Startup",
            position_title="Junior Backend Developer",
            start_date="2023-01-01",
            end_date="2023-05-01",  # Exactly 4 months = 0.33 year (< 1.0 yr)
            description="Developed backend APIs with Spring Boot.",
        )
    ],
)
django_match = transferable_skills_engine.evaluate_best_candidate_skill(
    target_skill="Django",
    target_min_years=2.0,
    target_min_level="INTERMEDIATE",
    candidate_skills=[{"skill_name": "Spring Boot", "proficiency_level": "INTERMEDIATE"}],
    get_level_val_fn=generic_matching_engine._get_level_val,
    calc_skill_years_fn=generic_matching_engine._calculate_skill_years,
    cand_profile=sb_candidate,
    domain_context="BACKEND",
)
print(f"\n[Test 3] Spring Boot (0.4 yr) -> Django Transfer:")
print(f"  Result: {django_match}")
assert django_match is None or not django_match.is_transferable, f"Expected None, got {django_match}"
print("  ==> PASSED (Seniority < 1.0 yr gate blocked premature transfer!)")


# SCENARIO 4: Legitimate Transfer: Vue.js (3.0 yr) -> React
vue_candidate = CandidateProfilePayload(
    skills=[CandidateSkill(skill_name="Vue.js", proficiency_level="ADVANCED")],
    work_experiences=[
        WorkExperience(
            company_name="Digital Agency",
            position_title="Frontend Developer",
            start_date="2020-01-01",
            end_date="2023-01-01",  # 3.0 years
            description="Built web applications using Vue.js and JavaScript.",
        )
    ],
)
react_match = transferable_skills_engine.evaluate_best_candidate_skill(
    target_skill="React",
    target_min_years=2.0,
    target_min_level="INTERMEDIATE",
    candidate_skills=[{"skill_name": "Vue.js", "proficiency_level": "ADVANCED"}],
    get_level_val_fn=generic_matching_engine._get_level_val,
    calc_skill_years_fn=generic_matching_engine._calculate_skill_years,
    cand_profile=vue_candidate,
    domain_context="FRONTEND",
)
print(f"\n[Test 4] Vue.js (3.0 yr) -> React Transfer:")
print(f"  Result: {react_match.source_skill} -> {react_match.target_skill}, Credit: {react_match.credit}, Transferred Years: {react_match.transferred_years}")
assert react_match is not None and react_match.is_transferable, "Expected successful transfer"
assert react_match.credit >= 0.80, f"Expected >= 0.80, got {react_match.credit}"
print("  ==> PASSED (Legitimate peer transfer preserved!)")


# SCENARIO 5: Multi-Industry Transfer: MISA (3.0 yr) -> Bravo (Accounting)
misa_candidate = CandidateProfilePayload(
    skills=[CandidateSkill(skill_name="MISA", proficiency_level="ADVANCED")],
    work_experiences=[
        WorkExperience(
            company_name="Cong ty TNHH Thuong Mai",
            position_title="Ke toan Tong hop",
            start_date="2020-01-01",
            end_date="2023-01-01",  # 3.0 years
            description="Phu trach ke toan thue, quyet toan thue va bao cao tai chinh bang phan mem MISA.",
        )
    ],
)
bravo_match = transferable_skills_engine.evaluate_best_candidate_skill(
    target_skill="Bravo",
    target_min_years=2.0,
    target_min_level="INTERMEDIATE",
    candidate_skills=[{"skill_name": "MISA", "proficiency_level": "ADVANCED"}],
    get_level_val_fn=generic_matching_engine._get_level_val,
    calc_skill_years_fn=generic_matching_engine._calculate_skill_years,
    cand_profile=misa_candidate,
    domain_context="FINANCE_ACCOUNTING",
)
print(f"\n[Test 5] MISA (3.0 yr) -> Bravo Transfer (Accounting):")
print(f"  Result: {bravo_match.source_skill} -> {bravo_match.target_skill}, Credit: {bravo_match.credit}, Transferred Years: {bravo_match.transferred_years}")
assert bravo_match is not None and bravo_match.is_transferable, "Expected successful transfer"
print("  ==> PASSED (Cross-industry Accounting transfer works!)")

print("\n" + "=" * 60)
print("ALL 5 MULTI-INDUSTRY SCENARIOS PASSED WITH 100% ACCURACY!")
print("=" * 60)
