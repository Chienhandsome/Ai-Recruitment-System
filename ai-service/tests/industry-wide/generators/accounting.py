from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-accounting-chief-04",
        title="Senior Financial & Tax Accountant",
        description=(
            "VinaLogistics Corp is seeking a diligent Senior Financial & Tax Accountant to manage general ledger accounting, "
            "financial reporting, and statutory tax compliance under Vietnamese Accounting Standards (VAS). "
            "You will lead end-of-month and annual financial closures, handle corporate income tax (CIT) and value-added tax (VAT) "
            "declarations, liaise with tax inspectors and external auditors, and optimize ERP accounting workflows."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 5+ years of full-cycle general ledger and corporate tax accounting experience.\n"
            "- Core Technical Skills: General Ledger, Financial Reporting, Tax Accounting, VAS (Vietnamese Accounting Standards), Corporate Income Tax.\n"
            "- Preferred Skills: ERP systems, SAP, IFRS convergence, Auditing coordination.\n"
            "- Education: Bachelor's degree or above in Accounting, Auditing, Corporate Finance, or related field.\n"
            "- Language: Working English proficiency (TOEIC 700 or equivalent) for multinational audit correspondence.\n"
            "- Certifications: CPA Vietnam, ACCA, or Chief Accountant Certificate preferred."
        ),
        required_experience_years=5.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "General Ledger", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Financial Reporting", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Tax Accounting", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "VAS", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Corporate Income Tax", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "ERP", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "SAP", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "CPA", "is_mandatory": False},
        ],
        required_languages=[
            {"language": "English", "proficiency": "TOEIC 700", "is_mandatory": True},
        ],
        ai_weights_config={"skills": 35.0, "experience": 35.0, "education": 20.0, "other": 10.0},
    )


