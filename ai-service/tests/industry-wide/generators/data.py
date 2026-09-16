from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-data-analytics-08",
        title="Senior BI & Data Analytics Specialist",
        description=(
            "TechFin Data Labs is seeking a highly analytical Senior BI & Data Analytics Specialist to transform enterprise data into "
            "actionable business intelligence. You will write complex SQL queries across cloud data warehouses, build automated ETL data pipelines "
            "with Python, design executive Power BI dashboards with advanced DAX measures, and perform statistical exploratory analysis."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 4+ years of data analytics, business intelligence, and data pipeline experience.\n"
            "- Core Technical Skills: SQL, Power BI, Python, ETL, Data Visualization.\n"
            "- Preferred Skills: Tableau, A/B Testing, Cloud Warehousing (BigQuery/Snowflake), Data Modeling.\n"
            "- Education: Bachelor's degree or above in Data Science, Computer Science, Statistics, Information Systems, Mathematics, or related field.\n"
            "- Language: Working English proficiency (IELTS 6.5 or equivalent) for technical documentation and regional presentations.\n"
            "- Certifications: Microsoft Certified: Power BI Data Analyst Associate (PL-300) preferred."
        ),
        required_experience_years=4.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "SQL", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Power BI", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Python", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "ETL", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Data Visualization", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Tableau", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "A/B Testing", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "Microsoft Certified: Power BI Data Analyst Associate", "is_mandatory": False},
        ],
        required_languages=[
            {"language": "English", "proficiency": "IELTS 6.5", "is_mandatory": True},
        ],
        ai_weights_config={"skills": 40.0, "experience": 30.0, "education": 15.0, "other": 15.0},
    )


