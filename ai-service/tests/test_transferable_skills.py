"""
Test Suite: test_transferable_skills.py
Comprehensive testing for Directed Transferable Skills Engine:
1. Asymmetric transfer rules (Downward vs Upward vs Peer).
2. Token boundary matching protection against false positives.
3. Experience years inheritance.
4. Optimal source skill selection.
5. End-to-end matching engine integration.
"""

from datetime import datetime, timezone
import pytest

from app.schemas.matching import (
    CandidateProfilePayload,
    CandidateSkill,
    EvaluationRequest,
    JobPayload,
    JobRequiredSkill,
    JobWeightsConfig,
    WorkExperience,
)
from app.services.matching.generic_matcher import generic_matching_engine
from app.services.matching.matching_engine import matching_engine
from app.services.matching.transferable_skills import (
    TransferDirection,
    transferable_skills_engine,
)


# ==============================================================================
# 1. ASYMMETRIC TRANSFER DIRECTED TESTS
# ==============================================================================


def test_asymmetric_docker_vs_kubernetes():
    """
    Kubernetes -> Docker: Downward transfer (0.95 credit).
    Docker -> Kubernetes: Upward transfer (0.65 credit).
    """
    # Candidate knows K8s, JD asks Docker (Downward)
    is_down, credit_down, dir_down, _ = transferable_skills_engine.check_transferable(
        target_skill="Docker", candidate_skill="Kubernetes"
    )
    assert is_down is True
    assert credit_down == 0.95
    assert dir_down == TransferDirection.DOWNWARD

    # Candidate knows Docker, JD asks Kubernetes (Upward)
    is_up, credit_up, dir_up, _ = transferable_skills_engine.check_transferable(
        target_skill="Kubernetes", candidate_skill="Docker"
    )
    assert is_up is True
    assert credit_up == 0.65
    assert dir_up == TransferDirection.UPWARD
    assert credit_down > credit_up


def test_asymmetric_typescript_vs_javascript():
    """
    TypeScript -> JavaScript: Downward transfer (0.95).
    JavaScript -> TypeScript: Upward transfer (0.70).
    """
    is_down, credit_down, dir_down, _ = transferable_skills_engine.check_transferable(
        target_skill="JavaScript", candidate_skill="TypeScript"
    )
    assert is_down is True
    assert credit_down >= 0.95
    assert dir_down == TransferDirection.DOWNWARD

    is_up, credit_up, dir_up, _ = transferable_skills_engine.check_transferable(
        target_skill="TypeScript", candidate_skill="JavaScript"
    )
    assert is_up is True
    assert credit_up == 0.70
    assert dir_up == TransferDirection.UPWARD


def test_asymmetric_c_cpp_vs_python():
    """
    C/C++ -> Python: Downward transfer (0.90).
    Python -> C/C++: Upward transfer (0.50).
    """
    is_down, credit_down, dir_down, _ = transferable_skills_engine.check_transferable(
        target_skill="Python", candidate_skill="C++"
    )
    assert is_down is True
    assert credit_down == 0.90

    is_up, credit_up, dir_up, _ = transferable_skills_engine.check_transferable(
        target_skill="C++", candidate_skill="Python"
    )
    assert is_up is True
    assert credit_up == 0.50


def test_asymmetric_sap_vs_misa():
    """
    SAP -> MISA: Downward transfer (0.95).
    MISA -> SAP: Upward transfer (0.65).
    """
    is_down, credit_down, _, _ = transferable_skills_engine.check_transferable(
        target_skill="MISA", candidate_skill="SAP ERP"
    )
    assert is_down is True
    assert credit_down >= 0.95

    is_up, credit_up, _, _ = transferable_skills_engine.check_transferable(
        target_skill="SAP FICO", candidate_skill="MISA"
    )
    assert is_up is True
    assert credit_up == 0.65


def test_peer_transfer_frameworks():
    """React <-> Vue: Peer transfer (0.85)."""
    is_trans, credit, direction, _ = transferable_skills_engine.check_transferable(
        target_skill="Vue", candidate_skill="React"
    )
    assert is_trans is True
    assert credit == 0.85
    assert direction == TransferDirection.PEER


# ==============================================================================
# 2. TOKEN BOUNDARY SAFETY TESTS (NO SUBSTRING COLLISION)
# ==============================================================================


def test_token_boundary_safety_go():
    """'Go-to-market Strategy' should NOT falsely match Golang."""
    is_trans, credit, _, _ = transferable_skills_engine.check_transferable(
        target_skill="FastAPI", candidate_skill="Go-to-market Strategy"
    )
    assert is_trans is False
    assert credit == 0.0


