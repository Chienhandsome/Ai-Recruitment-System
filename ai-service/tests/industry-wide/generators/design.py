from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-design-uiux-07",
        title="Senior UI/UX Product Designer",
        description=(
            "KiteFintech is looking for a passionate Senior UI/UX Product Designer to craft intuitive, user-centric mobile and web experiences. "
            "You will drive the product discovery lifecycle from UX research and customer journey mapping to high-fidelity UI design in Figma, "
            "build and maintain scalable Design Systems, and test interactive prototypes with real end-users."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 4+ years of digital product UI/UX design experience for web and mobile.\n"
            "- Core Technical Skills: Figma, UI Design, UX Research, Design System, Prototyping.\n"
            "- Preferred Skills: Wireframing, Adobe Photoshop, Micro-interactions, Usability Testing.\n"
            "- Education: Bachelor's degree or above in Graphic Design, Multimedia, Human-Computer Interaction, Industrial Design, Fine Arts, or related field.\n"
            "- Language: Working English proficiency (IELTS 6.5 or equivalent) for multinational product syncs.\n"
            "- Certifications: Nielsen Norman UX Certification or Google UX Certificate preferred."
        ),
        required_experience_years=4.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "Figma", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "UI Design", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "UX Research", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Design System", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Prototyping", "is_mandatory": True, "minimum_years": 2.0},
            {"skill_name": "Wireframing", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "Adobe Photoshop", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "Nielsen Norman UX Certification", "is_mandatory": False},
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
        candidate_name="Lê Quỳnh Anh",
        desired_title="Senior UI/UX Product Designer",
        professional_summary="Product Designer with 5.5 years designing complex fintech mobile apps, scaling token-based design systems, and conducting qualitative UX research.",
        work_experiences=[
            make_exp(
                company_name="ZaloPay Fintech",
                position_title="Senior Product Designer",
                start_date="2021-03-01T00:00:00Z",
                is_current=True,
                description="Lead UI Design and UX Research for merchant payment portal in Figma. Architect company-wide Design System and interactive Prototyping pipelines.",
                achievements="Redesigned payment checkout flow boosting transaction completion rate by 24%."
            ),
            make_exp(
                company_name="Gong Design Studio",
                position_title="UI/UX Designer",
                start_date="2018-09-01T00:00:00Z",
                end_date="2021-02-28T00:00:00Z",
                description="Created wireframes, user testing sessions, and high-fidelity interface designs for banking apps.",
                achievements="Delivered 8 end-to-end mobile app design releases."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Fine Arts",
                major="Graphic and Multimedia Design",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping", "Wireframing", "Adobe Photoshop"],
        certificates=[{"certificate_name": "Nielsen Norman UX Certification", "issuing_organization": "Nielsen Norman Group"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Minh Quân",
        desired_title="UI/UX Designer",
        professional_summary="Product Designer with 4.5 years creating web and mobile interfaces, user journey maps, and responsive design systems in Figma.",
        work_experiences=[
            make_exp(
                company_name="Tiki Corporation",
                position_title="Senior UI/UX Designer",
                start_date="2020-01-01T00:00:00Z",
                is_current=True,
                description="Execute UI Design, conduct UX Research interviews, maintain Design System tokens in Figma, and build interactive Prototyping tests.",
                achievements="Reduced user drop-off rate on cart page by 18%."
            )
        ],
        educations=[
            make_edu(
                school_name="RMIT University Vietnam",
                major="Design Studies",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-12-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV03: Mandatory Threshold Failure (Missing UX Research)
    cands["CV03"] = make_candidate(
        candidate_name="Nguyễn Văn Đức",
        desired_title="UI Visual Designer",
        professional_summary="Visual UI Designer with 4.5 years focusing strictly on visual aesthetics and Figma component libraries, without conducting UX research.",
        work_experiences=[
            make_exp(
                company_name="Appota Studio",
                position_title="Senior UI Designer",
                start_date="2020-02-01T00:00:00Z",
                is_current=True,
                description="Create stunning Figma mockups, maintain Design System, build click-through Prototyping screens and visual UI Design. UX research is handled strictly by external product managers.",
                achievements="Designed 12 gaming mobile app UI skins."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Arena Multimedia",
                major="Digital Multimedia",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "Design System", "Prototyping", "Adobe Photoshop"],
        certificates=[{"certificate_name": "Nielsen Norman UX Certification", "issuing_organization": "NN/g"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (Print Shop Banner & Prepress Technician)
    cands["CV04"] = make_candidate(
        candidate_name="Hoàng Thị Thơm",
        desired_title="Print Graphic Designer",
        professional_summary="Print Designer with 5 years setting up offset CMYK files, vinyl street banners, and paper business cards.",
        work_experiences=[
            make_exp(
                company_name="Phuc An Printing House",
                position_title="Prepress Graphic Staff",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Check bleeds and crop marks on CorelDRAW and Illustrator files, operate wide-format vinyl banner inkjet printers. No Figma, responsive screens, or interactive prototypes.",
                achievements="Printed over 50,000 square meters of outdoor advertising banners."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi College of Printing Technology",
                major="Printing and Graphic Prepress",
                degree="Associate",
                start_date="2015-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["CorelDRAW", "Offset Printing", "Prepress", "Vinyl Plotting", "CMYK Separation"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV05: Education Major Trap (Mining and Petroleum Geology)
    cands["CV05"] = make_candidate(
        candidate_name="Đặng Quốc Huy",
        desired_title="UI/UX Product Designer",
        professional_summary="Product designer with 4.5 years in Figma and Design Systems, holding a geology engineering degree.",
        work_experiences=[
            make_exp(
                company_name="Sendo Technology",
                position_title="UI/UX Designer",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Lead UI Design, UX Research, Design System, Prototyping, and Figma components for e-commerce web platform.",
                achievements="Built multi-brand UI design system."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Mining and Geology",
                major="Petroleum Geology Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[{"certificate_name": "Nielsen Norman UX Certification", "issuing_organization": "NN/g"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (Master of Criminology)
    cands["CV06"] = make_candidate(
        candidate_name="Võ Mai Phương",
        desired_title="UI/UX Designer",
        professional_summary="UI/UX designer with 4.2 years experience holding a Master degree in Criminology.",
        work_experiences=[
            make_exp(
                company_name="VNPAY FinTech",
                position_title="UI/UX Designer",
                start_date="2020-02-01T00:00:00Z",
                is_current=True,
                description="Deliver UI Design, UX Research, Design System, Prototyping, and Figma interfaces for consumer banking.",
                achievements="Conducted 40 usability testing sessions."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Academy of Social Sciences",
                major="Criminal Law & Criminology",
                degree="Master",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV07: Experience Threshold Trap (1.5 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Bùi Phương Thảo",
        desired_title="Junior UI/UX Designer",
        professional_summary="Junior UI/UX designer with 1.5 years experience designing landing pages and mobile app wireframes in Figma.",
        work_experiences=[
            make_exp(
                company_name="Pixel Studio Vietnam",
                position_title="Junior UI Designer",
                start_date="2023-01-01T00:00:00Z",
                is_current=True,
                description="Assist senior designer in Figma, UI Design, UX Research surveys, Design System updates, and Prototyping.",
                achievements="Designed 10 marketing landing pages."
            )
        ],
        educations=[
            make_edu(
                school_name="FPT Arena Multimedia",
                major="Multimedia Design",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Fashion Tailor / Textile Patternmaker)
    cands["CV08"] = make_candidate(
        candidate_name="Lâm Văn Quyền",
        desired_title="Fashion Patternmaker",
        professional_summary="Clothing Pattern Designer with 5 years cutting fabric, draping mannequins, and stitching garment samples.",
        work_experiences=[
            make_exp(
                company_name="NEM Fashion Atelier",
                position_title="Senior Garment Patternmaker",
                start_date="2019-03-01T00:00:00Z",
                is_current=True,
                description="Cut cardboard clothing patterns, drape silk on dress forms, measure fabric yardage for dresses and suits. No digital software interfaces, mobile screens, or UX prototyping.",
                achievements="Patterned 150 fashion runway dresses."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Textile and Garment",
                major="Fashion Design",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Garment Tailoring", "Fabric Draping", "Sewing", "Fashion Sketching"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Only Behance hobby UI shots)
    cands["CV09"] = make_candidate(
        candidate_name="Nguyễn Tuấn Kiệt",
        desired_title="Aspiring UI/UX Designer",
        professional_summary="Self-taught designer with conceptual Dribbble shots and hypothetical Behance redesign cases.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="University of Science HCMC",
                major="Information Technology",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="Hypothetical Spotify Mobile Redesign",
                project_role="Sole Designer",
                description="Created visual mockups and micro-interactions for a music app concept.",
                technologies=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
                start_date="2023-06-01T00:00:00Z",
                end_date="2023-09-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV10: Internship Trap (Repeated banner resizing internships)
    cands["CV10"] = make_candidate(
        candidate_name="Đoàn Thu Trang",
        desired_title="Design Intern",
        professional_summary="Candidate with multiple banner resizing and asset cropping internships totaling 3 years part-time.",
        work_experiences=[
            make_exp(
                company_name="VCCorp Digital",
                position_title="Graphic Asset Intern",
                start_date="2021-06-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Resize digital banners into multiple display dimensions."
            ),
            make_exp(
                company_name="Golden Ad Agency",
                position_title="Production Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Crop product photos and export PNG assets for web developers."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Fine Arts",
                major="Graphic Design",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (4.5 years freelance UI/UX designer with shipped products)
    cands["CV11"] = make_candidate(
        candidate_name="Vũ Hoàng Nam",
        desired_title="Senior Freelance UI/UX Designer",
        professional_summary="Independent Product Designer with 4.5 years designing shipped SaaS and fintech mobile applications for global clients.",
        work_experiences=[
            make_exp(
                company_name="Independent Product Design Consultancy",
                position_title="Principal UI/UX Designer",
                start_date="2019-09-01T00:00:00Z",
                is_current=True,
                description="Contracted by startups to deliver complete UI Design, Figma component systems, UX Research user testing, scalable Design System architecture, and high-fidelity Prototyping.",
                achievements="Designed and launched 14 SaaS platforms currently used by over 500,000 active users."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Fine Arts",
                major="Graphic Design",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[{"certificate_name": "Nielsen Norman UX Certification", "issuing_organization": "NN/g"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV12: Overlapping Dates (2.0 calendar years claiming 4.5 years)
    cands["CV12"] = make_candidate(
        candidate_name="Phan Gia Huy",
        desired_title="UI Designer",
        professional_summary="Designer holding concurrent agency positions.",
        work_experiences=[
            make_exp(
                company_name="Studio Alpha",
                position_title="UI Designer",
                start_date="2022-01-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Design screens in Figma."
            ),
            make_exp(
                company_name="Studio Beta (Concurrent)",
                position_title="Visual Designer",
                start_date="2022-03-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent screen designer."
            )
        ],
        educations=[
            make_edu(
                school_name="Arena Multimedia",
                major="Design",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (HubSpot Content Marketing instead of NN/g UX)
    cands["CV13"] = make_candidate(
        candidate_name="Ngô Thanh Tú",
        desired_title="UI/UX Designer",
        professional_summary="Product designer with 4.5 years experience holding HubSpot Content Marketing certification.",
        work_experiences=[
            make_exp(
                company_name="Trusting Social",
                position_title="UI/UX Designer",
                start_date="2019-11-01T00:00:00Z",
                is_current=True,
                description="Deliver UI Design, UX Research, Design System, Prototyping, and Figma interfaces for digital lending app.",
                achievements="Managed end-to-end user onboarding redesign."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Fine Arts",
                major="Multimedia",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[{"certificate_name": "HubSpot Content Marketing Certification", "issuing_organization": "HubSpot"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (Oracle Certified Java Associate)
    cands["CV14"] = make_candidate(
        candidate_name="Trần Văn Tài",
        desired_title="UI/UX Designer",
        professional_summary="UI/UX designer with 4.5 years experience holding Java programming certificate.",
        work_experiences=[
            make_exp(
                company_name="Giao Hang Nhanh (GHN)",
                position_title="UI/UX Designer",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Build UI Design, UX Research flows, Design System components, Prototyping, and Figma screens for logistics portal.",
                achievements="Standardized merchant dashboard UI."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Fine Arts",
                major="Graphic Design",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[{"certificate_name": "Oracle Certified Associate Java SE", "issuing_organization": "Oracle"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Lê Hải Nam",
        desired_title="UI/UX Designer",
        professional_summary="UI/UX designer with 4.5 years experience, IELTS 5.0 English level.",
        work_experiences=[
            make_exp(
                company_name="Coc Coc Browser",
                position_title="UI/UX Designer",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Responsible for UI Design, UX Research, Design System, Prototyping, and Figma designs.",
                achievements="Redesigned browser new tab page."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industrial Fine Arts",
                major="Graphic Design",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (Spanish DELE B2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Đỗ Quỳnh Mai",
        desired_title="UI/UX Designer",
        professional_summary="UI/UX designer with 4.5 years experience, fluent in Spanish.",
        work_experiences=[
            make_exp(
                company_name="Glovo Tech Hub",
                position_title="Senior Product Designer",
                start_date="2019-08-01T00:00:00Z",
                is_current=True,
                description="Lead UI Design, UX Research, Design System, Prototyping, and Figma workflows.",
                achievements="Shipped multi-lingual consumer app."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="Hispanic Studies & Design",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["Figma", "UI Design", "UX Research", "Design System", "Prototyping"],
        certificates=[],
        languages=[{"language": "Spanish", "proficiency": "DELE B2"}]
    )

    # CV17: Semantic Similarity Trap (Aesthetic Buzzwords without Figma/UX proof)
    cands["CV17"] = make_candidate(
        candidate_name="Võ Đình Khang",
        desired_title="Visual Energy Alchemist",
        professional_summary="Metaphysical pixel philosopher radiating aesthetic aura, divine golden ratio spirituality, and celestial whitespace alignment.",
        work_experiences=[
            make_exp(
                company_name="Cosmic Aesthetics Studio",
                position_title="Spiritual Aesthetician",
                start_date="2019-05-01T00:00:00Z",
                is_current=True,
                description="Contemplate the sacred geometry of circles and triangles in incense smoke. Never structured auto-layout in Figma or conducted usability testing.",
                achievements="Curated visual energy meditation circle."
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
        skills=["Sacred Geometry", "Visual Philosophy", "Color Therapy"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Nguyễn Văn Lâm",
        desired_title="UI Designer",
        professional_summary="Designer in Figma.",
        work_experiences=[
            make_exp(
                company_name="Design Studio",
                position_title="UI Designer",
                start_date="",
                description="Design screens."
            )
        ],
        educations=[],
        skills=["Figma", "UI Design"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (3D Monster Character Modeler / Sculptor)
    cands["CV19"] = make_candidate(
        candidate_name="Tô Quang Dũng",
        desired_title="Senior 3D Creature Modeler",
        professional_summary="3D Game Modeler with 8 years sculpting high-poly fantasy monsters, dragon scales, and photorealistic ZBrush character anatomy.",
        work_experiences=[
            make_exp(
                company_name="Sparx* - Virtuos Studio",
                position_title="Senior 3D Character Artist",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Sculpt 20M poly demonic beasts in ZBrush, retopologize meshes in Maya, paint 4K skin texture maps in Substance Painter. No mobile app buttons, Figma design systems, or UX research.",
                achievements="Modeled main boss characters for AAA console game title."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Academy of Theatre and Cinema",
                major="Animation & VFX",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["ZBrush Sculpting", "Maya Modeling", "Substance Painter", "Character Anatomy", "3D Texturing"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV20: Cross-Domain Near Match (Frontend HTML/CSS Coder)
    cands["CV20"] = make_candidate(
        candidate_name="Nguyễn Thị Thanh Thủy",
        desired_title="Frontend CSS Developer",
        professional_summary="Web Markup Developer with 4.5 years coding responsive CSS grid stylesheets and Bootstrap layouts from provided PSD mockups.",
        work_experiences=[
            make_exp(
                company_name="FPT Software",
                position_title="Web Markup Developer",
                start_date="2019-10-01T00:00:00Z",
                is_current=True,
                description="Slice static images, write HTML5/CSS3 stylesheets, ensure cross-browser compatibility. Do not create original design concepts, conduct UX research, or build Figma design systems.",
                achievements="Coded responsive markup for 40 web portals."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Information Technology",
                degree="Bachelor",
                start_date="2015-09-01T00:00:00Z",
                end_date="2019-06-01T00:00:00Z"
            )
        ],
        skills=["HTML5", "CSS3", "Bootstrap", "Responsive Layout", "SASS"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 5.5 yrs experience, NN/g cert, IELTS 7.5, Design degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional NN/g certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory UX Research skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Print shop banner prepress is not digital UI/UX product design."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Mining & Petroleum Geology fails Design/HCI major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Master of Criminology fails Design/Fine Arts field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.5 years experience vs required 4.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Fashion tailoring & textile draping lacks digital UI/UX app design competencies."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "Dribbble hobby mockups cannot replace 4.0 years professional product design."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Banner resizing internships do not satisfy Senior Product Designer level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance product designer meets tenure, Figma skills, and shipped apps."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment duration is 2.0 years < 4.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get NN/g cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "Java programmer cert does not grant UI/UX design bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Spanish DELE B2 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Whitespace aura buzzwords lack concrete Figma and UX research evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "3D Monster Sculptor lacks Figma, UI Design Systems, and UX research."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Frontend CSS coder lacks UX research, design systems, and original UI creation."),
    }
