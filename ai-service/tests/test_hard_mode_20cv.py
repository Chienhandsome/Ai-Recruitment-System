import json
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
from app.services.matching.matching_engine import matching_engine


def get_novacommerce_jd() -> JobPayload:
    return JobPayload(
        id="job-novacommerce-01",
        title="Senior Performance Marketing Specialist",
        description=(
            "NovaCommerce is a growing e-commerce company operating across several consumer categories "
            "in Vietnam and Southeast Asia. Our Growth team is responsible for acquiring new customers, "
            "improving conversion across digital channels, and scaling profitable revenue. "
            "We are looking for a Senior Performance Marketing Specialist who can take ownership of "
            "paid acquisition campaigns while working closely with Content, E-commerce, Product and Data teams. "
            "This is not a pure media-buying role. The person is expected to understand advertising performance, "
            "website behavior, customer acquisition cost (CAC), ROAS and revenue."
        ),
        requirements=(
            "Required qualifications:\n"
            "- Professional experience: At least 3 years of professional experience in Digital Marketing, "
            "Performance Marketing, Paid Media or closely related role. Experience managing acquisition campaigns.\n"
            "- Technical skills: Google Ads, Meta Ads, GA4, Performance Marketing, Campaign optimization, "
            "Conversion analysis. Experience with A/B testing and ROAS/CAC optimization.\n"
            "- Education: Bachelor's degree or above. Preferred fields: Marketing, Digital Marketing, "
            "Business Administration, E-commerce or closely related business field.\n"
            "- English: Professional English communication is required. Candidates should have IELTS 6.5 or equivalent.\n"
            "- Certifications: Google Ads or Meta certification is an advantage. It is not mandatory."
        ),
        required_experience_years=3,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            JobRequiredSkill(skill_name="Google Ads", is_mandatory=True),
            JobRequiredSkill(skill_name="Meta Ads", is_mandatory=True),
            JobRequiredSkill(skill_name="GA4", is_mandatory=True),
            JobRequiredSkill(skill_name="Performance Marketing", is_mandatory=True),
            JobRequiredSkill(skill_name="Campaign Optimization", is_mandatory=False),
            JobRequiredSkill(skill_name="Conversion Analysis", is_mandatory=False),
        ],
        required_certificates=[
            JobRequiredCertificate(certificate_name="Google Ads Certification", is_mandatory=False),
            JobRequiredCertificate(certificate_name="Meta Certified Digital Marketing Associate", is_mandatory=False),
        ],
        required_languages=[
            JobRequiredLanguage(language="English", proficiency="IELTS 6.5", is_mandatory=True),
        ],
        ai_weights_config={"skills": 35, "experience": 30, "education": 15, "other": 20},
    )


def get_weights() -> JobWeightsConfig:
    return JobWeightsConfig(skills=35, experience=30, education=15, other=20)


