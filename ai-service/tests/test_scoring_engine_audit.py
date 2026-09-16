import pytest
from app.schemas.matching import (
    CandidateCertificate,
    CandidateLanguage,
    CandidateProfilePayload,
    CandidateProject,
    CandidateSkill,
    Education,
    EvaluationRequest,
    JobPayload,
    JobRequiredCertificate,
    JobRequiredLanguage,
    JobRequiredSkill,
    JobWeightsConfig,
    WorkExperience,
)
from app.services.matching.generic_matcher import generic_matching_engine
from app.services.matching.language_matcher import language_matcher
from app.services.matching.score_engine import score_engine


# ==============================================================================
# 1. WEIGHT TESTS (W01 - W06)
# ==============================================================================


def test_w01_standard_weights_40_30_15_15():
    """Case W01: 40 / 30 / 15 / 15 -> valid"""
    req = EvaluationRequest(
        application_id="app-w01",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="Software Engineer"),
        weights=JobWeightsConfig(skills=40, experience=30, education=15, other=15),
    )
    w = score_engine._resolve_weights(req)
    assert w == {"skills": 40.0, "experience": 30.0, "education": 15.0, "other": 15.0}

    match_metrics = {
        "skills": {"score": 1.0, "missing_mandatory": []},
        "experience": {"score": 1.0},
        "education": {"score": 1.0},
        "other": {"score": 1.0},
    }
    res = score_engine.calculate(match_metrics, req)
    assert res["overall_score"] == 100.0


def test_w02_zero_other_weight_40_30_30_0():
    """Case W02: 40 / 30 / 30 / 0 -> otherWeight=0 must stay 0, not become 15"""
    req = EvaluationRequest(
        application_id="app-w02",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="Software Engineer"),
        weights=JobWeightsConfig(skills=40, experience=30, education=30, other=0),
    )
    w = score_engine._resolve_weights(req)
    assert w["other"] == 0.0

    match_metrics = {
        "skills": {"score": 0.8, "missing_mandatory": []},
        "experience": {"score": 0.8},
        "education": {"score": 0.8},
        "other": {"score": 0.0},  # other is 0, but weight is 0
    }
    res = score_engine.calculate(match_metrics, req)
    # Expected: 0.8 * 40 + 0.8 * 30 + 0.8 * 30 + 0.0 * 0 = 32 + 24 + 24 = 80.0
    assert res["overall_score"] == 80.0
    assert res["score_breakdown"]["other"]["max_points"] == 0.0


def test_w03_single_criterion_100_0_0_0():
    """Case W03: 100 / 0 / 0 / 0 -> skills only, others zero"""
    req = EvaluationRequest(
        application_id="app-w03",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="Senior Developer"),
        weights=JobWeightsConfig(skills=100, experience=0, education=0, other=0),
    )
    w = score_engine._resolve_weights(req)
    assert w == {"skills": 100.0, "experience": 0.0, "education": 0.0, "other": 0.0}

    match_metrics = {
        "skills": {"score": 0.9, "missing_mandatory": []},
        "experience": {"score": 0.1},
        "education": {"score": 0.1},
        "other": {"score": 0.1},
    }
    res = score_engine.calculate(match_metrics, req)
    assert res["overall_score"] == 90.0


def test_w04_all_zero_weights():
    """Case W04: 0 / 0 / 0 / 0 -> must not auto-generate defaults, overall score is 0.0"""
    req = EvaluationRequest(
        application_id="app-w04",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="Software Engineer"),
        weights=JobWeightsConfig(skills=0, experience=0, education=0, other=0),
    )
    w = score_engine._resolve_weights(req)
    assert w == {"skills": 0.0, "experience": 0.0, "education": 0.0, "other": 0.0}

    match_metrics = {
        "skills": {"score": 1.0, "missing_mandatory": []},
        "experience": {"score": 1.0},
        "education": {"score": 1.0},
        "other": {"score": 1.0},
    }
    res = score_engine.calculate(match_metrics, req)
    assert res["overall_score"] == 0.0


def test_w05_negative_weight_rejected():
    """Case W05: -10 / 40 / 30 / 40 -> rejected with ValueError"""
    req = EvaluationRequest(
        application_id="app-w05",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="Software Engineer"),
        weights=JobWeightsConfig(skills=-10, experience=40, education=30, other=40),
    )
    with pytest.raises(ValueError, match="Invalid weight"):
        score_engine._resolve_weights(req)