def get_candidates() -> Dict[str, Dict[str, Any]]:
    cands = {}

    # CV01: Near Perfect Match
    cands["CV01"] = make_candidate(
        candidate_name="Nguyễn Thị Thanh Hà",
        desired_title="Senior Financial & Tax Accountant",
        professional_summary="Senior General Ledger and Tax Accountant with 6 years experience in VAS statutory compliance, CIT/VAT finalization, and SAP ERP.",
        work_experiences=[
            make_exp(
                company_name="Sojitz Vietnam Logistics",
                position_title="Senior General Accountant",
                start_date="2021-02-01T00:00:00Z",
                is_current=True,
                description="Oversee General Ledger maintenance, prepare monthly Financial Reporting, execute Tax Accounting including Corporate Income Tax and VAT. Implement SAP ERP module.",
                achievements="Successfully defended 3 consecutive fiscal years of tax audits with zero fines or penalties."
            ),
            make_exp(
                company_name="KPMG Vietnam",
                position_title="Senior Audit Associate",
                start_date="2018-01-01T00:00:00Z",
                end_date="2021-01-31T00:00:00Z",
                description="Conducted VAS and IFRS financial audits, reviewed internal controls and statutory compliance.",
                achievements="Managed audit engagements for 12 corporate clients."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Accounting and Auditing",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax", "ERP", "SAP"],
        certificates=[{"certificate_name": "CPA", "issuing_organization": "Ministry of Finance Vietnam"}],
        languages=[{"language": "English", "proficiency": "TOEIC 850"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Lê Minh Trí",
        desired_title="Senior Accountant",
        professional_summary="Financial accountant with 5.5 years in General Ledger, VAS reporting, and Corporate Income Tax finalization.",
        work_experiences=[
            make_exp(
                company_name="Hoa Phat Steel Group",
                position_title="Senior General Ledger Accountant",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage General Ledger accounts, prepare monthly VAS Financial Reporting, reconcile balance sheets, execute Tax Accounting and Corporate Income Tax settlements.",
                achievements="Automated month-end book closure reducing cycle from 10 to 4 days."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Finance",
                major="Corporate Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Tax Accounting)
    cands["CV03"] = make_candidate(
        candidate_name="Hoàng Thị Mai",
        desired_title="Senior Financial Accountant",
        professional_summary="Senior GL Accountant with 5.5 years focusing strictly on internal cost accounting and VAS financial statements, with tax outsourced.",
        work_experiences=[
            make_exp(
                company_name="CP Group Vietnam",
                position_title="General Ledger Accountant",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Maintain General Ledger and produce VAS Financial Reporting. Coordinate with external tax advisory firm who handles all Corporate Income Tax and tax declarations.",
                achievements="Consolidated financial reports across 4 subsidiaries."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Economics HCMC",
                major="Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "VAS", "Corporate Income Tax"],
        certificates=[{"certificate_name": "CPA", "issuing_organization": "Ministry of Finance"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV04: Similar Skill Trap (Stock Brokerage / Equity Analyst)
    cands["CV04"] = make_candidate(
        candidate_name="Trịnh Quốc Huy",
        desired_title="Equity Research Analyst",
        professional_summary="Stock Market Analyst with 6 years evaluating ticker trends, candlestick patterns, and financial statement ratios.",
        work_experiences=[
            make_exp(
                company_name="VNDIRECT Securities",
                position_title="Senior Equity Analyst",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Analyze stock valuation multiples (P/E, P/B), issue stock buy/sell recommendations to retail investors. No bookkeeping, GL entries, or tax declarations.",
                achievements="Recommended top 5 performing stocks on VN30 index in 2022."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy",
                major="Finance and Banking",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Equity Research", "Technical Analysis", "Valuation Modeling", "Stock Picking", "Portfolio Advisory"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 800"}]
    )

    # CV05: Education Major Trap (Mechanical Engineering)
    cands["CV05"] = make_candidate(
        candidate_name="Đỗ Văn Hậu",
        desired_title="Senior Tax & GL Accountant",
        professional_summary="Experienced accountant with 5.5 years in General Ledger, VAS, and Corporate Income Tax, holding engineering degree.",
        work_experiences=[
            make_exp(
                company_name="Thaco Auto Parts",
                position_title="Senior Accountant",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage General Ledger, Financial Reporting, Tax Accounting, VAS compliance, and Corporate Income Tax finalization.",
                achievements="Successfully managed annual corporate tax declarations."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Mechanical Engineering",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[{"certificate_name": "CPA", "issuing_organization": "Ministry of Finance"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV06: Higher Degree Trap (Master of Philosophy)
    cands["CV06"] = make_candidate(
        candidate_name="Bùi Thu Cúc",
        desired_title="Financial Accountant",
        professional_summary="Accountant with 5.2 years in General Ledger and Tax Accounting, holding a Master of Philosophy.",
        work_experiences=[
            make_exp(
                company_name="Bao Viet Holdings",
                position_title="General Accountant",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Execute General Ledger entries, VAS Financial Reporting, Tax Accounting, and Corporate Income Tax calculations.",
                achievements="Streamlined quarterly tax reconciliation."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam National University",
                major="Dialectical Philosophy",
                degree="Master",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV07: Experience Threshold Trap (2.0 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Vũ Đức Anh",
        desired_title="Junior Accountant",
        professional_summary="Junior accountant with 2.0 years experience handling invoice posting and VAT declarations.",
        work_experiences=[
            make_exp(
                company_name="An Phat Holdings",
                position_title="Junior Accountant",
                start_date="2022-07-01T00:00:00Z",
                is_current=True,
                description="Post journal entries in General Ledger, assist in Financial Reporting, Tax Accounting, and Corporate Income Tax prep under VAS.",
                achievements="Assisted in 2 annual audits."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Finance",
                major="Accounting",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 720"}]
    )

    # CV08: Experience Domain Trap (Bank Teller / Branch Cashier)
    cands["CV08"] = make_candidate(
        candidate_name="Đoàn Thúy Ngân",
        desired_title="Senior Bank Teller",
        professional_summary="Bank Branch Teller with 5.5 years processing over-the-counter cash deposits and retail remittances.",
        work_experiences=[
            make_exp(
                company_name="Vietcombank Branch",
                position_title="Senior Bank Teller",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Count physical cash deposits, verify citizen ID cards, disburse cash withdrawals, balance cash drawer at end of day. No corporate tax filings, GL closures, or VAS statutory financial statements.",
                achievements="Maintained 100% accurate daily cash balance drawer."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy",
                major="Banking",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Cash Counting", "Teller Operations", "Remittance Processing", "Customer ID Verification", "Vault Balancing"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 720"}]
    )

    # CV09: Project vs Professional Experience (Only university case studies)
    cands["CV09"] = make_candidate(
        candidate_name="Nguyễn Thu Trang",
        desired_title="Accounting Graduate",
        professional_summary="Recent graduate with mock audit projects and academic coursework in VAS financial reporting.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Auditing",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="Mock Corporate Tax Finalization",
                project_role="Student Lead",
                description="Simulated Corporate Income Tax calculation and General Ledger closure for hypothetical enterprise.",
                technologies=["General Ledger", "VAS", "Corporate Income Tax", "Tax Accounting"],
                start_date="2023-10-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV10: Internship Trap (Repeated invoice filing internships)
    cands["CV10"] = make_candidate(
        candidate_name="Phạm Hải Nam",
        desired_title="Accounting Trainee",
        professional_summary="Candidate with multiple short-term audit and voucher filing internships totaling 3.5 years part-time.",
        work_experiences=[
            make_exp(
                company_name="BDO Vietnam",
                position_title="Audit Trainee Intern",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Stamp audit vouchers, file invoice paper copies in binders."
            ),
            make_exp(
                company_name="Crowe Vietnam",
                position_title="Tax Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Scan paper tax receipts and check tax numbers on General Department of Taxation website."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Economics HCMC",
                major="Accounting",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV11: Freelance Trap (5 years freelance tax & accounting service provider for SMEs)
    cands["CV11"] = make_candidate(
        candidate_name="Trần Thị Lan Anh",
        desired_title="Senior Freelance Chief Accountant",
        professional_summary="Independent Chief Accountant with 5.5 years managing complete General Ledger, VAS financial statements, and Corporate Income Tax for 20+ corporate clients.",
        work_experiences=[
            make_exp(
                company_name="Lan Anh Accounting Advisory Services",
                position_title="Chief Accounting Contractor",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Provide full-cycle General Ledger bookkeeping, quarterly Financial Reporting, Tax Accounting, and Corporate Income Tax finalization under VAS for corporate clients.",
                achievements="Closed over 80 annual financial statements with zero tax discrepancies."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Finance",
                major="Corporate Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[{"certificate_name": "CPA", "issuing_organization": "Ministry of Finance"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV12: Overlapping Dates (2.5 calendar years claiming 5.0 years)
    cands["CV12"] = make_candidate(
        candidate_name="Ngô Văn Toàn",
        desired_title="General Accountant",
        professional_summary="Accountant holding two concurrent company bookkeeping roles.",
        work_experiences=[
            make_exp(
                company_name="Minh Quang Trading",
                position_title="General Accountant",
                start_date="2021-06-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Manage General Ledger and Tax Accounting."
            ),
            make_exp(
                company_name="Thanh Do Construction (Concurrent)",
                position_title="Tax Accountant",
                start_date="2021-08-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent tax accounting job."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Finance",
                major="Accounting",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV13: Certification Equivalent Trap (Google Analytics Certification instead of CPA)
    cands["CV13"] = make_candidate(
        candidate_name="Lê Hương Ly",
        desired_title="Senior Accountant",
        professional_summary="Accountant with 5.5 years in General Ledger and VAS compliance holding Google Analytics certification.",
        work_experiences=[
            make_exp(
                company_name="KIDO Group",
                position_title="Senior General Accountant",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Oversee General Ledger, prepare Financial Reporting, execute Tax Accounting, and ensure Corporate Income Tax compliance under VAS.",
                achievements="Managed $10M corporate accounting portfolio."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[{"certificate_name": "Google Analytics Certification", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "TOEIC 730"}]
    )

    # CV14: Certification Unrelated (PMP - Project Management Professional)
    cands["CV14"] = make_candidate(
        candidate_name="Trần Tuấn Kiệt",
        desired_title="Senior Accountant",
        professional_summary="Senior GL accountant with 5.5 years experience holding PMP certification.",
        work_experiences=[
            make_exp(
                company_name="Vingroup Retail",
                position_title="Senior GL Accountant",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Oversee General Ledger, Financial Reporting, Tax Accounting, VAS, and Corporate Income Tax.",
                achievements="Maintained clean audit ledger."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Finance",
                major="Corporate Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[{"certificate_name": "Project Management Professional (PMP)", "issuing_organization": "PMI"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV15: Language Threshold Trap (TOEIC 500 vs required 700)
    cands["CV15"] = make_candidate(
        candidate_name="Phan Văn Quân",
        desired_title="Senior Accountant",
        professional_summary="Senior accountant with 5.5 years experience, TOEIC 500 English score.",
        work_experiences=[
            make_exp(
                company_name="Biti's Footwear",
                position_title="Senior General Accountant",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Responsible for General Ledger, Financial Reporting, Tax Accounting, VAS, and Corporate Income Tax.",
                achievements="Led financial month-end reconciliations."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Economics HCMC",
                major="Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 500"}]
    )

    # CV16: Wrong Language Trap (Korean TOPIK 5, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Kim Thị Loan",
        desired_title="Senior Accountant",
        professional_summary="Senior accountant with 5.5 years experience, fluent in Korean.",
        work_experiences=[
            make_exp(
                company_name="Samsung Electronics Vietnam",
                position_title="Senior GL Accountant",
                start_date="2018-12-01T00:00:00Z",
                is_current=True,
                description="Lead General Ledger, Financial Reporting, Tax Accounting, VAS compliance, and Corporate Income Tax finalization.",
                achievements="Liaised directly with Korean financial controller."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University",
                major="Korean Studies and Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["General Ledger", "Financial Reporting", "Tax Accounting", "VAS", "Corporate Income Tax"],
        certificates=[],
        languages=[{"language": "Korean", "proficiency": "TOPIK 5"}]
    )

    # CV17: Semantic Similarity Trap (Financial Philosophy Buzzwords without GL proof)
    cands["CV17"] = make_candidate(
        candidate_name="Tô Đình Vũ",
        desired_title="Financial Energy Alchemist",
        professional_summary="Philosophical financial orchestrator harmonizing monetary vibes, fiscal spirituality, and metaphysical wealth manifestation.",
        work_experiences=[
            make_exp(
                company_name="Wealth Mindset Academy",
                position_title="Fiscal Chakra Harmonizer",
                start_date="2018-06-01T00:00:00Z",
                is_current=True,
                description="Host spiritual webinars on wealth mindset and attracting money flow. Never performed double-entry bookkeeping or VAT filings.",
                achievements="Attracted 5,000 attendees to fiscal awakening talks."
            )
        ],
        educations=[
            make_edu(
                school_name="Dong Do University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Financial Mindfulness", "Public Speaking", "Wealth Coaching"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Lê Văn Hùng",
        desired_title="Senior Accountant",
        professional_summary="Experienced accountant in tax and general ledger.",
        work_experiences=[
            make_exp(
                company_name="Accounting Firm",
                position_title="Accountant",
                start_date="",
                description="General Ledger and Tax work."
            )
        ],
        educations=[],
        skills=["General Ledger", "Financial Reporting"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Equity M&A Investment Analyst)
    cands["CV19"] = make_candidate(
        candidate_name="Võ Gia Huy",
        desired_title="Senior Investment Associate",
        professional_summary="Investment Banking Associate with 8 years building discounted cash flow (DCF) models, LBO models, and leading startup fundraising rounds.",
        work_experiences=[
            make_exp(
                company_name="VinaCapital Private Equity",
                position_title="Senior Investment Analyst",
                start_date="2016-02-01T00:00:00Z",
                is_current=True,
                description="Evaluate tech startup financial pitch decks, build financial forecast projections, write investment memos for IC committee. No daily accounting ledger booking or tax filing.",
                achievements="Executed 4 Series-B venture capital transactions worth $40M."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Finance",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["DCF Modeling", "LBO Valuation", "M&A Due Diligence", "Financial Modeling", "Private Equity", "Venture Capital"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 950"}]
    )

    # CV20: Cross-Domain Near Match (Accounts Payable AP Clerk)
    cands["CV20"] = make_candidate(
        candidate_name="Đặng Thảo Vy",
        desired_title="Accounts Payable Specialist",
        professional_summary="Accounts Payable Specialist with 5.5 years processing vendor invoices and 3-way matching purchase orders.",
        work_experiences=[
            make_exp(
                company_name="Shopee Vietnam",
                position_title="Senior AP Specialist",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Review incoming supplier invoices against purchase orders, disburse wire payments. Never performed general ledger reconciliations, balance sheet preparation, or tax finalization.",
                achievements="Processed 3,000 vendor payments monthly with 99.8% on-time rate."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy",
                major="Accounting",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Accounts Payable", "Invoice Processing", "3-Way Matching", "Vendor Disbursements"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 720"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 6 yrs experience, CPA cert, TOEIC 850, Accounting degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional CPA certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Tax Accounting skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Equity stock market analysis is not statutory General Ledger and Tax accounting."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Mechanical Engineering fails Accounting/Finance major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Master of Philosophy fails Accounting/Finance field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 2.0 years experience vs required 5.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Bank teller cash handling lacks General Ledger and Tax Accounting competence."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "University simulation projects cannot replace 5.0 years professional accounting experience."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Voucher filing internships do not satisfy Senior Financial Accountant level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance chief accountant meets tenure, skills, and VAS tax reporting."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping calendar duration is 2.5 years < 5.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get CPA cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "PMP project management cert does not grant accounting bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "TOEIC 500 is below mandatory threshold TOEIC 700."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Korean TOPIK 5 does not substitute for required English TOEIC 700."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Financial philosophy buzzwords lack concrete VAS accounting evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "M&A Investment Banker lacks General Ledger, Tax Accounting, and VAS bookkeeping."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "AP Invoice entry clerk lacks full GL, Tax Accounting, and Financial Reporting closing."),
    }