def get_20_candidates() -> dict:
    candidates = {}

    # CV01: Nguyễn Minh Anh - Strong benchmark candidate
    candidates["CV01"] = CandidateProfilePayload(
        candidate_name="Nguyễn Minh Anh",
        desired_title="Senior Performance Marketing Specialist",
        professional_summary=(
            "Digital marketing professional with more than five years of experience working across "
            "e-commerce, consumer technology and digital agencies. Focused on paid acquisition and "
            "performance optimization from campaign setup to post-click conversion analysis."
        ),
        work_experiences=[
            WorkExperience(
                company_name="HomeCart Vietnam",
                position_title="Senior Performance Marketing Specialist",
                start_date="2023-03-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description=(
                    "Own paid acquisition across Google and Meta for e-commerce categories. "
                    "Manage monthly advertising budgets based on CAC, ROAS and revenue targets. "
                    "Build GA4 reports to monitor acquisition and conversion funnels. "
                    "Run structured A/B tests across audiences, creatives and landing pages."
                ),
            ),
            WorkExperience(
                company_name="BrightWave Agency",
                position_title="Digital Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2023-02-28T00:00:00Z",
                is_current=False,
                description="Managed Google and Meta campaigns for retail clients. Supported analytics and reporting.",
            ),
        ],
        educations=[
            Education(
                school_name="University of Economics Ho Chi Minh City",
                major="Marketing",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-30T00:00:00Z",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="Paid Media"),
            CandidateSkill(skill_name="Conversion Rate Optimization"),
            CandidateSkill(skill_name="A/B Testing"),
            CandidateSkill(skill_name="ROAS Optimization"),
            CandidateSkill(skill_name="CAC Analysis"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Search Certification"),
            CandidateCertificate(certificate_name="Meta Certified Digital Marketing Associate"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV02: Trần Quốc Bảo - Strong fit, Business Administration
    candidates["CV02"] = CandidateProfilePayload(
        candidate_name="Trần Quốc Bảo",
        desired_title="Performance Marketing Specialist",
        professional_summary="Performance-focused marketer with approximately 4 years of experience in digital acquisition.",
        work_experiences=[
            WorkExperience(
                company_name="ShopHub",
                position_title="Performance Marketing Specialist",
                start_date="2022-07-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google Ads Search and Performance Max. Operate Meta Ads for acquisition. GA4 data.",
            ),
            WorkExperience(
                company_name="MarketOne",
                position_title="Digital Marketing Executive",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-30T00:00:00Z",
                is_current=False,
                description="Supported paid media, Google Ads and Facebook campaign setup.",
            ),
        ],
        educations=[
            Education(
                school_name="University of Finance and Marketing",
                major="Business Administration",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="Paid Social"),
            CandidateSkill(skill_name="Search Advertising"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.0"),
        ],
    )

    # CV03: Lê Hoàng Nam - Near-miss language trap (IELTS 6.0 < 6.5)
    candidates["CV03"] = CandidateProfilePayload(
        candidate_name="Lê Hoàng Nam",
        desired_title="Performance Marketing Specialist",
        professional_summary="Performance marketing specialist with strong direct-response and e-commerce background.",
        work_experiences=[
            WorkExperience(
                company_name="EcomPlus",
                position_title="Performance Marketing Specialist",
                start_date="2021-02-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google and Meta acquisition campaigns. Monitor ROAS, CAC. GA4 reports.",
            )
        ],
        educations=[
            Education(
                school_name="FPT University",
                major="Digital Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="A/B Testing"),
            CandidateSkill(skill_name="CRO"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Search Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 6.0"),
        ],
    )

    # CV04: Phạm Nhật Minh - Language mismatch (JLPT N2, conversational English)
    candidates["CV04"] = CandidateProfilePayload(
        candidate_name="Phạm Nhật Minh",
        desired_title="Digital Marketing Specialist",
        professional_summary="Digital marketing specialist with 5 years experience in performance campaigns.",
        work_experiences=[
            WorkExperience(
                company_name="Global Retail Group",
                position_title="Digital Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Plan and optimize paid advertising campaigns on Google Ads and Meta Ads. GA4 traffic.",
            )
        ],
        educations=[
            Education(
                school_name="RMIT Vietnam",
                major="Business Administration",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="Paid Media"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="Japanese", proficiency="JLPT N2"),
            CandidateLanguage(language="English", proficiency="conversational"),
        ],
    )

    # CV05: Võ Thành Trung - Education major mismatch (Master Accounting vs Marketing)
    candidates["CV05"] = CandidateProfilePayload(
        candidate_name="Võ Thành Trung",
        desired_title="Performance Marketing Manager",
        professional_summary="Marketing professional with 6+ years in financial services and digital acquisition.",
        work_experiences=[
            WorkExperience(
                company_name="FintechOne",
                position_title="Performance Marketing Manager",
                start_date="2022-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google and Meta acquisition campaigns. CAC, conversion rates, GA4 funnels.",
            ),
            WorkExperience(
                company_name="FinanceHub",
                position_title="Digital Marketing Executive",
                start_date="2019-06-01T00:00:00Z",
                end_date="2021-12-31T00:00:00Z",
                is_current=False,
                description="Supported paid search and social advertising.",
            ),
        ],
        educations=[
            Education(
                school_name="University of Economics",
                major="Kế toán (Accounting)",
                degree="Thạc sĩ (Master)",
                start_date="2019-01-01T00:00:00Z",
                end_date="2021-12-31T00:00:00Z",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV06: Nguyễn Thảo Vy - Qualified mid/senior
    candidates["CV06"] = CandidateProfilePayload(
        candidate_name="Nguyễn Thảo Vy",
        desired_title="Digital Marketing Specialist",
        professional_summary="Digital marketing specialist with experience across retail and consumer brands.",
        work_experiences=[
            WorkExperience(
                company_name="RetailPro",
                position_title="Digital Marketing Specialist",
                start_date="2023-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google and Meta campaigns. Monitor GA4 dashboards. Review conversion, A/B testing.",
            )
        ],
        educations=[
            Education(
                school_name="UEH",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="Campaign Optimization"),
            CandidateSkill(skill_name="A/B Testing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Meta Certified Digital Marketing Associate"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.0"),
        ],
    )

    # CV07: Đặng Quốc Huy - Domain / career transition mismatch (Engineering / Manufacturing)
    candidates["CV07"] = CandidateProfilePayload(
        candidate_name="Đặng Quốc Huy",
        desired_title="Engineering Manager",
        professional_summary="Engineering manager who transitioned into digital business operations after manufacturing.",
        work_experiences=[
            WorkExperience(
                company_name="AutoTech",
                position_title="Engineering Manager",
                start_date="2019-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage team of engineers, manufacturing projects, suppliers, CAD, budgets.",
            )
        ],
        educations=[
            Education(
                school_name="HCMC University of Technology",
                major="Cơ khí chế tạo máy (Mechanical Engineering)",
                degree="Bachelor",
            )
        ],
        projects=[
            CandidateProject(
                project_name="Internal Digital Marketing Initiative",
                description="Supported marketing team by reviewing website traffic and online ads.",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Project Management"),
            CandidateSkill(skill_name="Manufacturing"),
            CandidateSkill(skill_name="SolidWorks"),
            CandidateSkill(skill_name="CAD"),
            CandidateSkill(skill_name="Team Leadership"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="PMP"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV08: Hoàng Đức Anh - Solid candidate with Google Digital Marketing & E-commerce Cert
    candidates["CV08"] = CandidateProfilePayload(
        candidate_name="Hoàng Đức Anh",
        desired_title="Performance Marketing Specialist",
        professional_summary="Performance marketer with 5 years experience across agency and in-house.",
        work_experiences=[
            WorkExperience(
                company_name="DigitalHub",
                position_title="Performance Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage paid acquisition across Google and Meta. GA4 analysis. ROAS, CAC, conversion.",
            )
        ],
        educations=[
            Education(
                school_name="National Economics University",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="ROAS"),
            CandidateSkill(skill_name="CAC"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Digital Marketing & E-commerce Professional Certificate"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.0"),
        ],
    )

    # CV09: Nguyễn Quốc Việt - Unrelated certificate (CPA)
    candidates["CV09"] = CandidateProfilePayload(
        candidate_name="Nguyễn Quốc Việt",
        desired_title="Digital Marketing Specialist",
        professional_summary="Marketing specialist working in financial and professional-services sector.",
        work_experiences=[
            WorkExperience(
                company_name="FinanceMedia",
                position_title="Digital Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google and Meta campaigns. GA4 analytics reports. Lead generation.",
            )
        ],
        educations=[
            Education(
                school_name="Foreign Trade University",
                major="Business Administration",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="Lead Generation"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="CPA"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV10: Trương Gia Hân - Junior duration (< 3 years experience)
    candidates["CV10"] = CandidateProfilePayload(
        candidate_name="Trương Gia Hân",
        desired_title="Digital Marketing Specialist",
        professional_summary="Digital marketer with background in e-commerce growth and paid advertising.",
        work_experiences=[
            WorkExperience(
                company_name="StartupX",
                position_title="Digital Marketing Specialist",
                start_date="2024-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Run Google and Meta campaigns. GA4 acquisition metrics. Audience testing.",
            )
        ],
        educations=[
            Education(
                school_name="FPT University",
                major="Digital Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 8.0"),
        ],
    )

    # CV11: Phan Minh Khang - Date overlap / Double counting test
    candidates["CV11"] = CandidateProfilePayload(
        candidate_name="Phan Minh Khang",
        desired_title="Digital Marketing Executive",
        professional_summary="Worked with multiple retail clients managing paid campaigns.",
        work_experiences=[
            WorkExperience(
                company_name="AgencyOne",
                position_title="Digital Marketing Executive",
                start_date="2022-01-01T00:00:00Z",
                end_date="2024-12-31T00:00:00Z",
                is_current=False,
                description="Google Ads, Meta Ads, GA4, Performance optimization, A/B testing.",
            )
        ],
        projects=[
            CandidateProject(
                project_name="E-commerce Growth Campaign",
                start_date="2023-01-01T00:00:00Z",
                end_date="2024-12-31T00:00:00Z",
                description="Led a campaign involving Google Ads, Meta Ads and GA4. Part of AgencyOne employment.",
                technologies=["Google Ads", "Meta Ads", "GA4"],
            )
        ],
        educations=[
            Education(
                school_name="UEH",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.0"),
        ],
    )

    # CV12: Lâm Tuấn Kiệt - Projects only, NO full-time employment
    candidates["CV12"] = CandidateProfilePayload(
        candidate_name="Lâm Tuấn Kiệt",
        desired_title="Marketing Graduate",
        professional_summary="Marketing graduate with extensive hands-on project experience.",
        work_experiences=[],  # No full-time employment
        projects=[
            CandidateProject(
                project_name="E-commerce Performance Marketing Project",
                start_date="2021-01-01T00:00:00Z",
                end_date="2024-12-31T00:00:00Z",
                description="Built simulated acquisition environment with Google Ads, Meta Ads, GA4, A/B testing.",
                technologies=["Google Ads", "Meta Ads", "GA4"],
            ),
            CandidateProject(
                project_name="Freelance Campaign Support",
                start_date="2023-01-01T00:00:00Z",
                end_date="2024-12-31T00:00:00Z",
                description="Occasional campaign setup and reporting for two small businesses.",
                technologies=["Google Ads"],
            ),
        ],
        educations=[
            Education(
                school_name="University of Finance and Marketing",
                major="Marketing",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-30T00:00:00Z",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.0"),
        ],
    )

    # CV13: Nguyễn Khánh Linh - Student / Intern (< 3 months exp, not graduated)
    candidates["CV13"] = CandidateProfilePayload(
        candidate_name="Nguyễn Khánh Linh",
        desired_title="Digital Marketing Intern",
        professional_summary="Final-year Marketing student with internship experience.",
        work_experiences=[
            WorkExperience(
                company_name="ConsumerBrand",
                position_title="Digital Marketing Intern",
                start_date="2026-06-01T00:00:00Z",
                end_date="2026-08-31T00:00:00Z",
                is_current=False,
                description="Assisted with Meta campaigns, weekly reports, GA4 dashboards.",
            )
        ],
        projects=[
            CandidateProject(
                project_name="Google Ads campaign simulation",
                description="University project simulating ads campaigns.",
            )
        ],
        educations=[
            Education(
                school_name="Foreign Trade University",
                major="Marketing",
                degree="Sinh viên / Đang học (Expected 2027)",
                start_date="2023-09-01T00:00:00Z",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV14: Mai Đức Long - Senior Sales, wrong domain (0 Marketing skills)
    candidates["CV14"] = CandidateProfilePayload(
        candidate_name="Mai Đức Long",
        desired_title="Sales Director",
        professional_summary="Commercial professional with extensive experience in sales and business development.",
        work_experiences=[
            WorkExperience(
                company_name="XYZ Corp",
                position_title="Sales Director",
                start_date="2024-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Revenue planning, customer acquisition, CRM, sales funnel management.",
            ),
            WorkExperience(
                company_name="ABC Group",
                position_title="Sales Manager",
                start_date="2021-01-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                is_current=False,
                description="Sales management and account development.",
            ),
        ],
        educations=[
            Education(
                school_name="National Economics University",
                major="Business Administration",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="CRM"),
            CandidateSkill(skill_name="Sales Strategy"),
            CandidateSkill(skill_name="Negotiation"),
            CandidateSkill(skill_name="Business Development"),
            CandidateSkill(skill_name="Customer Acquisition"),
        ],
        certificates=[],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV15: Đỗ Ngọc Mai - Missing GA4 explicit skill (GA4 in text only)
    candidates["CV15"] = CandidateProfilePayload(
        candidate_name="Đỗ Ngọc Mai",
        desired_title="Performance Marketing Specialist",
        professional_summary="Performance marketing specialist with experience in e-commerce and lifestyle.",
        work_experiences=[
            WorkExperience(
                company_name="EcomWorld",
                position_title="Performance Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google Ads, Meta Ads, monitor conversion rates, review GA4 traffic reports.",
            )
        ],
        educations=[
            Education(
                school_name="Hanoi University",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="A/B Testing"),
            CandidateSkill(skill_name="CRO"),
            CandidateSkill(skill_name="ROAS"),
            # GA4 is NOT listed in the candidate skills!
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV16: Nguyễn Đức Tài - Missing English certification (Only JLPT N1)
    candidates["CV16"] = CandidateProfilePayload(
        candidate_name="Nguyễn Đức Tài",
        desired_title="Performance Marketing Specialist",
        professional_summary="Digital marketing professional working with Japanese consumer brands.",
        work_experiences=[
            WorkExperience(
                company_name="JapanMarket Vietnam",
                position_title="Performance Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Google Ads, Meta Ads, GA4, paid acquisition, performance reporting.",
            )
        ],
        educations=[
            Education(
                school_name="RMIT Vietnam",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="JLPT N1"),
        ],
        languages=[
            CandidateLanguage(language="Japanese", proficiency="JLPT N1"),
            # No English test!
        ],
    )

    # CV17: Bùi Hoài Nam - Junior duration (1.5 years experience < 3 years required)
    candidates["CV17"] = CandidateProfilePayload(
        candidate_name="Bùi Hoài Nam",
        desired_title="Junior Digital Marketer",
        professional_summary="Junior digital marketer with agency and in-house experience.",
        work_experiences=[
            WorkExperience(
                company_name="Company A",
                position_title="Digital Marketing Intern",
                start_date="2024-06-01T00:00:00Z",
                end_date="2024-12-31T00:00:00Z",
                is_current=False,
                description="Google Ads, Meta Ads, GA4 reporting.",
            ),
            WorkExperience(
                company_name="Company B",
                position_title="Junior Digital Marketer",
                start_date="2025-01-01T00:00:00Z",
                end_date="2025-12-31T00:00:00Z",
                is_current=False,
                description="Google Ads, Meta Ads, GA4, creative testing.",
            ),
        ],
        educations=[
            Education(
                school_name="University of Economics",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.0"),
        ],
    )

    # CV18: Trần Minh Quân - Computer Science major with 5.5 yrs Performance Marketing
    candidates["CV18"] = CandidateProfilePayload(
        candidate_name="Trần Minh Quân",
        desired_title="Performance Marketing Specialist",
        professional_summary="Data-oriented digital marketer with technical education and 5 years acquisition experience.",
        work_experiences=[
            WorkExperience(
                company_name="TechCommerce",
                position_title="Performance Marketing Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Google Ads, Meta Ads, GA4, Performance Marketing, A/B testing, ROAS analysis.",
            )
        ],
        educations=[
            Education(
                school_name="Hanoi University of Science and Technology",
                major="Khoa học máy tính (Computer Science)",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="A/B Testing"),
            CandidateSkill(skill_name="ROAS Analysis"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Ads Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV19: Nguyễn Anh Tuấn - Semantic trap: Analytics/Data, missing paid advertising
    candidates["CV19"] = CandidateProfilePayload(
        candidate_name="Nguyễn Anh Tuấn",
        desired_title="Marketing Analytics Specialist",
        professional_summary="Marketing analytics specialist with strong quantitative background.",
        work_experiences=[
            WorkExperience(
                company_name="DataInsight",
                position_title="Marketing Analytics Specialist",
                start_date="2021-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Analyze acquisition data, build dashboards, customer journeys, conversion funnels, SQL, Python.",
            )
        ],
        educations=[
            Education(
                school_name="National Economics University",
                major="Marketing",
                degree="Bachelor",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Marketing Analytics"),
            CandidateSkill(skill_name="Google Analytics"),
            CandidateSkill(skill_name="SQL"),
            CandidateSkill(skill_name="Python"),
            CandidateSkill(skill_name="Tableau"),
            CandidateSkill(skill_name="Data Visualization"),
            CandidateSkill(skill_name="Business Intelligence"),
            # MISSING: Google Ads, Meta Ads, Performance Marketing!
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Data Analytics Professional Certificate"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 7.5"),
        ],
    )

    # CV20: Nguyễn Hoàng Phúc - MBA Finance, 6.5 yrs, IELTS 6.5 (Exact pass)
    candidates["CV20"] = CandidateProfilePayload(
        candidate_name="Nguyễn Hoàng Phúc",
        desired_title="Performance Marketing Manager",
        professional_summary="Senior digital marketing professional with more than 6 years experience in e-commerce.",
        work_experiences=[
            WorkExperience(
                company_name="RetailPlus",
                position_title="Performance Marketing Manager",
                start_date="2023-01-01T00:00:00Z",
                end_date="2026-09-01T00:00:00Z",
                is_current=True,
                description="Manage Google and Meta campaigns. Set budgets, monitor ROAS, GA4 funnels, A/B testing.",
            ),
            WorkExperience(
                company_name="E-commerce Company",
                position_title="Digital Marketing Specialist",
                start_date="2020-01-01T00:00:00Z",
                end_date="2022-12-31T00:00:00Z",
                is_current=False,
                description="Managed paid search and social campaigns, website analytics, conversion optimization.",
            ),
        ],
        educations=[
            Education(
                school_name="University of Economics",
                major="Master of Business Administration (MBA)",
                degree="Thạc sĩ (Master)",
            )
        ],
        skills=[
            CandidateSkill(skill_name="Google Ads"),
            CandidateSkill(skill_name="Meta Ads"),
            CandidateSkill(skill_name="GA4"),
            CandidateSkill(skill_name="Performance Marketing"),
            CandidateSkill(skill_name="ROAS Optimization"),
            CandidateSkill(skill_name="CAC Analysis"),
            CandidateSkill(skill_name="A/B Testing"),
        ],
        certificates=[
            CandidateCertificate(certificate_name="Google Analytics Certification"),
        ],
        languages=[
            CandidateLanguage(language="English", proficiency="IELTS 6.5"),
        ],
    )

    return candidates


def test_execute_all_20_cvs():
    job = get_novacommerce_jd()
    weights = get_weights()
    candidates = get_20_candidates()

    results = {}
    print("\n" + "=" * 100)
    print(f"{'CV':<6} | {'Total':<6} | {'Skills':<7} | {'Exp':<6} | {'Edu':<6} | {'Cert+Lang':<10} | {'Mandatory':<10} | {'Failures'}")
    print("-" * 100)

    for cv_id, cand in sorted(candidates.items()):
        req = EvaluationRequest(
            application_id=f"app-{cv_id.lower()}",
            candidate_profile=cand,
            job=job,
            weights=weights,
        )
        res = matching_engine.evaluate(req)
        results[cv_id] = res

        mand_status = res.mandatory_status
        failures = [f.get("reason", "") or f.get("requirement", "") for f in (res.mandatory_failures or [])]
        fail_str = "; ".join(failures) if failures else "None"

        print(
            f"{cv_id:<6} | "
            f"{res.overall_score:<6.1f} | "
            f"{res.skills_score:<7.1f} | "
            f"{res.experience_score:<6.1f} | "
            f"{res.education_score:<6.1f} | "
            f"{res.other_score:<10.1f} | "
            f"{mand_status:<10} | "
            f"{fail_str[:45]}"
        )

    # Dump detailed results to json for audit report
    with open("tests/realistic_20cv_results.json", "w", encoding="utf-8") as f:
        json.dump({k: v.model_dump(mode="json") for k, v in results.items()}, f, ensure_ascii=False, indent=2)

    print("=" * 100)

    # Assertions on key stress test edge cases
    assert results["CV05"].mandatory_status == "FAIL", "CV05 (Master Accounting vs Marketing JD) must fail mandatory gate"
    assert any(f.get("type") == "EDUCATION" for f in results["CV05"].mandatory_failures), "CV05 must have EDUCATION failure"

    assert results["CV11"].mandatory_status == "PASS", "CV11 (Calendar 3-year term over leap year) must pass with epsilon"
    assert len(results["CV11"].mandatory_failures) == 0, "CV11 must have 0 mandatory failures"

    ga4_match = next((m for m in results["CV15"].matched_skills if "Analytics" in m.name or "GA4" in m.name), None)
    assert ga4_match is not None, "CV15 must match GA4 contextually"
    assert ga4_match.requires_interview_verification is True, "CV15 passive GA4 must require interview verification"


def test_weight_zero_configurations():
    job = get_novacommerce_jd()
    cand = get_20_candidates()["CV01"]

    # Config 1: Skills=0%, Exp=40%, Edu=20%, Cert+Lang=40%
    w1 = JobWeightsConfig(skills=0, experience=40, education=20, other=40)
    req1 = EvaluationRequest(application_id="app-w-zero-1", candidate_profile=cand, job=job, weights=w1)
    res1 = matching_engine.evaluate(req1)
    sb1 = res1.score_breakdown.model_dump()
    assert sb1["skills"]["max_points"] == 0.0
    assert sb1["skills"]["earned_points"] == 0.0

    # Config 2: Skills=35%, Exp=30%, Edu=35%, Cert+Lang=0%
    w2 = JobWeightsConfig(skills=35, experience=30, education=35, other=0)
    req2 = EvaluationRequest(application_id="app-w-zero-2", candidate_profile=cand, job=job, weights=w2)
    res2 = matching_engine.evaluate(req2)
    sb2 = res2.score_breakdown.model_dump()
    assert sb2["other"]["max_points"] == 0.0
    assert sb2["other"]["earned_points"] == 0.0


def test_weight_sum_validations():
    from app.services.matching.score_engine import score_engine

    # Case 1: Valid 35 + 30 + 15 + 20 = 100
    req_valid = EvaluationRequest(
        application_id="v1",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="T"),
        weights=JobWeightsConfig(skills=35, experience=30, education=15, other=20),
    )
    w_valid = score_engine._resolve_weights(req_valid)
    assert w_valid == {"skills": 35.0, "experience": 30.0, "education": 15.0, "other": 20.0}

    # Case 2: Negative weight -> ValueError
    with pytest.raises(ValueError, match="Invalid weight"):
        req_neg = EvaluationRequest(
            application_id="v2",
            candidate_profile=CandidateProfilePayload(),
            job=JobPayload(title="T"),
            weights=JobWeightsConfig(skills=-10, experience=40, education=30, other=40),
        )
        score_engine._resolve_weights(req_neg)

    # Case 3: All zero (0, 0, 0, 0)
    req_zero = EvaluationRequest(
        application_id="v3",
        candidate_profile=CandidateProfilePayload(),
        job=JobPayload(title="T"),
        weights=JobWeightsConfig(skills=0, experience=0, education=0, other=0),
    )
    w_zero = score_engine._resolve_weights(req_zero)
    assert w_zero == {"skills": 0.0, "experience": 0.0, "education": 0.0, "other": 0.0}