def test_w06_equal_weights_25_25_25_25():
    """Case W06: 25 / 25 / 25 / 25 -> valid"""
    req = EvaluationRequest(
        application_id="app-w06",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="Data Scientist"),
        weights=JobWeightsConfig(skills=25, experience=25, education=25, other=25),
    )
    w = score_engine._resolve_weights(req)
    assert w == {"skills": 25.0, "experience": 25.0, "education": 25.0, "other": 25.0}

    match_metrics = {
        "skills": {"score": 0.8, "missing_mandatory": []},
        "experience": {"score": 0.6, "total_years": 3.0},
        "education": {"score": 0.4},
        "other": {"score": 1.0},
    }
    res = score_engine.calculate(match_metrics, req)
    # 0.8*25 + 0.6*25 + 0.4*25 + 1.0*25 = 20 + 15 + 10 + 25 = 70.0
    assert res["overall_score"] == 70.0


# ==============================================================================
# 2. LANGUAGE ENGINE TESTS (L01 - L06)
# ==============================================================================


def test_l01_english_ielts_exact_pass():
    """Case L01: English IELTS 6.5 vs required 6.5 -> PASS, score 1.0"""
    job = JobPayload(
        title="Account Executive",
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
        ],
    )
    cand = CandidateProfilePayload(
        languages=[CandidateLanguage(language="English", proficiency="IELTS 6.5")]
    )
    res = language_matcher.match(cand, job)
    assert res["mandatory_passed"] is True
    assert res["score"] == 1.0
    assert len(res["failures"]) == 0


def test_l02_english_ielts_exceeds_no_infinite_bonus():
    """Case L02: English IELTS 7.0 vs required 6.5 -> PASS, score 1.0 (no infinite bonus)"""
    job = JobPayload(
        title="Account Executive",
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
        ],
    )
    cand = CandidateProfilePayload(
        languages=[CandidateLanguage(language="English", proficiency="IELTS 7.0")]
    )
    res = language_matcher.match(cand, job)
    assert res["mandatory_passed"] is True
    assert res["score"] == 1.0
    assert len(res["failures"]) == 0


def test_l03_english_ielts_partial_score_mandatory_fail():
    """Case L03: English IELTS 6.0 vs required 6.5 -> partial score (0.92) + Mandatory FAIL"""
    job = JobPayload(
        title="Account Executive",
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
        ],
    )
    cand = CandidateProfilePayload(
        languages=[CandidateLanguage(language="English", proficiency="IELTS 6.0")]
    )
    res = language_matcher.match(cand, job)
    assert res["mandatory_passed"] is False
    assert 0.85 <= res["score"] <= 0.95  # Partial credit
    assert len(res["failures"]) == 1
    assert res["failures"][0]["type"] == "LANGUAGE"
    assert res["failures"][0]["status"] == "FAIL"


def test_l04_english_ielts_low_score_mandatory_fail():
    """Case L04: English IELTS 5.0 vs required 6.5 -> low score (~0.77) + Mandatory FAIL"""
    job = JobPayload(
        title="Account Executive",
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
        ],
    )
    cand = CandidateProfilePayload(
        languages=[CandidateLanguage(language="English", proficiency="IELTS 5.0")]
    )
    res = language_matcher.match(cand, job)
    assert res["mandatory_passed"] is False
    assert 0.70 <= res["score"] <= 0.80
    assert len(res["failures"]) == 1


def test_l05_japanese_vs_english_no_cross_language_semantic_match():
    """Case L05: Japanese JLPT N2 vs English IELTS 6.5 -> English FAIL/MISSING (No semantic blending)"""
    job = JobPayload(
        title="International Sales",
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
        ],
    )
    # Candidate only has Japanese JLPT N2
    cand = CandidateProfilePayload(
        languages=[CandidateLanguage(language="Japanese", proficiency="JLPT N2")]
    )
    res = language_matcher.match(cand, job)
    assert res["mandatory_passed"] is False
    assert res["score"] == 0.0
    assert len(res["failures"]) == 1
    assert res["failures"][0]["candidateValue"] == "Không có / Chưa đạt"


def test_l06_english_without_score_vs_ielts_required():
    """Case L06: Candidate has 'English' without IELTS vs IELTS 6.5 required -> FAIL/MISSING"""
    job = JobPayload(
        title="Content Lead",
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
        ],
    )
    cand = CandidateProfilePayload(
        languages=[CandidateLanguage(language="English", proficiency="Cơ bản")]
    )
    res = language_matcher.match(cand, job)
    assert res["mandatory_passed"] is False
    assert len(res["failures"]) == 1


