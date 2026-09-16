from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-sales-enterprise-03",
        title="Enterprise B2B Sales Manager",
        description=(
            "CloudX Technologies is seeking a seasoned Enterprise B2B Sales Manager to drive multi-million dollar SaaS and cloud infrastructure deals. "
            "You will target C-level executives in Banking, Financial Services, and Large Conglomerates across Southeast Asia. "
            "The ideal candidate possesses a proven track record of consultative solution selling, complex contract negotiations, and enterprise quota overachievement."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 5+ years of enterprise B2B corporate technology sales experience.\n"
            "- Core Technical Skills: B2B Sales, Enterprise Sales, Contract Negotiation, Key Account Management, Solution Selling.\n"
            "- Preferred Skills: CRM proficiency, Salesforce, Pipeline Forecasting, Strategic Account Planning.\n"
            "- Education: Bachelor's degree or above in Business Administration, International Business, Commerce, Economics, or related field.\n"
            "- Language: Fluent English (IELTS 6.5 or equivalent) for multinational executive board presentations.\n"
            "- Certifications: Certified Sales Professional (CSP) or Miller Heiman certification preferred."
        ),
        required_experience_years=5.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "B2B Sales", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Enterprise Sales", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Contract Negotiation", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Key Account Management", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Solution Selling", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "CRM", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "Salesforce", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "Certified Sales Professional (CSP)", "is_mandatory": False},
        ],
        required_languages=[
            {"language": "English", "proficiency": "IELTS 6.5", "is_mandatory": True},
        ],
        ai_weights_config={"skills": 35.0, "experience": 40.0, "education": 15.0, "other": 10.0},
    )


