from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-it-backend-01",
        title="Senior Backend Engineer",
        description=(
            "VNG Tech Solutions is expanding our core fintech and distributed payments platform. "
            "We are seeking an experienced Senior Backend Engineer to architect, build, and optimize "
            "mission-critical backend microservices handling millions of daily transactions. "
            "You will collaborate closely with DevOps, Frontend, and Data Platform teams to ensure "
            "fault tolerance, sub-100ms latency, and high system availability."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional experience: Minimum 4+ years of professional backend engineering experience.\n"
            "- Core Technical Skills: Strong hands-on proficiency in Java, Spring Boot, PostgreSQL, Docker, Microservices.\n"
            "- Preferred Skills: Apache Kafka, Kubernetes, AWS Cloud infrastructure.\n"
            "- Education: Bachelor's degree or above in Computer Science, Software Engineering, IT, or closely related technical field.\n"
            "- Language: Professional English proficiency (IELTS 6.5 or equivalent) for international technical collaboration.\n"
            "- Certifications: AWS Certified Solutions Architect is an advantage (preferred, not mandatory)."
        ),
        required_experience_years=4.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "Java", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Spring Boot", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "PostgreSQL", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Docker", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Microservices", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Kafka", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "Kubernetes", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "AWS Certified Solutions Architect", "is_mandatory": False},
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
        candidate_name="Lê Hoàng Long",
        desired_title="Senior Backend Engineer",
        professional_summary="Senior Backend Engineer with 5.5 years of expertise in Java microservices, high-throughput payment systems, and distributed databases.",
        work_experiences=[
            make_exp(
                company_name="MoMo Payment Systems",
                position_title="Senior Backend Engineer",
                start_date="2022-03-01T00:00:00Z",
                is_current=True,
                description="Architect and maintain core Java Spring Boot payment microservices handling 8,000 TPS. Optimize PostgreSQL query execution plans and database sharding. Deploy distributed event pipelines using Apache Kafka and Docker.",
                achievements="Reduced transaction latency by 35% and scaled system to support Tet peak volume without downtime."
            ),
            make_exp(
                company_name="FPT Software Global",
                position_title="Backend Software Engineer",
                start_date="2019-01-01T00:00:00Z",
                end_date="2022-02-28T00:00:00Z",
                is_current=False,
                description="Built RESTful APIs with Java, Spring Framework, PostgreSQL, and Docker containerization for Japanese fintech clients."
            )
        ],
        educations=[
            make_edu(school_name="Hanoi University of Science and Technology", major="Computer Science", degree="Bachelor", start_date="2014-09-01T00:00:00Z", end_date="2018-06-30T00:00:00Z")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices", "Kafka", "Kubernetes", "AWS", "Redis"],
        certificates=[{"certificate_name": "AWS Certified Solutions Architect - Associate", "issuing_organization": "Amazon Web Services"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}],
        projects=[
            make_proj(project_name="High-scale Wallet Engine", project_role="Lead Backend Architect", description="Engineered ledger service with Java, Kafka, and PostgreSQL.", technologies=["Java", "Spring Boot", "PostgreSQL", "Kafka", "Docker"])
        ]
    )

    # CV02: Strong Match (missing AWS cert)
    cands["CV02"] = make_candidate(
        candidate_name="Nguyễn Thế Dũng",
        desired_title="Senior Backend Developer",
        professional_summary="Backend Engineer with 4.5 years developing resilient microservices in Java Spring Boot and relational database design.",
        work_experiences=[
            make_exp(
                company_name="ZaloPay",
                position_title="Senior Backend Engineer",
                start_date="2022-01-01T00:00:00Z",
                is_current=True,
                description="Design and implement backend microservices with Java, Spring Boot, PostgreSQL, and Docker container workflows."
            ),
            make_exp(
                company_name="TMA Solutions",
                position_title="Software Engineer",
                start_date="2019-08-01T00:00:00Z",
                end_date="2021-12-31T00:00:00Z",
                is_current=False,
                description="Developed backend endpoints with Java and PostgreSQL databases."
            )
        ],
        educations=[
            make_edu(school_name="VNU University of Engineering and Technology", major="Software Engineering", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices", "Kafka"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Docker)
    cands["CV03"] = make_candidate(
        candidate_name="Trần Văn Nam",
        desired_title="Backend Developer",
        professional_summary="Experienced Java enterprise developer with 5 years building on-premise monolithic and early microservice architectures.",
        work_experiences=[
            make_exp(
                company_name="Agribank Core Banking",
                position_title="Senior Java Developer",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Manage Java Spring Boot core banking services. Extensive SQL tuning on PostgreSQL and Oracle. Build microservices on traditional bare-metal servers."
            )
        ],
        educations=[
            make_edu(school_name="Post and Telecommunications Institute of Technology", major="Information Technology", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Microservices", "Oracle DB", "Linux"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (.NET C# instead of Java Spring Boot)
    cands["CV04"] = make_candidate(
        candidate_name="Vũ Đức Thắng",
        desired_title="Senior Backend Engineer",
        professional_summary="Backend engineer with 4.5 years developing enterprise distributed systems using C# .NET Core and Microsoft SQL Server.",
        work_experiences=[
            make_exp(
                company_name="NashTech Vietnam",
                position_title="Senior Backend Developer (.NET)",
                start_date="2020-01-01T00:00:00Z",
                is_current=True,
                description="Architect .NET Core microservices with Microsoft SQL Server, Azure Service Bus, and Docker containerization."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["C#", ".NET Core", "SQL Server", "Docker", "Microservices", "Azure", "Entity Framework"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV05: Education Major Trap (Bachelor in Accounting)
    cands["CV05"] = make_candidate(
        candidate_name="Phạm Thu Hà",
        desired_title="Senior Backend Engineer",
        professional_summary="Self-taught backend engineer with 5 years working in fintech software development with Java and Spring Boot.",
        work_experiences=[
            make_exp(
                company_name="Fintech V-Cash",
                position_title="Senior Java Developer",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Built Java Spring Boot backend microservices with PostgreSQL and Docker deployment."
            )
        ],
        educations=[
            make_edu(school_name="National Economics University", major="Kế toán (Accounting)", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (Master/PhD in Philosophy/History)
    cands["CV06"] = make_candidate(
        candidate_name="Đặng Tuấn Kiệt",
        desired_title="Backend Engineer",
        professional_summary="Backend developer holding advanced academic degree with 4.5 years coding Java microservices.",
        work_experiences=[
            make_exp(
                company_name="Saigon Tech Group",
                position_title="Senior Backend Engineer",
                start_date="2019-09-01T00:00:00Z",
                is_current=True,
                description="Backend development with Java, Spring Boot, PostgreSQL, Docker."
            )
        ],
        educations=[
            make_edu(school_name="University of Social Sciences and Humanities", major="Triết học (Philosophy)", degree="Master")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV07: Experience Threshold Trap (Only 2.2 years vs 4.0 required)
    cands["CV07"] = make_candidate(
        candidate_name="Bùi Quốc Huy",
        desired_title="Backend Engineer",
        professional_summary="Junior/Mid-level Java Backend Engineer with 2.2 years of fast-paced startup experience.",
        work_experiences=[
            make_exp(
                company_name="OnPoint E-commerce",
                position_title="Backend Developer",
                start_date="2022-06-01T00:00:00Z",
                end_date="2024-08-31T00:00:00Z",
                is_current=False,
                description="Developed Java Spring Boot APIs with PostgreSQL database and Docker containers."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Game Dev / Unity / C#)
    cands["CV08"] = make_candidate(
        candidate_name="Lâm Quang Vinh",
        desired_title="Game & Graphics Engineer",
        professional_summary="Senior Game Developer with 5 years designing 3D mobile games using Unity, C#, and local SQLite storage.",
        work_experiences=[
            make_exp(
                company_name="Amanotes",
                position_title="Senior Unity Game Developer",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Develop mobile music games with Unity3D, C#, shaders, and gameplay logic."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Information Technology", degree="Bachelor")
        ],
        skills=["Unity", "C#", "Game Physics", "3D Animation", "SQLite"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Academic/Hobby projects only)
    cands["CV09"] = make_candidate(
        candidate_name="Hồ Minh Triết",
        desired_title="Backend Engineer",
        professional_summary="Fresh graduate with 8 extensive pet projects building Java Spring Boot microservices on GitHub.",
        work_experiences=[
            make_exp(
                company_name="Local Freelance Client",
                position_title="Junior Web Assistant",
                start_date="2024-01-01T00:00:00Z",
                end_date="2024-05-31T00:00:00Z",
                is_current=False,
                description="Assisted in maintaining basic websites for 5 months."
            )
        ],
        educations=[
            make_edu(school_name="UIT - VNU HCM", major="Software Engineering", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices", "Kafka"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}],
        projects=[
            make_proj(project_name="E-Commerce Microservices", project_role="Creator", description="Built 6 microservices with Spring Cloud and PostgreSQL.", technologies=["Java", "Spring Boot", "PostgreSQL", "Docker"]),
            make_proj(project_name="Chat Server", project_role="Creator", description="Built WebSocket chat in Java.", technologies=["Java", "Docker"])
        ]
    )

    # CV10: Internship Trap (2.5 years of multiple internships, no full-time role)
    cands["CV10"] = make_candidate(
        candidate_name="Ngô Gia Bảo",
        desired_title="Backend Intern / Trainee",
        professional_summary="Dedicated software engineering graduate who completed 4 consecutive internships across major tech companies.",
        work_experiences=[
            make_exp(
                company_name="Shopee Vietnam",
                position_title="Backend Engineering Intern",
                start_date="2023-01-01T00:00:00Z",
                end_date="2023-09-30T00:00:00Z",
                is_current=False,
                description="Supported bug fixes in Java microservices under senior engineer mentorship."
            ),
            make_exp(
                company_name="VNG Corporation",
                position_title="Java Developer Intern",
                start_date="2022-03-01T00:00:00Z",
                end_date="2022-11-30T00:00:00Z",
                is_current=False,
                description="Wrote unit tests and basic PostgreSQL queries."
            ),
            make_exp(
                company_name="DEK Technologies",
                position_title="Software Intern",
                start_date="2021-06-01T00:00:00Z",
                end_date="2022-01-31T00:00:00Z",
                is_current=False,
                description="Assisted software testing team."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (4.5 years freelance contract developer)
    cands["CV11"] = make_candidate(
        candidate_name="Hoàng Trọng Nghĩa",
        desired_title="Freelance Backend Developer",
        professional_summary="Independent software consultant with 4.5 years delivering Java Spring Boot backend APIs for international freelance clients.",
        work_experiences=[
            make_exp(
                company_name="Upwork Global Clients",
                position_title="Freelance Backend Developer",
                start_date="2019-09-01T00:00:00Z",
                is_current=True,
                description="Developed custom REST APIs, Spring Boot microservices, PostgreSQL databases, and Docker deployment configs for freelance projects."
            )
        ],
        educations=[
            make_edu(school_name="Da Nang University of Technology", major="Information Technology", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices", "REST API"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV12: Overlapping Dates (2 concurrent jobs in same 2.5 yr span -> true span is 2.5 yrs < 4.0)
    cands["CV12"] = make_candidate(
        candidate_name="Đỗ Nhật Minh",
        desired_title="Backend Engineer",
        professional_summary="Software engineer managing multiple concurrent backend engagements simultaneously.",
        work_experiences=[
            make_exp(
                company_name="Alpha Tech Corp",
                position_title="Backend Engineer",
                start_date="2022-01-01T00:00:00Z",
                end_date="2024-06-30T00:00:00Z",
                is_current=False,
                description="Java Spring Boot development on PostgreSQL."
            ),
            make_exp(
                company_name="Beta Solutions Ltd",
                position_title="Backend Consultant",
                start_date="2022-06-01T00:00:00Z",
                end_date="2024-06-30T00:00:00Z",
                is_current=False,
                description="Part-time backend development with Java and Docker."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (Oracle Java OCA instead of AWS Solutions Architect)
    cands["CV13"] = make_candidate(
        candidate_name="Mai Thanh Tùng",
        desired_title="Senior Backend Engineer",
        professional_summary="Senior Java Engineer with 5 years hands-on microservices development and certified Java language proficiency.",
        work_experiences=[
            make_exp(
                company_name="Viettel Digital",
                position_title="Senior Backend Engineer",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Engineered core backend services using Java, Spring Boot, PostgreSQL, Docker, and Microservices."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Software Engineering", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[{"certificate_name": "Oracle Certified Associate, Java SE 8 Programmer", "issuing_organization": "Oracle"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (Google Digital Garage, HubSpot Marketing)
    cands["CV14"] = make_candidate(
        candidate_name="Lý Văn Tuấn",
        desired_title="Backend Engineer",
        professional_summary="Backend Developer with 4.5 years experience in Java Spring Boot holding business & marketing certifications.",
        work_experiences=[
            make_exp(
                company_name="Sendo Vietnam",
                position_title="Backend Engineer",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Implemented backend Java microservices with PostgreSQL and Docker containers."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[
            {"certificate_name": "Google Digital Garage Fundamentals", "issuing_organization": "Google"},
            {"certificate_name": "HubSpot Inbound Marketing Certification", "issuing_organization": "HubSpot"}
        ],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Dương Hữu Tài",
        desired_title="Senior Backend Engineer",
        professional_summary="Senior Java Engineer with 5 years experience in distributed architectures with basic technical English.",
        work_experiences=[
            make_exp(
                company_name="Tiki Corporation",
                position_title="Senior Backend Engineer",
                start_date="2019-05-01T00:00:00Z",
                is_current=True,
                description="Built high-performance Java Spring Boot services with PostgreSQL and Docker."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (JLPT N1 Japanese, no English certification)
    cands["CV16"] = make_candidate(
        candidate_name="Trịnh Quốc Bảo",
        desired_title="Senior Backend Bridge Engineer (BrSE)",
        professional_summary="Senior Backend Engineer with 5 years building Java microservices for Japan offshore projects, fluent in Japanese.",
        work_experiences=[
            make_exp(
                company_name="RikkeiSoft",
                position_title="Senior Java Developer",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Built enterprise Java Spring Boot backends with PostgreSQL, Docker, and Microservices."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Information Technology", degree="Bachelor")
        ],
        skills=["Java", "Spring Boot", "PostgreSQL", "Docker", "Microservices"],
        certificates=[],
        languages=[{"language": "Japanese", "proficiency": "JLPT N1"}]
    )

    # CV17: Semantic Similarity Trap (Buzzwords with no actual implementation)
    cands["CV17"] = make_candidate(
        candidate_name="Đoàn Trọng Khang",
        desired_title="Software Architect",
        professional_summary="Strategic IT technologist driving computational paradigms, cloud synergy, and advanced architectural concepts.",
        work_experiences=[
            make_exp(
                company_name="Tech Innovation Consultancy",
                position_title="Software Solutions Advisor",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Provided high-level advice on system architecture, cloud adoption, digital transformation, and database modernization."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["Software Architecture", "System Design", "Cloud Computing", "Digital Transformation"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV18: Missing Information (No education, no start dates)
    cands["CV18"] = make_candidate(
        candidate_name="Lưu Đình Trọng",
        desired_title="Senior Backend Developer",
        professional_summary="Experienced Java Backend developer.",
        work_experiences=[
            make_exp(
                company_name="Confidential IT Firm",
                position_title="Backend Developer",
                start_date=None,
                end_date=None,
                is_current=True,
                description="Develop backend APIs with Java and PostgreSQL."
            )
        ],
        educations=[],
        skills=["Java", "PostgreSQL"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Senior iOS Mobile Lead, 7 yrs)
    cands["CV19"] = make_candidate(
        candidate_name="Nguyễn Tuấn Anh",
        desired_title="Senior iOS Mobile Lead",
        professional_summary="Lead Mobile Engineer with 7 years developing top-charting iOS applications in Swift, SwiftUI, and mobile CI/CD.",
        work_experiences=[
            make_exp(
                company_name="Grab Vietnam",
                position_title="Lead iOS Engineer",
                start_date="2017-06-01T00:00:00Z",
                is_current=True,
                description="Lead iOS engineering team of 12. Built Swift architecture, Combine, CoreData, and App Store releases."
            )
        ],
        educations=[
            make_edu(school_name="HUST", major="Computer Science", degree="Bachelor")
        ],
        skills=["iOS", "Swift", "SwiftUI", "Xcode", "CocoaPods", "Mobile Architecture"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV20: Cross-Domain Near Match (Senior Data Analyst transitioning to backend, Python/SQL)
    cands["CV20"] = make_candidate(
        candidate_name="Bùi Ngọc Trâm",
        desired_title="Data & Backend Engineer",
        professional_summary="Senior Data Analyst with 5 years experience querying PostgreSQL and writing Python ETL pipelines, seeking transition to backend.",
        work_experiences=[
            make_exp(
                company_name="Shopee Analytics",
                position_title="Senior Data Analyst",
                start_date="2019-06-01T00:00:00Z",
                is_current=True,
                description="Built high-performance SQL analytical queries on PostgreSQL and data automation scripts in Python."
            )
        ],
        educations=[
            make_edu(school_name="NEU", major="Information Systems", degree="Bachelor")
        ],
        skills=["Python", "PostgreSQL", "SQL", "Tableau", "ETL", "Data Pipelines"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory criteria with 5.5 yrs Java/Spring Boot experience and AWS cert."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory requirements, missing optional AWS certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 70.0, 85.0, "Missing mandatory Docker skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 40.0, 65.0, "C#/.NET Core is not equivalent to Java Spring Boot."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Bachelor in Accounting is incompatible with Computer Science."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Master in Philosophy fails specialized technical degree requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 65.0, 80.0, "Has 2.2 years vs required 4.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Unity Game dev has incompatible business domain context."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 40.0, 65.0, "Projects cannot replace 4.0 years of full-time professional experience."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 50.0, 75.0, "Internship duration does not meet Senior level requirement."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Meets skills and tenure via freelance contracts."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 65.0, 80.0, "Non-overlapping span is 2.5 years < 4.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get AWS cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "Unrelated marketing certs should not give bonus points for backend role."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Japanese JLPT N1 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 60.0, "Buzzwords without code evidence cannot match core Java/PostgreSQL."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 35.0, 60.0, "iOS Mobile lead is wrong subdomain for backend role."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 45.0, 70.0, "Data analyst has transferable SQL but lacks Java Spring Boot."),
    }