def get_candidates() -> Dict[str, Dict[str, Any]]:
    cands = {}

    # CV01: Near Perfect Match
    cands["CV01"] = make_candidate(
        candidate_name="Nguyễn Văn An",
        desired_title="Senior BI & Data Analytics Specialist",
        professional_summary="Senior BI Specialist with 5.5 years designing cloud data pipelines, writing high-performance SQL, and architecting enterprise Power BI models.",
        work_experiences=[
            make_exp(
                company_name="VPBank Digital Banking",
                position_title="Senior BI Analyst",
                start_date="2021-03-01T00:00:00Z",
                is_current=True,
                description="Write complex SQL queries on BigQuery, orchestrate automated ETL pipelines in Python, build executive Power BI dashboards with DAX, and deliver Data Visualization.",
                achievements="Reduced executive reporting latency from 3 days to real-time automated refresh."
            ),
            make_exp(
                company_name="Shopee Data Team",
                position_title="Data Analyst",
                start_date="2018-09-01T00:00:00Z",
                end_date="2021-02-28T00:00:00Z",
                description="Built automated daily metrics reports using SQL and Python, developed Tableau visualizations.",
                achievements="Optimized SQL query runtime by 40%."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Information Systems and Data Science",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization", "Tableau", "A/B Testing"],
        certificates=[{"certificate_name": "Microsoft Certified: Power BI Data Analyst Associate", "issuing_organization": "Microsoft"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Thị Lan",
        desired_title="Data Analyst",
        professional_summary="Data Analyst with 4.5 years building BI dashboards, writing SQL analytics queries, and automating ETL with Python.",
        work_experiences=[
            make_exp(
                company_name="MoMo Payment Service",
                position_title="Senior Data Analyst",
                start_date="2020-01-01T00:00:00Z",
                is_current=True,
                description="Maintain core SQL marts, construct Power BI dashboards, write Python ETL jobs, and present Data Visualization insights to C-suite.",
                achievements="Built user retention dashboard tracking 10M active accounts."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Business Statistics",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Python)
    cands["CV03"] = make_candidate(
        candidate_name="Lê Quốc Bảo",
        desired_title="BI Dashboard Developer",
        professional_summary="BI Developer with 4.5 years in SQL and Power BI dashboarding, with no programming or Python scripting experience.",
        work_experiences=[
            make_exp(
                company_name="Vingroup Corporate",
                position_title="BI Reporting Developer",
                start_date="2020-02-01T00:00:00Z",
                is_current=True,
                description="Write SQL views in SQL Server, design Power BI charts, build basic SSIS ETL packages, and deliver Data Visualization. Completely non-technical in Python scripting.",
                achievements="Constructed 25 internal reporting dashboards."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy",
                major="Management Information Systems",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "ETL", "Data Visualization"],
        certificates=[{"certificate_name": "Microsoft Certified: Power BI Data Analyst Associate", "issuing_organization": "Microsoft"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (Basic Excel Data Entry Clerk)
    cands["CV04"] = make_candidate(
        candidate_name="Phạm Bích Ngọc",
        desired_title="Data Entry Clerk",
        professional_summary="Data Entry Staff with 5 years typing paper records and customer addresses into Excel spreadsheets.",
        work_experiences=[
            make_exp(
                company_name="An Binh Archives Co",
                position_title="Senior Data Input Clerk",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Type paper survey forms into Excel rows, use basic SUM and AVERAGE formulas, highlight cells in yellow. No SQL queries, Python coding, ETL pipelines, or Power BI models.",
                achievements="Maintained 70 words-per-minute numerical typing speed."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Vocational College",
                major="Office Informatics",
                degree="Associate",
                start_date="2015-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Excel", "Data Entry", "Typing", "Form Scanning", "Filing"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV05: Education Major Trap (Archaeology & Ancient Civilizations)
    cands["CV05"] = make_candidate(
        candidate_name="Hoàng Minh Trí",
        desired_title="BI Analyst",
        professional_summary="Data analyst with 4.5 years in SQL and Power BI, holding a degree in archaeology.",
        work_experiences=[
            make_exp(
                company_name="Tiki Data Team",
                position_title="BI Analyst",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Write SQL, construct Power BI dashboards, automate ETL in Python, and build Data Visualization reports.",
                achievements="Managed e-commerce seller metrics."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Social Sciences and Humanities",
                major="Archaeology & Ancient Civilizations",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[{"certificate_name": "Microsoft Certified: Power BI Data Analyst Associate", "issuing_organization": "Microsoft"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (Master of Agronomy)
    cands["CV06"] = make_candidate(
        candidate_name="Võ Thu Hằng",
        desired_title="BI Analyst",
        professional_summary="Data analyst with 4.2 years experience holding a Master of Agronomy in Crop Science.",
        work_experiences=[
            make_exp(
                company_name="KIDO Data Hub",
                position_title="Data Analyst",
                start_date="2020-02-01T00:00:00Z",
                is_current=True,
                description="Write SQL, develop Power BI models, execute Python ETL pipelines, and create Data Visualization charts.",
                achievements="Built sales forecast dashboards."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam National University of Agriculture",
                major="Agronomy & Crop Science",
                degree="Master",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV07: Experience Threshold Trap (1.5 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Đặng Tuấn Kiệt",
        desired_title="Junior Data Analyst",
        professional_summary="Junior analyst with 1.5 years writing SQL queries and building simple Power BI dashboards.",
        work_experiences=[
            make_exp(
                company_name="One Mount Group",
                position_title="Junior Data Analyst",
                start_date="2023-01-01T00:00:00Z",
                is_current=True,
                description="Assist senior analysts in writing SQL queries, building Power BI charts, learning Python ETL scripts, and Data Visualization.",
                achievements="Maintained 5 weekly sales reports."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Data Science",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Street Survey Intercept Poller)
    cands["CV08"] = make_candidate(
        candidate_name="Nguyễn Văn Thắng",
        desired_title="Field Survey Fieldwork Supervisor",
        professional_summary="Field Survey Lead with 5 years stopping pedestrians at street corners to ask paper survey questionnaires.",
        work_experiences=[
            make_exp(
                company_name="Nielsen Field Research Vietnam",
                position_title="Senior Fieldwork Intercept Poller",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Hold paper clipboard, stop citizens in public markets, ask verbal questions about laundry detergent brands, tick checkbox on paper. No SQL database querying, Python scripting, or Power BI modeling.",
                achievements="Conducted 4,000 face-to-face consumer interviews."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University",
                major="Sociology",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Field Surveying", "Face-to-Face Intercepts", "Questionnaire Ticking", "Market Polling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Only Kaggle Titanic homework)
    cands["CV09"] = make_candidate(
        candidate_name="Bùi Tuấn Anh",
        desired_title="Aspiring Data Scientist",
        professional_summary="Self-taught student with Kaggle notebooks and academic machine learning tutorials.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="University of Engineering and Technology",
                major="Computer Science",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="Kaggle Titanic Survival Analysis",
                project_role="Solo Analyst",
                description="Cleaned Titanic passenger CSV using pandas and plotted survival rate bar charts.",
                technologies=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
                start_date="2023-06-01T00:00:00Z",
                end_date="2023-09-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV10: Internship Trap (Repeated Excel formatting internships)
    cands["CV10"] = make_candidate(
        candidate_name="Đỗ Quỳnh Trang",
        desired_title="Data Intern",
        professional_summary="Candidate with multiple short spreadsheet formatting internships totaling 3 years part-time.",
        work_experiences=[
            make_exp(
                company_name="Sendo E-commerce",
                position_title="Data Cleaning Intern",
                start_date="2021-06-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Manually delete blank rows in Excel spreadsheets."
            ),
            make_exp(
                company_name="VCCorp Media",
                position_title="Reporting Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Copy numbers from Google Sheets into PowerPoint slides."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Information Systems",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (4.5 years freelance BI dashboard developer)
    cands["CV11"] = make_candidate(
        candidate_name="Vũ Đức Thắng",
        desired_title="Senior Freelance BI Consultant",
        professional_summary="Independent BI Consultant with 4.5 years developing production SQL models, Python ETL pipelines, and Power BI dashboards for SMEs.",
        work_experiences=[
            make_exp(
                company_name="Thang Analytics Freelance Services",
                position_title="Principal BI Consultant",
                start_date="2019-09-01T00:00:00Z",
                is_current=True,
                description="Contracted by corporate clients to design data warehouses, write complex SQL queries, build automated Python ETL data pipelines, create interactive Power BI reports, and deliver Data Visualization.",
                achievements="Delivered 35 end-to-end BI dashboard implementations with 100% client satisfaction."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Management Information Systems",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[{"certificate_name": "Microsoft Certified: Power BI Data Analyst Associate", "issuing_organization": "Microsoft"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV12: Overlapping Dates (2.0 calendar years claiming 4.5 years)
    cands["CV12"] = make_candidate(
        candidate_name="Phan Văn Đạt",
        desired_title="Data Analyst",
        professional_summary="Analyst holding concurrent analytics positions.",
        work_experiences=[
            make_exp(
                company_name="Fintech Alpha",
                position_title="Data Analyst",
                start_date="2022-01-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Write SQL queries and build Power BI reports."
            ),
            make_exp(
                company_name="Fintech Beta (Concurrent)",
                position_title="BI Developer",
                start_date="2022-03-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent BI reporting developer."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Statistics",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (Google Ads Search instead of Power BI PL-300)
    cands["CV13"] = make_candidate(
        candidate_name="Ngô Quốc Huy",
        desired_title="Data Analyst",
        professional_summary="Data analyst with 4.5 years experience holding Google Ads Search advertising certificate.",
        work_experiences=[
            make_exp(
                company_name="VietinBank Securities",
                position_title="Data Analyst",
                start_date="2019-11-01T00:00:00Z",
                is_current=True,
                description="Execute SQL queries, build Power BI dashboards, automate ETL in Python, and construct Data Visualization views.",
                achievements="Automated market liquidity reporting."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="Economics",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[{"certificate_name": "Google Ads Search Certification", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (ServSafe Food Handler)
    cands["CV14"] = make_candidate(
        candidate_name="Trần Văn Minh",
        desired_title="Data Analyst",
        professional_summary="Data analyst with 4.5 years experience holding commercial food safety handling certificate.",
        work_experiences=[
            make_exp(
                company_name="Golden Gate Group",
                position_title="BI Analyst",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Extract SQL sales data, build restaurant Power BI dashboards, run Python ETL data models, and format Data Visualization reports.",
                achievements="Managed 400 restaurant store analytics."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Information Systems",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[{"certificate_name": "ServSafe Food Safety Manager", "issuing_organization": "National Restaurant Association"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Lê Minh Đạt",
        desired_title="Data Analyst",
        professional_summary="Data analyst with 4.5 years experience, IELTS 5.0 English score.",
        work_experiences=[
            make_exp(
                company_name="Sacombank",
                position_title="BI Analyst",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Build SQL data views, design Power BI dashboards, script Python ETL jobs, and present Data Visualization slides.",
                achievements="Maintained credit card analytics data."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy",
                major="Information Systems",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (Italian CILS B2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Đoàn Thị Mai",
        desired_title="Data Analyst",
        professional_summary="Data analyst with 4.5 years experience, fluent in Italian.",
        work_experiences=[
            make_exp(
                company_name="Piaggio Vietnam",
                position_title="Operations Data Analyst",
                start_date="2019-08-01T00:00:00Z",
                is_current=True,
                description="Manage SQL queries, develop Power BI reports, maintain Python ETL scripts, and create Data Visualization boards.",
                achievements="Reported monthly factory assembly KPIs."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University",
                major="Italian Studies & Informatics",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["SQL", "Power BI", "Python", "ETL", "Data Visualization"],
        certificates=[],
        languages=[{"language": "Italian", "proficiency": "CILS B2"}]
    )

    # CV17: Semantic Similarity Trap (Data Philosophy Buzzwords without SQL proof)
    cands["CV17"] = make_candidate(
        candidate_name="Võ Quốc Khánh",
        desired_title="Cosmic Metric Shaman",
        professional_summary="Visionary data poet channeling vibrational number synergy, spiritual variance alignment, and metaphysical KPI enlightenment.",
        work_experiences=[
            make_exp(
                company_name="Data Nirvana Hub",
                position_title="Quantum Insight Shaman",
                start_date="2019-05-01T00:00:00Z",
                is_current=True,
                description="Intuit numbers through crystal contemplation and feeling digital karma. Never executed a SQL SELECT statement or written Python code.",
                achievements="Published spiritual thought-pieces on data karma."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Culture",
                major="Cultural Studies",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Spiritual Numerology", "Mindful Data", "Public Speaking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Nguyễn Văn Lâm",
        desired_title="Data Analyst",
        professional_summary="Data analyst.",
        work_experiences=[
            make_exp(
                company_name="Analytics Corp",
                position_title="Data Analyst",
                start_date="",
                description="Analyze data with SQL."
            )
        ],
        educations=[],
        skills=["SQL", "Power BI"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Senior Linux DevOps & Sysadmin)
    cands["CV19"] = make_candidate(
        candidate_name="Trần Thế Hưng",
        desired_title="Senior Linux Systems Engineer",
        professional_summary="Infrastructure Systems Engineer with 8 years managing Bare-metal Linux servers, BIND DNS, Ansible playbooks, and iptables firewalls.",
        work_experiences=[
            make_exp(
                company_name="Viettel IDC Data Center",
                position_title="Senior Linux Sysadmin",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Manage 500 CentOS physical servers, configure RAID controllers, write Bash scripts, patch Linux kernels, and troubleshoot network routing. No SQL data warehousing, business KPIs, or Power BI dashboarding.",
                achievements="Maintained 99.999% server uptime across hosting infrastructure."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Computer Engineering",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["Linux Sysadmin", "Ansible", "Bash Scripting", "DNS", "Firewall iptables", "Server Hardware"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV20: Cross-Domain Near Match (Financial Accounting Auditor)
    cands["CV20"] = make_candidate(
        candidate_name="Lê Thị Bích Vân",
        desired_title="Senior Statutory Financial Auditor",
        professional_summary="Statutory Auditor with 4.5 years reviewing balance sheet vouchers, ledger debit/credit postings, and bank reconciliation statements in Excel.",
        work_experiences=[
            make_exp(
                company_name="PwC Vietnam",
                position_title="Senior Audit Associate",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Sample physical invoices, verify trial balance totals, cross-reference bank confirmations. No SQL relational querying, Python data transformations, or automated BI dashboard engineering.",
                achievements="Led statutory financial audit for 8 manufacturing clients."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Finance",
                major="Auditing",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Statutory Auditing", "Voucher Inspection", "Trial Balance", "Excel Financials"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 5.5 yrs experience, Power BI cert, IELTS 7.5, Data Science degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional Microsoft certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Python skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Excel data entry clerk is not SQL/Python/Power BI data analytics."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Archaeology fails Data/Computer Science/Statistics major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Master of Agronomy fails Data/IT/Math field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.5 years experience vs required 4.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Street paper survey polling lacks relational SQL databases, Python, and Power BI."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "Kaggle tutorial notebooks cannot replace 4.0 years professional data analytics."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Excel row cleaning internships do not satisfy Senior BI Specialist level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance BI consultant meets tenure, SQL/Python skills, and client dashboards."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment duration is 2.0 years < 4.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get Power BI cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "Food safety cert does not grant data analytics bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Italian CILS B2 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Data karma buzzwords lack concrete SQL and Python evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Linux Sysadmin lacks SQL data marts, Power BI dashboards, and business reporting."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Financial voucher auditor lacks SQL querying, Python ETL, and automated BI tools."),
    }
