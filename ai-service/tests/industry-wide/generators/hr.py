from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-hr-manager-05",
        title="Senior Talent Acquisition & HRBP Manager",
        description=(
            "NexTech Corporation is seeking a dynamic Senior Talent Acquisition & HRBP Manager to drive organizational growth. "
            "You will lead end-to-end tech and business talent acquisition, partner directly with executive leadership as an HRBP, "
            "manage performance review cycles, maintain strict compliance with Vietnamese Labor Law, and resolve complex employee relations matters."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 5+ years of strategic talent acquisition and HR business partnering experience.\n"
            "- Core Technical Skills: Talent Acquisition, HRBP, Labor Law, Performance Management, Employee Relations.\n"
            "- Preferred Skills: HRIS implementation, Compensation and Benefits (C&B), OKR/KPI frameworks.\n"
            "- Education: Bachelor's degree or above in Human Resource Management, Business Administration, Psychology, Law, or related field.\n"
            "- Language: Fluent English (IELTS 6.5 or equivalent) for international leadership collaboration.\n"
            "- Certifications: SHRM-CP or PHR certification preferred."
        ),
        required_experience_years=5.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "Talent Acquisition", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "HRBP", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Labor Law", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Performance Management", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Employee Relations", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "HRIS", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "Compensation and Benefits", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "SHRM-CP", "is_mandatory": False},
        ],
        required_languages=[
            {"language": "English", "proficiency": "IELTS 6.5", "is_mandatory": True},
        ],
        ai_weights_config={"skills": 35.0, "experience": 35.0, "education": 15.0, "other": 15.0},
    )