def get_candidates() -> Dict[str, Dict[str, Any]]:
    cands = {}

    # CV01: Near Perfect Match
    cands["CV01"] = make_candidate(
        candidate_name="Nguyễn Tuấn Dũng",
        desired_title="Enterprise B2B Sales Manager",
        professional_summary="Senior Enterprise B2B Sales Manager with 6.5 years closing large-scale cloud solutions and ERP software contracts up to $1.5M ARR.",
        work_experiences=[
            make_exp(
                company_name="Oracle Vietnam",
                position_title="Senior Enterprise Account Executive",
                start_date="2021-03-01T00:00:00Z",
                is_current=True,
                description="Lead consultative B2B Sales and Enterprise Sales for Tier-1 commercial banks. Drive complex Contract Negotiation, Solution Selling, and Key Account Management in Salesforce.",
                achievements="Achieved 135% quota in 2023 with total contracted value of $3.2M."
            ),
            make_exp(
                company_name="FPT IS (Information System)",
                position_title="B2B Technology Sales Specialist",
                start_date="2018-01-01T00:00:00Z",
                end_date="2021-02-28T00:00:00Z",
                description="Managed enterprise B2B accounts, conducted bid presentations, closed system integration contracts.",
                achievements="Closed landmark $800K government digitization contract."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Business Administration",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling", "CRM", "Salesforce"],
        certificates=[{"certificate_name": "Certified Sales Professional (CSP)", "issuing_organization": "Sales Association"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Phạm Minh Cường",
        desired_title="Enterprise Sales Manager",
        professional_summary="Corporate B2B Sales Specialist with 5.5 years in software solutions, contract closing, and strategic client retention.",
        work_experiences=[
            make_exp(
                company_name="MISA Software Corporation",
                position_title="Senior B2B Sales Lead",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Spearhead Enterprise Sales to corporate groups. Conduct Solution Selling workshops, manage Key Account Management relationships and finalize high-value Contract Negotiation.",
                achievements="Grew enterprise portfolio revenue by 40% year-on-year."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Contract Negotiation)
    cands["CV03"] = make_candidate(
        candidate_name="Lê Đình Khiêm",
        desired_title="Enterprise Account Executive",
        professional_summary="B2B Sales Account Executive with 5.5 years in technical presentations and lead qualification, but relies entirely on legal team for contract negotiations.",
        work_experiences=[
            make_exp(
                company_name="CMC Telecom",
                position_title="Corporate Account Manager",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Identify enterprise prospects, conduct Solution Selling and B2B Sales discovery calls, maintain Key Account Management. Hand off contracts strictly to in-house legal counsel.",
                achievements="Generated over 50 qualified enterprise RFP opportunities."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy of Vietnam",
                major="Banking and Finance",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Key Account Management", "Solution Selling", "CRM"],
        certificates=[{"certificate_name": "Certified Sales Professional (CSP)", "issuing_organization": "Sales Association"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (Retail Store Cashier / B2C Sales)
    cands["CV04"] = make_candidate(
        candidate_name="Võ Ngọc Hân",
        desired_title="Store Sales Representative",
        professional_summary="Retail Sales Associate with 6 years experience selling consumer electronics and cosmetics to individual walk-in shoppers.",
        work_experiences=[
            make_exp(
                company_name="The Gioi Di Dong (Mobile World)",
                position_title="Retail Store Senior Sales Staff",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Greet walk-in retail shoppers, recommend smartphone models, process POS payments, upsell phone cases and screen protectors.",
                achievements="Ranked top retail salesperson in District 1 showroom for 3 consecutive quarters."
            )
        ],
        educations=[
            make_edu(
                school_name="Saigon University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Retail Sales", "POS Handling", "Customer Greeting", "Product Demonstration", "Cash Handling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV05: Education Major Trap (Veterinary Medicine)
    cands["CV05"] = make_candidate(
        candidate_name="Trần Thế Hùng",
        desired_title="Enterprise B2B Sales Manager",
        professional_summary="Enterprise sales manager with 5.5 years closing corporate deals, transitioned from veterinary medicine degree.",
        work_experiences=[
            make_exp(
                company_name="Base.vn Enterprise Platform",
                position_title="Enterprise Sales Manager",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Lead enterprise B2B Sales, Enterprise Sales, Solution Selling, Key Account Management, and master Contract Negotiation.",
                achievements="Overachieved corporate sales target by 125% in 2023."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam National University of Agriculture",
                major="Veterinary Medicine",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[{"certificate_name": "Certified Sales Professional (CSP)", "issuing_organization": "Sales Association"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (Master of Fine Arts)
    cands["CV06"] = make_candidate(
        candidate_name="Đoàn Kim Oanh",
        desired_title="Enterprise Sales Specialist",
        professional_summary="Enterprise sales specialist with 5.2 years closing enterprise SaaS contracts, holding a Master of Fine Arts.",
        work_experiences=[
            make_exp(
                company_name="FastWork Software",
                position_title="Senior Enterprise Account Manager",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Pitch enterprise SaaS packages, handle Contract Negotiation, B2B Sales, Solution Selling, and Key Account Management.",
                achievements="Managed $1.2M annual enterprise sales quota."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam University of Fine Arts",
                major="Oil Painting and Visual Arts",
                degree="Master",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV07: Experience Threshold Trap (2.0 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Hoàng Gia Huy",
        desired_title="Junior B2B Sales Executive",
        professional_summary="Junior B2B Sales rep with 2.0 years experience prospecting corporate clients and conducting initial discovery.",
        work_experiences=[
            make_exp(
                company_name="1Office Platform",
                position_title="B2B Sales Executive",
                start_date="2022-07-01T00:00:00Z",
                is_current=True,
                description="Cold call corporate prospects, demo CRM software, participate in Solution Selling and basic Contract Negotiation.",
                achievements="Signed 15 new SME accounts in past 12 months."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="International Business",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Real Estate Condo Telesales)
    cands["CV08"] = make_candidate(
        candidate_name="Vũ Đức Trí",
        desired_title="Real Estate Broker",
        professional_summary="Real Estate Sales Agent with 5.5 years cold-calling retail buyers to sell residential apartment units.",
        work_experiences=[
            make_exp(
                company_name="Dat Xanh Group",
                position_title="Senior Property Broker",
                start_date="2018-09-01T00:00:00Z",
                is_current=True,
                description="Cold-call individual property buyers from phone directories, take clients to condo showrooms, persuade them to deposit for apartment units. No corporate B2B tech solution sales.",
                achievements="Closed 45 residential apartment units in suburban projects."
            )
        ],
        educations=[
            make_edu(
                school_name="Thuongmai University",
                major="Commerce",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Real Estate Brokering", "Telesales", "Property Showing", "Customer Persuasion", "Deposit Collection"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Only uni case competitions)
    cands["CV09"] = make_candidate(
        candidate_name="Nguyễn Mai Linh",
        desired_title="Business Development Associate",
        professional_summary="Recent graduate who participated in multiple national business plan and venture pitch competitions.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Business",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="National Business Case Competition",
                project_role="Team Leader",
                description="Designed corporate B2B go-to-market strategy simulation for SaaS enterprise solution.",
                technologies=["B2B Sales", "Solution Selling", "Market Modeling"],
                start_date="2023-09-01T00:00:00Z",
                end_date="2023-12-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV10: Internship Trap (Repeated unpaid sales internships)
    cands["CV10"] = make_candidate(
        candidate_name="Đinh Hoàng Nam",
        desired_title="Sales Trainee",
        professional_summary="Candidate with consecutive 3-month sales internships totaling 3.5 years across various distributors.",
        work_experiences=[
            make_exp(
                company_name="Techdata Vietnam",
                position_title="Inside Sales Intern",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Shadow senior sales account managers, print quote sheets, send standardized email introductions."
            ),
            make_exp(
                company_name="Synnex FPT",
                position_title="Distribution Sales Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Help senior reps verify delivery invoices and input sales orders into billing system."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (5 years freelance corporate broker with verifiable contracts)
    cands["CV11"] = make_candidate(
        candidate_name="Bùi Tuấn Kiệt",
        desired_title="Senior Freelance B2B Sales Broker",
        professional_summary="Independent B2B Technology Broker with 5.5 years representing foreign software vendors in closing deals with Vietnamese banks and corporations.",
        work_experiences=[
            make_exp(
                company_name="Independent B2B Sales Consultancy",
                position_title="Principal Corporate Sales Consultant",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Contracted by enterprise software firms to execute end-to-end B2B Sales, Enterprise Sales, high-stakes Contract Negotiation, Solution Selling, and Key Account Management.",
                achievements="Facilitated $4M+ in cumulative software licensing transactions over 5 years."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Economics",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[{"certificate_name": "Certified Sales Professional (CSP)", "issuing_organization": "Sales Association"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV12: Overlapping Dates (2.5 calendar years claiming 5 years)
    cands["CV12"] = make_candidate(
        candidate_name="Lê Quốc Thịnh",
        desired_title="Sales Manager",
        professional_summary="Sales executive with overlapping concurrent employment roles.",
        work_experiences=[
            make_exp(
                company_name="VNTT Solutions",
                position_title="Corporate Sales Lead",
                start_date="2021-06-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Conduct B2B Sales and Contract Negotiation."
            ),
            make_exp(
                company_name="NetNam Telecom (Concurrent)",
                position_title="Enterprise Account Executive",
                start_date="2021-08-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Simultaneous enterprise sales position."
            )
        ],
        educations=[
            make_edu(
                school_name="Banking Academy",
                major="Finance",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (HubSpot Inbound Sales)
    cands["CV13"] = make_candidate(
        candidate_name="Phan Văn Quyết",
        desired_title="Enterprise Sales Manager",
        professional_summary="Enterprise sales manager with 5.5 years closing corporate deals, holding HubSpot Inbound Sales certificate.",
        work_experiences=[
            make_exp(
                company_name="Viettel Solutions",
                position_title="Senior Enterprise Account Manager",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Handle B2B Sales, Enterprise Sales, Contract Negotiation, Key Account Management, and Solution Selling for provincial government clients.",
                achievements="Delivered 115% target completion in 2023."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[{"certificate_name": "HubSpot Inbound Sales Certification", "issuing_organization": "HubSpot"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (Certified Scrum Master)
    cands["CV14"] = make_candidate(
        candidate_name="Tô Hoàng Phúc",
        desired_title="B2B Sales Manager",
        professional_summary="Enterprise sales manager with 5.2 years closing corporate deals, holding Certified Scrum Master credential.",
        work_experiences=[
            make_exp(
                company_name="KMS Solutions",
                position_title="Enterprise Sales Manager",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Drive B2B Sales, Enterprise Sales, Contract Negotiation, Key Account Management, and Solution Selling for corporate software.",
                achievements="Maintained 95% client renewal rate."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Business",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[{"certificate_name": "Certified Scrum Master (CSM)", "issuing_organization": "Scrum Alliance"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Trần Văn Hưng",
        desired_title="Enterprise Sales Manager",
        professional_summary="Enterprise sales manager with 5.5 years in B2B sales with IELTS 5.0 English proficiency.",
        work_experiences=[
            make_exp(
                company_name="CMC Global",
                position_title="Enterprise Account Executive",
                start_date="2018-12-01T00:00:00Z",
                is_current=True,
                description="Manage B2B Sales, Enterprise Sales, Contract Negotiation, Key Account Management, and Solution Selling.",
                achievements="Met annual revenue quota."
            )
        ],
        educations=[
            make_edu(
                school_name="Thuongmai University",
                major="Marketing",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (German TestDaF B2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Hà Thị Phương",
        desired_title="Enterprise Sales Specialist",
        professional_summary="B2B sales specialist with 5.2 years experience, fluent in German.",
        work_experiences=[
            make_exp(
                company_name="Siemens Vietnam",
                position_title="B2B Account Manager",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Lead B2B Sales, Enterprise Sales, Contract Negotiation, Key Account Management, and Solution Selling for industrial clients.",
                achievements="Achieved 120% sales target."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="German Studies & Business",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["B2B Sales", "Enterprise Sales", "Contract Negotiation", "Key Account Management", "Solution Selling"],
        certificates=[],
        languages=[{"language": "German", "proficiency": "TestDaF B2"}]
    )

    # CV17: Semantic Similarity Trap (Networking Buzzwords without enterprise sales evidence)
    cands["CV17"] = make_candidate(
        candidate_name="Lê Trí Đức",
        desired_title="Chief Synergy Evangelist",
        professional_summary="Charismatic high-vibe relationship architect championing executive rapport, spiritual client bonding, and cosmic synergy.",
        work_experiences=[
            make_exp(
                company_name="Synergy Consulting Group",
                position_title="Executive Networking Evangelist",
                start_date="2018-05-01T00:00:00Z",
                is_current=True,
                description="Attend business gala dinners, exchange business cards, introduce founders at coffee meetups. Never handled pricing models, contract drafting, or quota responsibilities.",
                achievements="Connected over 1,000 LinkedIn followers."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Networking", "Public Speaking", "Relationship Building", "Socializing"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Trần Văn Nam",
        desired_title="Sales Manager",
        professional_summary="Sales professional with enterprise deals.",
        work_experiences=[
            make_exp(
                company_name="Sales Agency",
                position_title="Sales Manager",
                start_date="",
                description="Sell products to corporate customers."
            )
        ],
        educations=[],
        skills=["B2B Sales", "Enterprise Sales"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Head of Call Center Customer Support)
    cands["CV19"] = make_candidate(
        candidate_name="Nguyễn Văn Thiện",
        desired_title="Customer Care Operations Director",
        professional_summary="Contact Center Director with 8 years leading 100+ inbound customer support agents, ticket resolving, and SLA tracking.",
        work_experiences=[
            make_exp(
                company_name="Teleperformance Vietnam",
                position_title="Contact Center Operations Manager",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Supervise 120 customer support reps, handle escalation complaints from end users, monitor CSAT and average handle time (AHT). No outbound sales quotas or contract negotiations.",
                achievements="Maintained 94% CSAT across 2 million customer calls."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["Customer Service", "Call Center Management", "CSAT", "Helpdesk Operations", "Incident Escalation", "Workforce Management"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV20: Cross-Domain Near Match (Procurement & Purchasing Manager)
    cands["CV20"] = make_candidate(
        candidate_name="Võ Thị Bích Thủy",
        desired_title="Senior Procurement Manager",
        professional_summary="Corporate Purchasing Manager with 6 years evaluating vendor proposals, negotiating vendor discounts, and issuing purchase orders.",
        work_experiences=[
            make_exp(
                company_name="VinFast Manufacturing",
                position_title="Senior Purchasing Manager",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Manage procurement RFPs, negotiate contracts with suppliers to reduce procurement costs, audit supplier quality. Acts strictly as buyer, not seller.",
                achievements="Saved company $3M in annual vendor supply contracts."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Trade",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Procurement", "Purchasing", "Contract Negotiation", "Vendor Management", "Cost Reduction"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 6.5 yrs enterprise B2B sales experience, CSP cert, IELTS 7.5."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional CSP certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Contract Negotiation skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Retail B2C counter sales is not enterprise B2B corporate software sales."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Veterinary Medicine fails Business/Economics major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Master of Fine Arts fails Business/Economics field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 2.0 years experience vs required 5.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Residential property telesales lacks B2B enterprise technology solution selling."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "Student competition case studies cannot replace 5.0 years professional enterprise quota."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Sales assistant internships do not satisfy Senior Enterprise Sales Manager level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified independent enterprise corporate broker meets tenure and deal requirements."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment span is 2.5 years < 5.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get CSP cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "Scrum Master cert does not grant enterprise sales bonus."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "German TestDaF B2 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Networking buzzwords lack enterprise B2B sales quota evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Customer Service Call Center director lacks B2B outbound sales competencies."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Purchasing/Procurement is buyer-side, lacking enterprise selling & revenue generation."),
    }