def test_token_boundary_safety_arm():
    """'Farm Management' should NOT falsely match ARM microcontrollers."""
    is_trans, credit, _, _ = transferable_skills_engine.check_transferable(
        target_skill="STM32", candidate_skill="Farm Management"
    )
    assert is_trans is False
    assert credit == 0.0


def test_token_boundary_safety_fast():
    """'Fast Fashion Marketing' should NOT falsely match Fast accounting software."""
    is_trans, credit, _, _ = transferable_skills_engine.check_transferable(
        target_skill="MISA", candidate_skill="Fast Fashion Marketing"
    )
    assert is_trans is False
    assert credit == 0.0


# ==============================================================================
# 3. EXPERIENCE YEARS INHERITANCE
# ==============================================================================


def test_experience_years_inheritance_formula():
    """Calculates proportional experience: min(src_years, round(src_years * credit, 1))."""
    # 4 years Docker transferring to K8s (credit 0.65) -> 4.0 * 0.65 = 2.6 years
    trans_years = transferable_skills_engine.calculate_transferred_experience(4.0, 0.65)
    assert trans_years == 2.6

    # 3 years K8s transferring to Docker (credit 0.95) -> 3.0 * 0.95 = 2.85 -> 2.8 (Python round-to-even)
    trans_years_down = transferable_skills_engine.calculate_transferred_experience(3.0, 0.95)
    assert trans_years_down == 2.8

    # 0 years -> 0
    assert transferable_skills_engine.calculate_transferred_experience(0.0, 0.85) == 0.0


# ==============================================================================
# 4. OPTIMAL SOURCE CANDIDATE SELECTION
# ==============================================================================


def test_evaluate_best_candidate_skill_selection():
    """When candidate has both Docker and Kubernetes, K8s is preferred for containerization."""
    cand_skills = [
        CandidateSkill(skill_name="Docker", proficiency_level="INTERMEDIATE"),
        CandidateSkill(skill_name="Kubernetes", proficiency_level="ADVANCED"),
    ]
    cand_profile = CandidateProfilePayload(
        skills=cand_skills,
        work_experiences=[
            WorkExperience(
                company_name="Tech Corp",
                position_title="DevOps Engineer",
                start_date="2020-01-01",
                end_date="2024-01-01",
                description="Deployed microservices on Kubernetes cluster and Docker containers.",
            )
        ],
    )

    best_match = transferable_skills_engine.evaluate_best_candidate_skill(
        target_skill="Docker",
        target_min_years=2.0,
        target_min_level="INTERMEDIATE",
        candidate_skills=cand_skills,
        get_level_val_fn=generic_matching_engine._get_level_val,
        calc_skill_years_fn=generic_matching_engine._calculate_skill_years,
        cand_profile=cand_profile,
    )
    assert best_match is not None
    assert best_match.is_transferable is True
    assert best_match.credit == 0.95
    assert best_match.source_skill == "Kubernetes"
    assert best_match.transferred_years > 0.0


# ==============================================================================
# 5. END-TO-END MATCHING PIPELINE INTEGRATION
# ==============================================================================


def test_full_pipeline_transferable_skill_evaluation():
    """
    Candidate with 4 years Docker applying for JD requiring Kubernetes (3 years, mandatory).
    Verifies:
    1. Skill is matched via transferable skill.
    2. Transferred years are inherited (approx 2.6 years).
    3. Evidence contains percentage and source skill.
    4. Explanations and summary are generated smoothly.
    """
    req = EvaluationRequest(
        application_id="app-trans-test-01",
        candidate_profile=CandidateProfilePayload(
            skills=[
                CandidateSkill(skill_name="Docker", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Linux", proficiency_level="INTERMEDIATE"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Cloud Corp",
                    position_title="DevOps Engineer",
                    start_date="2020-01-01",
                    end_date="2024-01-01",
                    description="Designed and maintained multi-service Docker container architectures.",
                )
            ],
        ),
        job=JobPayload(
            title="Senior DevOps Engineer",
            required_skills=[
                JobRequiredSkill(
                    skill_name="Kubernetes",
                    is_mandatory=True,
                    minimum_years=3.0,
                    minimum_level="INTERMEDIATE",
                ),
            ],
            required_experience_years=3.0,
        ),
        weights=JobWeightsConfig(skills=40, experience=30, education=15, other=15),
    )

    raw_metrics = generic_matching_engine.evaluate(req.candidate_profile, req.job)
    assert raw_metrics is not None

    # Check that skills matched includes Kubernetes
    matched_skills = raw_metrics["skills"].get("matched", [])
    k8s_match = next((s for s in matched_skills if s.get("name") == "Kubernetes"), None)
    assert k8s_match is not None
    assert "Kỹ năng chuyển giao: Docker" in k8s_match.get("source", "")
    assert k8s_match.get("actual_years", 0.0) > 0.0

    # Check evidence list
    evidences = raw_metrics["skills"].get("evidence", [])
    k8s_ev = next((e for e in evidences if e.get("skillName") == "Kubernetes"), None)
    assert k8s_ev is not None
    assert "Docker" in k8s_ev.get("evidenceText", "")
    assert "Tương thích: 65%" in k8s_ev.get("evidenceText", "")

    # Run overall matching engine pipeline
    response = matching_engine.evaluate(req)
    assert response is not None
    assert response.overall_score > 0.0
    assert any("Kubernetes" in st for st in response.strengths)