def get_candidates() -> Dict[str, Dict[str, Any]]:
    cands = {}

    # CV01: Near Perfect Match
    cands["CV01"] = make_candidate(
        candidate_name="Vũ Hoàng Yến",
        desired_title="Senior Talent Acquisition & HRBP Manager",
        professional_summary="Senior HRBP with 6 years leading tech recruiting, Vietnamese Labor Law compliance, and annual performance appraisals.",
        work_experiences=[
            make_exp(
                company_name="Grab Vietnam",
                position_title="Senior HRBP Lead",
                start_date="2021-03-01T00:00:00Z",
                is_current=True,
                description="Lead Talent Acquisition and HRBP for 400+ engineering staff. Ensure strict adherence to Labor Law, oversee semi-annual Performance Management reviews and resolve Employee Relations grievances.",
                achievements="Reduced company-wide voluntary employee turnover from 18% to 9%."
            ),
            make_exp(
                company_name="Shopee Vietnam",
                position_title="Talent Acquisition Specialist",
                start_date="2018-01-01T00:00:00Z",
                end_date="2021-02-28T00:00:00Z",
                description="Managed high-volume hiring pipelines, salary benchmarking, and employee onboarding.",
                achievements="Hired over 120 software engineers per year."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations", "HRIS", "Compensation and Benefits"],
        certificates=[{"certificate_name": "SHRM-CP", "issuing_organization": "SHRM"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Thu Hương",
        desired_title="HRBP Manager",
        professional_summary="Human Resources Business Partner with 5.5 years in Talent Acquisition, Vietnamese Labor Law, and Performance Management.",
        work_experiences=[
            make_exp(
                company_name="Masan High-Tech Materials",
                position_title="Senior HRBP",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Lead Talent Acquisition for corporate division, partner as HRBP with business unit heads, ensure Labor Law compliance, administer Performance Management and Employee Relations.",
                achievements="Streamlined performance appraisal process across 600 employees."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Social Sciences and Humanities",
                major="Industrial Psychology",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Labor Law)
    cands["CV03"] = make_candidate(
        candidate_name="Lê Quốc Tuấn",
        desired_title="Talent Acquisition Lead",
        professional_summary="Technical Recruiter with 5.5 years in sourcing and recruitment agency headhunting, lacking legal labor compliance experience.",
        work_experiences=[
            make_exp(
                company_name="Adecco Vietnam",
                position_title="Senior Recruitment Consultant",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Source candidates, conduct candidate screenings, act as external HRBP, track Performance Management KPIs. Employment contracts and Labor Law handled exclusively by client legal depts.",
                achievements="Billed $150K in headhunting placement fees."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Performance Management", "Employee Relations"],
        certificates=[{"certificate_name": "SHRM-CP", "issuing_organization": "SHRM"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (Office Administrator / Front Desk Receptionist)
    cands["CV04"] = make_candidate(
        candidate_name="Phạm Bích Vân",
        desired_title="Office Administrator",
        professional_summary="Office Admin with 6 years ordering snacks, booking flights, scheduling meeting rooms, and receiving couriers.",
        work_experiences=[
            make_exp(
                company_name="Minh Phuc Software",
                position_title="Senior Office Administrator",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Manage front reception desk, order office stationery, organize employee birthday parties, approve cleaning staff invoices. No hiring, labor contracts, or performance evaluations.",
                achievements="Kept office supply budget 10% under budget."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Office Administration",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Office Administration", "Stationery Management", "Travel Booking", "Event Logistics", "Reception Desk"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV05: Education Major Trap (Civil Engineering)
    cands["CV05"] = make_candidate(
        candidate_name="Ngô Văn Nam",
        desired_title="HRBP Manager",
        professional_summary="HR professional with 5.5 years in Talent Acquisition and Labor Law, holding an engineering degree.",
        work_experiences=[
            make_exp(
                company_name="Coteccons Construction",
                position_title="Senior HRBP",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage Talent Acquisition, HRBP functions, Labor Law contracts, Performance Management appraisals, and Employee Relations.",
                achievements="Managed HR operations for 500 site workers."
            )
        ],
        educations=[
            make_edu(
                school_name="National University of Civil Engineering",
                major="Civil Bridge & Road Engineering",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[{"certificate_name": "SHRM-CP", "issuing_organization": "SHRM"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (PhD in Astrophysics)
    cands["CV06"] = make_candidate(
        candidate_name="Bùi Phương Thúy",
        desired_title="HR Manager",
        professional_summary="HR specialist with 5.2 years in HRBP and Talent Acquisition, holding a PhD in Theoretical Astrophysics.",
        work_experiences=[
            make_exp(
                company_name="TMA Solutions",
                position_title="HRBP Lead",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Lead Talent Acquisition, HRBP advisory, Labor Law compliance, Performance Management, and Employee Relations.",
                achievements="Standardized employee handbook."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Academy of Science and Technology",
                major="Theoretical Astrophysics",
                degree="Doctorate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV07: Experience Threshold Trap (1.8 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Đỗ Gia Hân",
        desired_title="HR Executive",
        professional_summary="Junior HR specialist with 1.8 years assisting in onboarding and recruitment coordination.",
        work_experiences=[
            make_exp(
                company_name="FPT Telecom",
                position_title="Talent Acquisition Executive",
                start_date="2022-09-01T00:00:00Z",
                is_current=True,
                description="Assist in Talent Acquisition, support HRBP, draft basic Labor Law letters, help with Performance Management and Employee Relations.",
                achievements="Scheduled 200+ technical interviews."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Factory Security Shift Dispatcher)
    cands["CV08"] = make_candidate(
        candidate_name="Lâm Văn Bình",
        desired_title="Security Workforce Supervisor",
        professional_summary="Security Supervisor with 5.5 years assigning patrol shifts to factory gate security guards.",
        work_experiences=[
            make_exp(
                company_name="Yuki Sepre 24 Security",
                position_title="Security Guard Dispatcher",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Assign 3-shift rotation rosters for 80 security guards at industrial park gates, issue uniforms, check guard attendance logs. No white-collar talent acquisition or corporate HRBP.",
                achievements="Ensured 24/7 guard gate coverage with zero site break-ins."
            )
        ],
        educations=[
            make_edu(
                school_name="People's Police University",
                major="Law Enforcement",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Shift Scheduling", "Patrol Rostering", "Security Inspection", "Attendance Checking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Only university mock interviews)
    cands["CV09"] = make_candidate(
        candidate_name="Hoàng Thị Mai Phương",
        desired_title="HR Associate",
        professional_summary="Recent graduate who organized student mock interview fairs and career talkshows.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="University Career Fair 2023",
                project_role="Student HR Coordinator",
                description="Organized mock hiring booths and conducted CV review workshops for student participants.",
                technologies=["Talent Acquisition", "HRBP", "Performance Management", "Labor Law"],
                start_date="2023-08-01T00:00:00Z",
                end_date="2023-11-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV10: Internship Trap (Repeated resume sourcer internships)
    cands["CV10"] = make_candidate(
        candidate_name="Nguyễn Đức Thịnh",
        desired_title="HR Trainee",
        professional_summary="Candidate with multiple short recruitment internships totaling 3.5 years part-time.",
        work_experiences=[
            make_exp(
                company_name="ManpowerGroup Vietnam",
                position_title="Recruitment Sourcing Intern",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Search LinkedIn profiles, copy email addresses into spreadsheets."
            ),
            make_exp(
                company_name="Navigos Search",
                position_title="Talent Acquisition Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Call candidates to check availability and format resumes into standard company agency templates."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (5 years freelance HR consultant & executive recruiter)
    cands["CV11"] = make_candidate(
        candidate_name="Trần Thị Bích Ngọc",
        desired_title="Senior Freelance HR Consultant",
        professional_summary="Independent HR Consultant with 5.5 years establishing Talent Acquisition funnels, Labor Law compliant contracts, and HRBP strategies for SMEs.",
        work_experiences=[
            make_exp(
                company_name="Bich Ngoc HR Advisory Services",
                position_title="Principal HR Consultant",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Provide end-to-end Talent Acquisition, fractional HRBP support, Labor Law compliant contracts, Performance Management KPI systems, and Employee Relations resolution for 15 corporate clients.",
                achievements="Successfully built core teams for 8 tech startups."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[{"certificate_name": "SHRM-CP", "issuing_organization": "SHRM"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV12: Overlapping Dates (2.2 calendar years claiming 5.0 years)
    cands["CV12"] = make_candidate(
        candidate_name="Lê Đình Long",
        desired_title="HR Manager",
        professional_summary="HR specialist claiming overlapping concurrent HR positions.",
        work_experiences=[
            make_exp(
                company_name="Tan Viet Securities",
                position_title="HR Specialist",
                start_date="2021-08-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Manage Talent Acquisition and Labor Law."
            ),
            make_exp(
                company_name="An Binh Commercial Bank (Concurrent)",
                position_title="HRBP Officer",
                start_date="2021-10-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent HRBP assignment."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (Google Project Management cert instead of SHRM)
    cands["CV13"] = make_candidate(
        candidate_name="Võ Minh Hoàng",
        desired_title="HRBP Manager",
        professional_summary="HRBP manager with 5.5 years experience holding Google Project Management professional certificate.",
        work_experiences=[
            make_exp(
                company_name="LG Display Vietnam",
                position_title="Senior HRBP",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Oversee Talent Acquisition, HRBP advisory, Labor Law compliance, Performance Management, and Employee Relations.",
                achievements="Standardized hiring SLA down to 21 days."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[{"certificate_name": "Google Project Management Certificate", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (CISSP Information Security)
    cands["CV14"] = make_candidate(
        candidate_name="Đặng Tuấn Kiệt",
        desired_title="HRBP Manager",
        professional_summary="HRBP manager with 5.5 years experience holding CISSP cybersecurity certification.",
        work_experiences=[
            make_exp(
                company_name="VNG Corporation",
                position_title="Senior HRBP Lead",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Deliver Talent Acquisition, HRBP leadership, Labor Law compliance, Performance Management, and Employee Relations.",
                achievements="Managed retention program across 300 developers."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Social Sciences and Humanities",
                major="Psychology",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[{"certificate_name": "CISSP Certified Information Systems Security Professional", "issuing_organization": "ISC2"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Phạm Văn Dũng",
        desired_title="HR Manager",
        professional_summary="HR specialist with 5.5 years experience, IELTS 5.0 English level.",
        work_experiences=[
            make_exp(
                company_name="Kinh Do Bakery",
                position_title="HR Manager",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Lead Talent Acquisition, HRBP, Labor Law compliance, Performance Management, and Employee Relations.",
                achievements="Handled all factory labor agreements."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Human Resource Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (French DELF B2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Trương Quỳnh Chi",
        desired_title="HRBP Specialist",
        professional_summary="HRBP specialist with 5.5 years experience, fluent in French.",
        work_experiences=[
            make_exp(
                company_name="Sanofi Vietnam",
                position_title="Senior HRBP",
                start_date="2018-12-01T00:00:00Z",
                is_current=True,
                description="Coordinate Talent Acquisition, HRBP functions, Labor Law statutory reports, Performance Management, and Employee Relations.",
                achievements="Managed French expatriate relocation."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="French Studies and Business",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Talent Acquisition", "HRBP", "Labor Law", "Performance Management", "Employee Relations"],
        certificates=[],
        languages=[{"language": "French", "proficiency": "DELF B2"}]
    )

    # CV17: Semantic Similarity Trap (Corporate Culture Buzzwords without HR proof)
    cands["CV17"] = make_candidate(
        candidate_name="Lê Hoài Nam",
        desired_title="Workplace Happiness Alchemist",
        professional_summary="Corporate aura curator radiating unconditional empathy, cosmic motivational vibes, and holistic happiness vibrations.",
        work_experiences=[
            make_exp(
                company_name="Mindful Workspace Hub",
                position_title="Happiness Champion",
                start_date="2018-05-01T00:00:00Z",
                is_current=True,
                description="Set up indoor potted plants, run morning yoga mindfulness circles, lead laughter therapy sessions. Never drafted employment contracts or resolved labor union disputes.",
                achievements="Hosted 100 positive energy workshops."
            )
        ],
        educations=[
            make_edu(
                school_name="Van Lang University",
                major="Public Relations",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Workplace Happiness", "Yoga Mindfulness", "Public Speaking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Nguyễn Văn Hải",
        desired_title="HR Manager",
        professional_summary="HR professional in recruitment.",
        work_experiences=[
            make_exp(
                company_name="Recruitment Firm",
                position_title="HR Officer",
                start_date="",
                description="Recruit staff."
            )
        ],
        educations=[],
        skills=["Talent Acquisition", "HRBP"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Corporate Patent Litigation Lawyer)
    cands["CV19"] = make_candidate(
        candidate_name="Đoàn Quốc Cường",
        desired_title="Senior Patent Litigation Counsel",
        professional_summary="Senior Intellectual Property Attorney with 8 years litigating patent infringements and international commercial arbitration cases.",
        work_experiences=[
            make_exp(
                company_name="YKVN Law Firm",
                position_title="Senior IP Litigation Associate",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Represent clients in courtroom IP dispute trials, file patent claims with National Office of Intellectual Property. No talent acquisition, employee onboarding, or performance appraisals.",
                achievements="Won $5M trademark settlement for international pharmaceutical brand."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Law University",
                major="Commercial Law",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["Intellectual Property Law", "Patent Litigation", "Arbitration", "Courtroom Defense", "Contract Drafting"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 8.0"}]
    )

    # CV20: Cross-Domain Near Match (Internal PR & Communications Specialist)
    cands["CV20"] = make_candidate(
        candidate_name="Nguyễn Ngọc Mai",
        desired_title="Internal Communications Specialist",
        professional_summary="Internal Communications Specialist with 5.5 years designing corporate newsletters, town hall slide decks, and employee engagement videos.",
        work_experiences=[
            make_exp(
                company_name="Vinfast Group",
                position_title="Senior Internal Communications Executive",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Write CEO emails, edit internal monthly magazines, host year-end company party. Never executed candidate sourcing, labor dispute mediation, or performance PIPs.",
                achievements="Achieved 80% readership on internal employee portal."
            )
        ],
        educations=[
            make_edu(
                school_name="Academy of Journalism and Communication",
                major="Public Relations",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Internal Communications", "Employee Engagement", "Newsletter Writing", "Event Emcee"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 6 yrs experience, SHRM cert, IELTS 7.5, HR degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional SHRM certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Labor Law skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Office stationery reception is not strategic Talent Acquisition and HRBP."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Civil Bridge Engineering fails HR/Psychology/Law major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Doctorate in Astrophysics fails HR/Business/Law field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.8 years experience vs required 5.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Security guard shift scheduling lacks white-collar TA and corporate HRBP."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "Student career fair projects cannot replace 5.0 years professional HR experience."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "LinkedIn sourcer internships do not satisfy Senior HR Manager level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance HR consultant meets tenure, skills, and corporate compliance."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment duration is 2.2 years < 5.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get SHRM cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "CISSP cyber cert does not grant HR bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "French DELF B2 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Workplace aura buzzwords lack concrete Labor Law and TA evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Patent Litigation Attorney lacks Talent Acquisition, HRBP, and employee performance operations."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Internal PR / Newsletter editor lacks TA, Labor Law, and HRBP competencies."),
    }