# ==============================================================================
# 3. EDUCATION TESTS (E01 - E05)
# ==============================================================================


def test_e01_bachelor_marketing_vs_bachelor_marketing():
    """Case E01: Bachelor Marketing vs Bachelor Marketing -> PASS"""
    job = JobPayload(
        title="Marketing Specialist",
        requirements="Yêu cầu bằng Cử nhân chuyên ngành Marketing.",
    )
    cand = CandidateProfilePayload(
        educations=[
            Education(degree="Cử nhân", major="Marketing", school_name="Đại học Kinh tế")
        ]
    )
    res = generic_matching_engine._match_education(cand, job)
    assert res["degree_passed"] is True
    assert res["major_passed"] is True
    assert res["score"] >= 0.85
    assert len(res["failures"]) == 0


def test_e02_master_marketing_vs_bachelor_marketing():
    """Case E02: Master Marketing vs Bachelor Marketing -> PASS (Degree satisfies minimum, no bonus above 1.0)"""
    job = JobPayload(
        title="Marketing Specialist",
        requirements="Yêu cầu bằng Cử nhân chuyên ngành Marketing.",
    )
    cand = CandidateProfilePayload(
        educations=[
            Education(degree="Thạc sĩ", major="Marketing", school_name="RMIT")
        ]
    )
    res = generic_matching_engine._match_education(cand, job)
    assert res["degree_passed"] is True
    assert res["major_passed"] is True
    assert res["score"] >= 0.85
    assert res["score"] <= 1.0
    assert len(res["failures"]) == 0


def test_e03_master_accounting_vs_bachelor_marketing():
    """Case E03: Master Accounting vs Bachelor Marketing -> Degree passes minimum, major relevance fails/low"""
    job = JobPayload(
        title="Marketing Lead",
        requirements="Yêu cầu bằng Cử nhân chuyên ngành Marketing.",
    )
    cand = CandidateProfilePayload(
        educations=[
            Education(degree="Thạc sĩ", major="Kế toán", school_name="Đại học Tài chính")
        ]
    )
    res = generic_matching_engine._match_education(cand, job)
    assert res["degree_passed"] is True
    # Major relevance for Accounting vs Marketing is low
    assert res["best_sim"] < 0.50
    assert res["major_passed"] is False


def test_e04_bachelor_accounting_vs_bachelor_marketing():
    """Case E04: Bachelor Accounting vs Bachelor Marketing -> Low relevance"""
    job = JobPayload(
        title="Brand Manager",
        requirements="Yêu cầu tốt nghiệp Đại học Marketing.",
    )
    cand = CandidateProfilePayload(
        educations=[
            Education(degree="Cử nhân", major="Kế toán doanh nghiệp")
        ]
    )
    res = generic_matching_engine._match_education(cand, job)
    assert res["degree_passed"] is True
    assert res["best_sim"] < 0.50
    assert res["major_passed"] is False


def test_e05_missing_education_not_required():
    """Case E05: Missing education when education is not required -> No mandatory failure"""
    job = JobPayload(
        title="Junior Developer",
        requirements="Tuyển lập trình viên biết viết code React.",
    )
    cand = CandidateProfilePayload(educations=[])
    res = generic_matching_engine._match_education(cand, job)
    assert len(res["failures"]) == 0
    assert res["score"] == 1.0


# ==============================================================================
# 4. CERTIFICATION TESTS (C01 - C05)
# ==============================================================================


def test_c01_exact_certification():
    """Case C01: exact certification -> PASS"""
    job = JobPayload(
        title="Senior Project Manager",
        required_certificates=[JobRequiredCertificate(certificate_name="PMP", is_mandatory=True)],
    )
    cand = CandidateProfilePayload(
        certificates=[CandidateCertificate(certificate_name="PMP")]
    )
    res = generic_matching_engine._match_certificates(cand, job)
    assert res["score"] == 1.0
    assert len(res["failures"]) == 0
    assert "PMP" in res["matched"]