# ==============================================================================
# 6. MULTI-INDUSTRY TRANSFERABLE SKILLS & 3-TIER GATE VERIFICATION
# ==============================================================================


def test_multi_industry_hospitality_opera_to_smile():
    """
    Hospitality Industry:
    - Opera PMS -> Smile PMS: Downward transfer (0.95 credit).
      Qualifies for CONDITIONAL_PASS on mandatory requirement.
    - Smile PMS -> Opera PMS: Upward transfer (0.65 credit).
      Fails mandatory requirement (FAIL).
    """
    # 1. Opera -> Smile PMS (CONDITIONAL_PASS)
    req_down = EvaluationRequest(
        application_id="app-hosp-01",
        candidate_profile=CandidateProfilePayload(
            skills=[CandidateSkill(skill_name="Opera PMS", proficiency_level="ADVANCED")],
            work_experiences=[
                WorkExperience(
                    company_name="Marriott Resort",
                    position_title="Front Office Supervisor",
                    start_date="2020-01-01",
                    end_date="2023-01-01",
                    description="Managed front office operations using Opera PMS, guest reservations, check-in/out.",
                )
            ],
        ),
        job=JobPayload(
            title="Trưởng bộ phận Tiền sảnh Khách sạn",
            required_skills=[
                JobRequiredSkill(
                    skill_name="Smile PMS",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                )
            ],
            required_experience_years=2.0,
        ),
    )
    res_down = matching_engine.evaluate(req_down)
    assert res_down.mandatory_status == "CONDITIONAL_PASS"
    assert res_down.match_level == "HIGH"
    assert res_down.overall_score <= 88.0
    assert "CHUYỂN GIAO NĂNG LỰC" in res_down.summary

    # 2. Smile PMS -> Opera PMS (FAIL - Upward transfer cannot pass mandatory gate)
    req_up = EvaluationRequest(
        application_id="app-hosp-02",
        candidate_profile=CandidateProfilePayload(
            skills=[CandidateSkill(skill_name="Smile PMS", proficiency_level="INTERMEDIATE")],
            work_experiences=[
                WorkExperience(
                    company_name="Boutique Hotel",
                    position_title="Lễ tân",
                    start_date="2021-01-01",
                    end_date="2023-01-01",
                    description="Thực hiện thủ tục check-in check-out trên hệ thống Smile PMS.",
                )
            ],
        ),
        job=JobPayload(
            title="Front Office Manager 5-Star Hotel",
            required_skills=[
                JobRequiredSkill(
                    skill_name="Opera PMS",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="ADVANCED",
                )
            ],
            required_experience_years=2.0,
        ),
    )
    res_up = matching_engine.evaluate(req_up)
    assert res_up.mandatory_status == "FAIL"
    assert any(f.get("requirement") == "Opera PMS" for f in res_up.mandatory_failures)


def test_multi_industry_data_bi_peer_transfer():
    """
    Data Analytics & BI Industry:
    Tableau -> Power BI: Peer transfer (0.85 credit).
    Candidate with 3 years Tableau satisfies mandatory 2 years Power BI -> CONDITIONAL_PASS.
    """
    req = EvaluationRequest(
        application_id="app-data-01",
        candidate_profile=CandidateProfilePayload(
            skills=[
                CandidateSkill(skill_name="Tableau", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="SQL", proficiency_level="ADVANCED"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Fintech Corp",
                    position_title="BI Analyst",
                    start_date="2020-01-01",
                    end_date="2023-06-01",
                    description="Built enterprise executive dashboards and complex SQL models using Tableau.",
                )
            ],
        ),
        job=JobPayload(
            title="Senior BI Analyst (Power BI)",
            required_skills=[
                JobRequiredSkill(
                    skill_name="Power BI",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                ),
                JobRequiredSkill(
                    skill_name="SQL",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                ),
            ],
            required_experience_years=2.0,
        ),
    )
    res = matching_engine.evaluate(req)
    assert res.mandatory_status == "CONDITIONAL_PASS"
    assert res.match_level == "HIGH"
    assert res.overall_score <= 88.0


