from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-marketing-growth-02",
        title="Senior Performance Marketing Manager",
        description=(
            "VinCommerce Digital is seeking an experienced Senior Performance Marketing Manager to lead our user acquisition "
            "and revenue growth engine. You will manage a monthly paid media budget of $200K+ across Google, Meta, and emerging channels. "
            "The role requires deep analytical rigor in GA4, conversion rate optimization (CRO), and attribution modeling to maximize ROAS."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 4+ years of hands-on paid media & performance marketing experience.\n"
            "- Core Technical Skills: Google Ads (Search, Shopping, Display), Meta Ads (Facebook/Instagram), GA4, Performance Marketing, Conversion Rate Optimization.\n"
            "- Preferred Skills: TikTok Ads, Technical SEO, Marketing Automation (HubSpot/Klaviyo).\n"
            "- Education: Bachelor's degree or above in Marketing, Communications, Business Administration, Economics, or related field.\n"
            "- Language: Fluent English (IELTS 6.5 or equivalent) for regional executive reporting.\n"
            "- Certifications: Google Ads Certification preferred."
        ),
        required_experience_years=4.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "Google Ads", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Meta Ads", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "GA4", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Performance Marketing", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Conversion Rate Optimization", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "TikTok Ads", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "SEO", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "Google Ads Certification", "is_mandatory": False},
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
        candidate_name="Nguyễn Thảo My",
        desired_title="Senior Performance Marketing Manager",
        professional_summary="Performance Marketing Lead with 5 years driving user acquisition across Google Ads, Meta Ads, and GA4 with proven ROAS > 4.5x.",
        work_experiences=[
            make_exp(
                company_name="Tiki E-commerce Group",
                position_title="Senior Performance Marketing Lead",
                start_date="2022-01-01T00:00:00Z",
                is_current=True,
                description="Manage $180K/month budget across Google Ads (Search, PMax) and Meta Ads. Implement custom events in GA4 and run weekly Conversion Rate Optimization A/B tests.",
                achievements="Scaled new customer acquisition by 45% while decreasing blended CAC by 22%."
            ),
            make_exp(
                company_name="Dentsu Redder Vietnam",
                position_title="Performance Marketing Specialist",
                start_date="2019-06-01T00:00:00Z",
                end_date="2021-12-31T00:00:00Z",
                description="Executed Google Ads and Meta Ads campaigns for tier-1 retail brands. Built attribution dashboards in GA4.",
                achievements="Delivered 120% target fulfillment for seasonal mega-sale campaigns."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Marketing Management",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-30T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization", "TikTok Ads", "SEO"],
        certificates=[{"certificate_name": "Google Ads Certification", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Quốc Bảo",
        desired_title="Performance Marketing Manager",
        professional_summary="Digital Growth Specialist with 4.5 years scaling e-commerce ad funnels with Google Ads, Meta Ads, and GA4.",
        work_experiences=[
            make_exp(
                company_name="Sendo Technology",
                position_title="Performance Marketing Manager",
                start_date="2020-02-01T00:00:00Z",
                is_current=True,
                description="Spearhead Google Ads and Meta Ads campaigns, manage Conversion Rate Optimization funnel tests and tracking in GA4.",
                achievements="Grew qualified lead volume by 60% with steady 3.8x ROAS."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Business Administration",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV03: Mandatory Threshold Failure (Missing GA4)
    cands["CV03"] = make_candidate(
        candidate_name="Lâm Hoàng Hải",
        desired_title="Senior Media Buyer",
        professional_summary="Senior Media Buyer with 4.5 years in Google Ads and Meta Ads media spending, specializing in direct response.",
        work_experiences=[
            make_exp(
                company_name="VCCorp Ad Agency",
                position_title="Senior Media Buyer",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Execute massive Google Ads Search and Meta Ads campaigns. Focus purely on ad platform buying, while analytics is handled by external BI team.",
                achievements="Managed $100K monthly ad spend with high CTR."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Business and Technology",
                major="Marketing",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[{"certificate_name": "Google Ads Certification", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (Content & SEO, no Paid Ads)
    cands["CV04"] = make_candidate(
        candidate_name="Vũ Thu Thảo",
        desired_title="Digital Marketing Specialist",
        professional_summary="Digital Marketer with 5 years focusing on SEO, Content Strategy, PR articles, and Organic Social Media.",
        work_experiences=[
            make_exp(
                company_name="Zing News Digital",
                position_title="Content Marketing Lead",
                start_date="2019-05-01T00:00:00Z",
                is_current=True,
                description="Produce editorial content, manage on-page SEO, publish sponsored PR articles. Do not handle paid media budgets.",
                achievements="Increased organic website traffic by 200% over 2 years."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Social Sciences and Humanities",
                major="Journalism and Communications",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["SEO", "Content Marketing", "Copywriting", "Public Relations", "Social Media"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV05: Education Major Trap (Electrical Engineering)
    cands["CV05"] = make_candidate(
        candidate_name="Đặng Tuấn Anh",
        desired_title="Performance Marketer",
        professional_summary="Performance marketer with 4.5 years running Google Ads and Meta Ads, transitioning from engineering background.",
        work_experiences=[
            make_exp(
                company_name="Nova Digital Media",
                position_title="Senior Performance Marketer",
                start_date="2019-08-01T00:00:00Z",
                is_current=True,
                description="Setup and optimize Google Ads, Meta Ads, GA4 tracking, and Conversion Rate Optimization landing pages.",
                achievements="Maintained 4.0x ROAS across multi-brand campaigns."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Electrical Power Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[{"certificate_name": "Google Ads Certification", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (PhD in Literature)
    cands["CV06"] = make_candidate(
        candidate_name="Phạm Bích Ngọc",
        desired_title="Growth Marketer",
        professional_summary="Growth marketing practitioner with 4.2 years in Google Ads and Meta Ads funnels, holding a PhD in Literature.",
        work_experiences=[
            make_exp(
                company_name="AdAsia Holdings",
                position_title="Senior Performance Executive",
                start_date="2020-01-01T00:00:00Z",
                is_current=True,
                description="Lead programmatic Google Ads, Meta Ads, GA4 analytics, and Conversion Rate Optimization experiments.",
                achievements="Managed $120K monthly spend with continuous positive margin."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam National University",
                major="Classical Vietnamese Literature",
                degree="Doctorate",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-12-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV07: Experience Threshold Trap (1.5 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Bùi Phương Linh",
        desired_title="Junior Performance Executive",
        professional_summary="Enthusiastic Junior Performance Marketer with 1.5 years experience executing Google Ads and Meta Ads.",
        work_experiences=[
            make_exp(
                company_name="CleverAds Agency",
                position_title="Performance Marketing Executive",
                start_date="2023-01-01T00:00:00Z",
                is_current=True,
                description="Assist in keyword bidding on Google Ads, creative testing on Meta Ads, and basic reporting in GA4.",
                achievements="Successfully assisted 15 client ad accounts."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Marketing",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Traditional Offline B2B Trade Marketing)
    cands["CV08"] = make_candidate(
        candidate_name="Lương Đình Trọng",
        desired_title="Senior Trade Marketing Specialist",
        professional_summary="Senior Trade Marketer with 5 years managing offline POSM, distributor trade promotions, and retail activation.",
        work_experiences=[
            make_exp(
                company_name="Masan Consumer",
                position_title="Senior Trade Marketing Executive",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Coordinate POSM displays in 500+ supermarkets. Negotiate shelf share with modern trade channels. No paid search or GA4 tracking.",
                achievements="Expanded offline distribution footprint by 30%."
            )
        ],
        educations=[
            make_edu(
                school_name="Thuongmai University",
                major="Commerce and Marketing",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Trade Marketing", "POSM", "Retail Activation", "Key Account Management", "Event Coordination"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Only uni club projects)
    cands["CV09"] = make_candidate(
        candidate_name="Hoàng Kim Ngân",
        desired_title="Growth Marketer",
        professional_summary="Fresh graduate with multiple university club Google Ads projects and personal affiliate blogs.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="Marketing",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="University Student Club Ad Campaign",
                project_role="Media Lead",
                description="Ran small $100 test campaign on Google Ads and Meta Ads for university cultural festival.",
                technologies=["Google Ads", "Meta Ads", "GA4"],
                start_date="2023-03-01T00:00:00Z",
                end_date="2023-05-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV10: Internship Trap (Repeated unpaid internships)
    cands["CV10"] = make_candidate(
        candidate_name="Đỗ Nhật Minh",
        desired_title="Marketing Trainee",
        professional_summary="Marketing candidate with consecutive agency internships totaling 3 years part-time.",
        work_experiences=[
            make_exp(
                company_name="Ogilvy Vietnam",
                position_title="Marketing Intern",
                start_date="2021-06-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Shadow media planners, prepare presentation decks."
            ),
            make_exp(
                company_name="Mindshare",
                position_title="Digital Media Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Input data for monthly billing reconciliation and observe Google Ads account setups."
            )
        ],
        educations=[
            make_edu(
                school_name="RMIT University Vietnam",
                major="Digital Marketing",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-12-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (4.5 years verified freelance ads practitioner)
    cands["CV11"] = make_candidate(
        candidate_name="Trịnh Duy Khánh",
        desired_title="Senior Freelance Growth Consultant",
        professional_summary="Freelance Performance Marketer with 4.5 years optimizing Google Ads, Meta Ads, and GA4 for over 30 e-commerce brands.",
        work_experiences=[
            make_exp(
                company_name="Independent Freelance Consultant",
                position_title="Senior Performance Marketing Consultant",
                start_date="2019-09-01T00:00:00Z",
                is_current=True,
                description="Contracted by multiple SMEs to build end-to-end Google Ads Search/Shopping campaigns, Meta Ads scaling, GA4 event tracking, and Conversion Rate Optimization.",
                achievements="Managed cumulative ad spend over $800K with average ROAS of 4.2x across client portfolio."
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
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[{"certificate_name": "Google Ads Certification", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV12: Overlapping Dates (Apparent 5 years, actual non-overlapping 2.0 years)
    cands["CV12"] = make_candidate(
        candidate_name="Phan Văn Đạt",
        desired_title="Performance Marketer",
        professional_summary="Marketer claiming 5 years of concurrent agency roles.",
        work_experiences=[
            make_exp(
                company_name="Agency Alpha",
                position_title="Performance Executive",
                start_date="2022-01-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Handle Google Ads and Meta Ads campaigns."
            ),
            make_exp(
                company_name="Agency Beta (Concurrent)",
                position_title="Digital Media Executive",
                start_date="2022-03-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent second job doing duplicate ad tasks."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University",
                major="Marketing",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (HubSpot Inbound instead of Google Ads cert)
    cands["CV13"] = make_candidate(
        candidate_name="Ngô Thanh Tùng",
        desired_title="Performance Marketing Manager",
        professional_summary="Performance marketer with 4.5 years experience in Google Ads, Meta Ads, and GA4 holding HubSpot Inbound Marketing certificate.",
        work_experiences=[
            make_exp(
                company_name="E-Logistics Solutions",
                position_title="Growth Marketing Manager",
                start_date="2019-11-01T00:00:00Z",
                is_current=True,
                description="Run Google Ads and Meta Ads campaigns, manage GA4 funnel reporting, and execute Conversion Rate Optimization tests.",
                achievements="Decreased acquisition cost per lead by 28%."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Marketing",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[{"certificate_name": "HubSpot Inbound Marketing Certification", "issuing_organization": "HubSpot"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (Cisco CCNA)
    cands["CV14"] = make_candidate(
        candidate_name="Đoàn Mạnh Hùng",
        desired_title="Performance Marketer",
        professional_summary="Performance Marketer with 4.5 years experience in paid ads holding unrelated Cisco IT networking certificates.",
        work_experiences=[
            make_exp(
                company_name="Appota Corporation",
                position_title="Senior User Acquisition Specialist",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Deploy Google Ads App campaigns and Meta Ads for gaming apps with GA4 analytics and Conversion Rate Optimization.",
                achievements="Drove 500K app installs under target CPI."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Economics HCMC",
                major="Marketing",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[{"certificate_name": "Cisco CCNA Routing and Switching", "issuing_organization": "Cisco"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Võ Thành Danh",
        desired_title="Performance Marketing Manager",
        professional_summary="Performance marketer with 4.5 years managing Google Ads and Meta Ads, English IELTS 5.0.",
        work_experiences=[
            make_exp(
                company_name="Metub Network",
                position_title="Performance Specialist",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Manage Google Ads and Meta Ads campaigns with GA4 reporting and Conversion Rate Optimization.",
                achievements="Managed $80K monthly ad spend."
            )
        ],
        educations=[
            make_edu(
                school_name="Ton Duc Thang University",
                major="Business Administration",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (Chinese HSK 6, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Dương Ánh Tuyết",
        desired_title="Performance Marketer",
        professional_summary="Performance Marketer with 4.5 years experience in Google Ads and Meta Ads, fluent in Mandarin Chinese.",
        work_experiences=[
            make_exp(
                company_name="Chicilon Media",
                position_title="Senior Digital Specialist",
                start_date="2019-08-01T00:00:00Z",
                is_current=True,
                description="Manage cross-border Google Ads and Meta Ads campaigns with GA4 and Conversion Rate Optimization.",
                achievements="Achieved 140% quarterly ROI target."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="Chinese Linguistics & Commerce",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Google Ads", "Meta Ads", "GA4", "Performance Marketing", "Conversion Rate Optimization"],
        certificates=[],
        languages=[{"language": "Chinese", "proficiency": "HSK 6"}]
    )

    # CV17: Semantic Similarity Trap (Brand Buzzwords without Ads proof)
    cands["CV17"] = make_candidate(
        candidate_name="Lê Gia Bảo",
        desired_title="Brand Growth Evangelist",
        professional_summary="Visionary brand strategist orchestrating digital awareness synergy, holistic viral storytelling, and consumer empathy.",
        work_experiences=[
            make_exp(
                company_name="Creative Spark Studio",
                position_title="Strategic Brand Storyteller",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Champion holistic omnichannel brand resonance and emotional stakeholder alignment. No media buying or technical analytics.",
                achievements="Crafted viral brand manifesto read by 100K users."
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
        skills=["Brand Strategy", "Storytelling", "Creative Concepting", "Public Relations"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Nguyễn Đăng Khoa",
        desired_title="Performance Marketer",
        professional_summary="Marketer with paid ads experience.",
        work_experiences=[
            make_exp(
                company_name="Freelance Projects",
                position_title="Digital Marketer",
                start_date="",
                description="Run ads occasionally."
            )
        ],
        educations=[],
        skills=["Google Ads", "Meta Ads"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Creative Director / Video Producer)
    cands["CV19"] = make_candidate(
        candidate_name="Tạ Quang Huy",
        desired_title="Creative Video Director",
        professional_summary="Executive Creative Director with 8 years directing TVCs, high-end digital video production, and viral music videos.",
        work_experiences=[
            make_exp(
                company_name="Alien Media Production",
                position_title="Creative Director",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Direct 50+ national TV commercial shoots, supervise 3D VFX rendering, scriptwriting, and color grading for major consumer brands.",
                achievements="Won multiple Golden Bell Vietnam Advertising awards for best viral TVC."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Academy of Theatre and Cinema",
                major="Film Directing",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["Video Directing", "TVC Production", "Screenwriting", "Color Grading", "Visual Storytelling", "Cinematography"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV20: Cross-Domain Near Match (E-Commerce Store Operations)
    cands["CV20"] = make_candidate(
        candidate_name="Ngô Quỳnh Trang",
        desired_title="E-commerce Operations Specialist",
        professional_summary="E-commerce Store Specialist with 4.5 years managing Shopee/Lazada flash sales, inventory stocking, and live-streaming.",
        work_experiences=[
            make_exp(
                company_name="OnPoint E-commerce Enabler",
                position_title="E-commerce Channel Specialist",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Manage marketplace catalog, participate in Shopee Super Brand Days, schedule livestream hosts. Rely on platform built-in vouchers rather than paid Google/Meta search media.",
                achievements="Managed $2M GMV on Shopee Mall platform."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Business",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["E-commerce Operations", "Shopee Store Management", "Lazada Seller Center", "Livestreaming", "Inventory Allocation"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 5 yrs experience, IELTS 7.0, Google Ads cert."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory requirements, missing optional Google Ads certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory GA4 skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 35.0, 60.0, "Content/SEO is not equivalent to Paid Ads/Performance Marketing."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Bachelor in Electrical Power Engineering fails Marketing/Business major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Doctorate in Literature fails Marketing/Business field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.5 years experience vs required 4.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Offline POSM/Trade marketing lacks required digital ad media experience."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "University club projects cannot replace 4.0 years professional experience."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Agency internships do not meet Senior manager level requirement."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Full-time freelance ads consultant meets skills and tenure."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping timeline is 2.0 years < 4.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get Google Ads cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "Cisco CCNA does not give bonus points for Marketing role."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Chinese HSK 6 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Vague branding buzzwords lack concrete performance ad evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Creative Video Director lacks core Performance Marketing & Analytics."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Marketplace Operations lacks Google/Meta Ads & GA4."),
    }