def test_c02_equivalent_certification():
    """Case C02: equivalent certification (ACCA for CPA) -> PASS with equivalence"""
    job = JobPayload(
        title="Chief Accountant",
        required_certificates=[JobRequiredCertificate(certificate_name="CPA", is_mandatory=True)],
    )
    cand = CandidateProfilePayload(
        certificates=[CandidateCertificate(certificate_name="ACCA")]
    )
    res = generic_matching_engine._match_certificates(cand, job)
    assert res["score"] >= 0.90
    assert len(res["failures"]) == 0


def test_c03_related_not_automatic_pass():
    """Case C03: related but not equivalent -> RELATED, mandatory FAIL if mandatory cert required"""
    job = JobPayload(
        title="Chief Accountant",
        required_certificates=[JobRequiredCertificate(certificate_name="CPA", is_mandatory=True)],
    )
    cand = CandidateProfilePayload(
        certificates=[CandidateCertificate(certificate_name="Chứng chỉ Kế toán tổng hợp")]
    )
    res = generic_matching_engine._match_certificates(cand, job)
    assert res["score"] < 0.80
    assert len(res["failures"]) == 1


def test_c04_unrelated_certification():
    """Case C04: unrelated certification (Google Digital Marketing vs CPA) -> UNRELATED, score 0.0"""
    job = JobPayload(
        title="Audit Manager",
        required_certificates=[JobRequiredCertificate(certificate_name="CPA", is_mandatory=True)],
    )
    cand = CandidateProfilePayload(
        certificates=[CandidateCertificate(certificate_name="Google Digital Marketing")]
    )
    res = generic_matching_engine._match_certificates(cand, job)
    assert res["score"] == 0.0
    assert len(res["failures"]) == 1
    assert "CPA" in res["missing"]


def test_c05_missing_mandatory_certification():
    """Case C05: missing mandatory certification -> score 0.0, mandatory FAIL"""
    job = JobPayload(
        title="AWS Cloud Engineer",
        required_certificates=[
            JobRequiredCertificate(certificate_name="AWS Certified Solutions Architect", is_mandatory=True)
        ],
    )
    cand = CandidateProfilePayload(certificates=[])
    res = generic_matching_engine._match_certificates(cand, job)
    assert res["score"] == 0.0
    assert len(res["failures"]) == 1


# ==============================================================================
# 5. MANDATORY & WEIGHT INDEPENDENCE TESTS (M01 - M04)
# ==============================================================================


def test_m01_high_score_with_mandatory_fail():
    """Case M01: High overall matching score (e.g. 86.0) but fails mandatory requirement -> mandatoryStatus = FAIL"""
    req = EvaluationRequest(
        application_id="app-m01",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(
            title="Senior Engineer",
            required_languages=[
                JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
            ],
        ),
        weights=JobWeightsConfig(skills=40, experience=30, education=15, other=15),
    )
    match_metrics = {
        "skills": {"score": 0.90, "missing_mandatory": []},
        "experience": {"score": 0.90},
        "education": {"score": 0.90},
        "other": {
            "score": 0.60,
            "language": {
                "failures": [
                    {
                        "type": "LANGUAGE",
                        "requirement": "IELTS >= 6.5",
                        "candidateValue": "IELTS 6.0",
                        "status": "FAIL",
                        "reason": "Yêu cầu IELTS 6.5, ứng viên đạt 6.0.",
                    }
                ]
            },
            "certificates": {"failures": []},
        },
    }
    res = score_engine.calculate(match_metrics, req)
    # Final score = 0.90*40 + 0.90*30 + 0.90*15 + 0.60*15 = 36 + 27 + 13.5 + 9 = 85.5
    assert res["overall_score"] == 85.5
    # Mandatory status MUST be FAIL regardless of high score!
    assert res["mandatory_status"] == "FAIL"
    assert len(res["mandatory_failures"]) == 1
    assert res["mandatory_failures"][0]["type"] == "LANGUAGE"


def test_m02_low_score_with_mandatory_pass():
    """Case M02: Low overall matching score (e.g. 52.0) but all mandatory requirements met -> mandatoryStatus = PASS"""
    req = EvaluationRequest(
        application_id="app-m02",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(
            title="Junior Engineer",
            required_languages=[
                JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True)
            ],
        ),
        weights=JobWeightsConfig(skills=40, experience=30, education=15, other=15),
    )
    match_metrics = {
        "skills": {"score": 0.40, "missing_mandatory": []},
        "experience": {"score": 0.40},
        "education": {"score": 0.40},
        "other": {
            "score": 1.0,
            "language": {"failures": []},
            "certificates": {"failures": []},
        },
    }
    res = score_engine.calculate(match_metrics, req)
    assert res["overall_score"] == 49.0
    assert res["mandatory_status"] == "PASS"
    assert len(res["mandatory_failures"]) == 0