def test_multi_industry_hr_peer_transfer():
    """
    Human Resources Industry:
    Base HRM -> 1Office: Peer transfer (0.90 credit).
    Candidate with 3 years Base HRM satisfies mandatory 1Office -> CONDITIONAL_PASS.
    """
    req = EvaluationRequest(
        application_id="app-hr-01",
        candidate_profile=CandidateProfilePayload(
            skills=[
                CandidateSkill(skill_name="Base HRM", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Tuyển dụng", proficiency_level="ADVANCED"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="Retail Group",
                    position_title="Chuyên viên Tuyển dụng & Vận hành C&B",
                    start_date="2020-01-01",
                    end_date="2023-01-01",
                    description="Quản trị dữ liệu nhân sự, chấm công và tuyển dụng trên phần mềm Base HRM.",
                )
            ],
        ),
        job=JobPayload(
            title="Chuyên viên Nhân sự Tổng hợp",
            required_skills=[
                JobRequiredSkill(
                    skill_name="1Office",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                ),
                JobRequiredSkill(
                    skill_name="Tuyển dụng",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                ),
            ],
            required_experience_years=2.0,
        ),
    )
    res = matching_engine.evaluate(req)
    assert res.mandatory_status == "CONDITIONAL_PASS"
    assert res.match_level == "HIGH"


def test_multi_industry_engineering_solidworks_to_autocad():
    """
    Mechanical Engineering & CAD Industry:
    SolidWorks (3D CAD) -> AutoCAD (2D CAD): Downward transfer (0.95 credit).
    Candidate with SolidWorks satisfies mandatory AutoCAD -> CONDITIONAL_PASS.
    """
    req = EvaluationRequest(
        application_id="app-eng-01",
        candidate_profile=CandidateProfilePayload(
            skills=[CandidateSkill(skill_name="SolidWorks", proficiency_level="ADVANCED")],
            work_experiences=[
                WorkExperience(
                    company_name="Precision Manufacturing",
                    position_title="Kỹ sư Thiết kế Cơ khí",
                    start_date="2019-01-01",
                    end_date="2023-01-01",
                    description="Thiết kế chi tiết máy 3D trên SolidWorks, xuất bản vẽ kỹ thuật gia công CNC.",
                )
            ],
        ),
        job=JobPayload(
            title="Kỹ sư Cơ khí Triển khai Bản vẽ",
            required_skills=[
                JobRequiredSkill(
                    skill_name="AutoCAD",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                )
            ],
            required_experience_years=2.0,
        ),
    )
    res = matching_engine.evaluate(req)
    assert res.mandatory_status == "CONDITIONAL_PASS"
    assert res.match_level == "HIGH"


def test_multi_industry_accounting_sap_to_misa_and_cap():
    """
    Accounting & Finance Industry:
    SAP ERP -> MISA: Downward transfer (0.95 credit).
    Candidate with SAP ERP satisfies mandatory MISA -> CONDITIONAL_PASS.
    Score is capped at 88.0 max to ensure strict gate discipline.
    """
    req = EvaluationRequest(
        application_id="app-acc-01",
        candidate_profile=CandidateProfilePayload(
            skills=[
                CandidateSkill(skill_name="SAP ERP", proficiency_level="ADVANCED"),
                CandidateSkill(skill_name="Báo cáo tài chính", proficiency_level="ADVANCED"),
            ],
            work_experiences=[
                WorkExperience(
                    company_name="MNC Manufacturing",
                    position_title="Senior General Accountant",
                    start_date="2018-01-01",
                    end_date="2023-01-01",
                    description="Lập báo cáo tài chính, quản lý sổ cái tổng hợp trên hệ thống SAP ERP.",
                )
            ],
        ),
        job=JobPayload(
            title="Kế toán Tổng hợp Doanh nghiệp",
            required_skills=[
                JobRequiredSkill(
                    skill_name="MISA",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                ),
                JobRequiredSkill(
                    skill_name="Báo cáo tài chính",
                    is_mandatory=True,
                    minimum_years=2.0,
                    minimum_level="INTERMEDIATE",
                ),
            ],
            required_experience_years=3.0,
        ),
    )
    res = matching_engine.evaluate(req)
    assert res.mandatory_status == "CONDITIONAL_PASS"
    assert res.overall_score <= 88.0
    assert res.match_level == "HIGH"
    assert "Ramp-up" in res.summary