def test_m03_weight_0_mandatory_true_missing():
    """Case M03: Weight = 0% + Mandatory = True + Missing requirement -> Score unaffected, mandatoryStatus = FAIL"""
    req = EvaluationRequest(
        application_id="app-m03",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(
            title="Backend Dev",
            required_certificates=[
                JobRequiredCertificate(certificate_name="CPA", is_mandatory=True)
            ],
        ),
        weights=JobWeightsConfig(skills=50, experience=30, education=20, other=0),
    )
    match_metrics = {
        "skills": {"score": 1.0, "missing_mandatory": []},
        "experience": {"score": 1.0},
        "education": {"score": 1.0},
        "other": {
            "score": 0.0,
            "certificates": {
                "failures": [
                    {
                        "type": "CERTIFICATE",
                        "requirement": "CPA",
                        "status": "FAIL",
                        "reason": "Thiếu CPA",
                    }
                ]
            },
        },
    }
    res = score_engine.calculate(match_metrics, req)
    # Score is unaffected because weight=0 (1.0*50 + 1.0*30 + 1.0*20 + 0*0 = 100.0)
    assert res["overall_score"] == 100.0
    # Mandatory requirement was NOT ignored just because weight is 0!
    assert res["mandatory_status"] == "FAIL"


def test_m04_weight_0_mandatory_false():
    """Case M04: Weight = 0% + Mandatory = False -> No score contribution, no mandatory failure"""
    req = EvaluationRequest(
        application_id="app-m04",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(
            title="Sales Rep",
            required_certificates=[
                JobRequiredCertificate(certificate_name="Optional Cert", is_mandatory=False)
            ],
        ),
        weights=JobWeightsConfig(skills=50, experience=30, education=20, other=0),
    )
    match_metrics = {
        "skills": {"score": 0.8, "missing_mandatory": []},
        "experience": {"score": 0.8},
        "education": {"score": 0.8},
        "other": {
            "score": 0.0,
            "certificates": {"failures": []},
        },
    }
    res = score_engine.calculate(match_metrics, req)
    assert res["mandatory_status"] in ("PASS", "NOT_APPLICABLE")
    assert len(res["mandatory_failures"]) == 0


# ==============================================================================
# 6. DOUBLE COUNTING & DOMAIN TESTS (D01 - D02)
# ==============================================================================


def test_d01_skill_years_no_double_counting_overlapping_intervals():
    """Case D01: Overlapping work experience and project intervals must be unioned, not summed twice"""
    cand = CandidateProfilePayload(
        work_experiences=[
            WorkExperience(
                position_title="Frontend Developer",
                company_name="Tech Corp",
                start_date="2023-01-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Built web applications using React and Next.js",
            )
        ],
        projects=[
            CandidateProject(
                project_name="E-Commerce App",
                technologies=["React", "TypeScript"],
                start_date="2023-06-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Built React front-end store during employment at Tech Corp",
            )
        ],
    )
    skill_years = generic_matching_engine._calculate_skill_years("React", cand)
    # Total calendar duration from 2023-01-01 to 2023-12-31 is exactly 1.0 year (365 days).
    # Without interval union, it would sum 12 months + 7 months = 19 months (1.6 years)!
    assert skill_years == 1.0


def test_d02_exact_skill_match_not_penalized_by_domain_compat():
    """Case D02: Exact skill match must not be penalized by domain compatibility"""
    job = JobPayload(
        title="Healthcare IT Engineer",
        required_skills=[
            JobRequiredSkill(
                skill_name="PostgreSQL",
                is_mandatory=True,
                minimum_level="BEGINNER",
            )
        ],
    )
    cand = CandidateProfilePayload(
        skills=[
            CandidateSkill(
                skill_name="PostgreSQL",
                proficiency_level="INTERMEDIATE",
            )
        ]
    )
    # Pass domain_compat = 0.40 (low domain compatibility between candidate and job)
    res = generic_matching_engine._match_skills(cand, job, domain_compat=0.40)
    # The exact match should receive full score (1.0), not 1.0 * (0.5 + 0.5 * 0.4) = 0.70!
    assert res["score"] == 1.0
