from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-hospitality-front-office-10",
        title="Hotel Front Office & Guest Experience Manager",
        description=(
            "InterContinental Landmark Resort is seeking an accomplished Hotel Front Office & Guest Experience Manager to elevate "
            "our luxury 5-star guest journey. You will lead 40+ front desk agents, concierges, and guest relations officers, "
            "master Opera PMS room inventory allocations, oversee VIP arrival protocols, manage front-line guest escalation resolution, "
            "and collaborate with Housekeeping and Revenue Management to maximize RevPAR and guest satisfaction (GSS)."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 5+ years of international 4-star/5-star hotel front office and guest relations management experience.\n"
            "- Core Technical Skills: Front Office, Guest Relations, Opera PMS, Customer Service, Reservation Systems.\n"
            "- Preferred Skills: Revenue Management, Housekeeping Operations, VIP Protocol, Night Audit.\n"
            "- Education: Bachelor's degree or above in Hospitality Management, Tourism, Hotel Administration, Foreign Languages, Business Administration, or related field.\n"
            "- Language: Fluent English (IELTS 6.5 or equivalent) for foreign VIP and diplomatic guest service.\n"
            "- Certifications: Certified Hospitality Supervisor (CHS) or Certified Hotel Administrator (CHA) preferred."
        ),
        required_experience_years=5.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "Front Office", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Guest Relations", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Opera PMS", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Customer Service", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Reservation Systems", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Revenue Management", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "Housekeeping Operations", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "Certified Hospitality Supervisor (CHS)", "is_mandatory": False},
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
        candidate_name="Nguyễn Thúy Hằng",
        desired_title="Hotel Front Office & Guest Experience Manager",
        professional_summary="Luxury Hotel Front Office Manager with 6.5 years directing 5-star resort operations, Opera PMS master user, and VIP guest satisfaction leader.",
        work_experiences=[
            make_exp(
                company_name="JW Marriott Hotel Hanoi",
                position_title="Assistant Front Office Manager",
                start_date="2021-02-01T00:00:00Z",
                is_current=True,
                description="Lead 35 front desk and concierge staff. Direct Front Office operations, Guest Relations, Opera PMS room assignment, Customer Service excellence, and multi-channel Reservation Systems.",
                achievements="Achieved 96% Guest Satisfaction Score (GSS), ranking top 3 in Marriott Asia-Pacific region."
            ),
            make_exp(
                company_name="Sofitel Legend Metropole Hanoi",
                position_title="Duty Manager & Guest Relations Supervisor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-01-31T00:00:00Z",
                description="Managed high-profile diplomatic delegation arrivals, VIP protocols, and Opera PMS night audits.",
                achievements="Managed presidential delegation logistics during international summit."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Tourism and Hospitality Management",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems", "Revenue Management", "Housekeeping Operations"],
        certificates=[{"certificate_name": "Certified Hospitality Supervisor (CHS)", "issuing_organization": "AHLEI"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Văn Minh",
        desired_title="Front Office Manager",
        professional_summary="Hotelier with 5.5 years in 5-star hotel Front Office, Opera PMS, Guest Relations, and front-desk team leadership.",
        work_experiences=[
            make_exp(
                company_name="Sheraton Saigon Hotel",
                position_title="Front Desk Manager",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage Front Office check-in/out, resolve Guest Relations disputes, oversee Opera PMS room inventory, deliver exceptional Customer Service, and maintain Reservation Systems.",
                achievements="Boosted front desk upsell room revenue by 25%."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Economics HCMC",
                major="Hospitality and Tourism Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Opera PMS)
    cands["CV03"] = make_candidate(
        candidate_name="Lê Thu Trang",
        desired_title="Guest Relations Manager",
        professional_summary="Boutique Hotel Manager with 5.5 years in guest service and customer care, but only used basic Excel and Smile PMS, lacking Opera PMS experience.",
        work_experiences=[
            make_exp(
                company_name="Hanoi La Siesta Boutique Hotel",
                position_title="Senior Guest Experience Manager",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Coordinate Front Office welcoming, maintain high Guest Relations ratings, deliver personalized Customer Service, and manage domestic Reservation Systems. Entire property runs on local Smile PMS, zero exposure to Oracle Opera PMS.",
                achievements="Won TripAdvisor Travelers' Choice Award for top boutique service."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Tourism Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Customer Service", "Reservation Systems"],
        certificates=[{"certificate_name": "Certified Hospitality Supervisor (CHS)", "issuing_organization": "AHLEI"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV04: Similar Skill Trap (Fast Food Cashier / Burger Flipper)
    cands["CV04"] = make_candidate(
        candidate_name="Phạm Quốc Anh",
        desired_title="Fast Food Counter Staff",
        professional_summary="Fast Food Cashier with 6 years taking burger orders, operating deep fryers, and mopping linoleum dining floors.",
        work_experiences=[
            make_exp(
                company_name="Lotteria Vietnam Fast Food",
                position_title="Shift Crew Leader",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Punch order numbers into touchscreen register, scoop french fries into cardboard cartons, wipe grease off plastic trays. No hotel room inventory, Opera PMS, concierge service, or luxury guest relations.",
                achievements="Maintained 90-second drive-thru order completion time."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Vocational College",
                major="Food Processing",
                degree="Associate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["POS Register", "Deep Frying", "Burger Assembly", "Tray Cleaning"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV05: Education Major Trap (Nuclear Physics)
    cands["CV05"] = make_candidate(
        candidate_name="Hoàng Gia Bảo",
        desired_title="Front Office Manager",
        professional_summary="Hotel front desk professional with 5.5 years in 5-star hotel front office, holding a degree in nuclear physics.",
        work_experiences=[
            make_exp(
                company_name="Vinpearl Resort Nha Trang",
                position_title="Assistant Front Desk Manager",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Supervise Front Office shifts, lead Guest Relations, manage room allocations in Opera PMS, ensure Customer Service excellence, and operate Reservation Systems.",
                achievements="Managed 800-room resort high-season occupancy."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science",
                major="Nuclear Engineering & Radiation Physics",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[{"certificate_name": "Certified Hospitality Supervisor (CHS)", "issuing_organization": "AHLEI"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV06: Higher Degree Trap (PhD in Metallurgical Science)
    cands["CV06"] = make_candidate(
        candidate_name="Võ Bích Phương",
        desired_title="Guest Relations Lead",
        professional_summary="Hospitality specialist with 5.2 years experience holding a PhD in Metallurgical Material Science.",
        work_experiences=[
            make_exp(
                company_name="InterContinental Danang",
                position_title="Guest Relations Manager",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Oversee Front Office, Guest Relations, Opera PMS reservations, Customer Service, and Reservation Systems.",
                achievements="Managed VIP club lounge services."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Metallurgical Material Science",
                degree="Doctorate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV07: Experience Threshold Trap (1.8 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Đặng Tuấn Tú",
        desired_title="Junior Front Desk Officer",
        professional_summary="Junior Front Desk Agent with 1.8 years welcoming guests and issuing room keycards.",
        work_experiences=[
            make_exp(
                company_name="Pullman Hanoi Hotel",
                position_title="Front Desk Agent",
                start_date="2022-09-01T00:00:00Z",
                is_current=True,
                description="Check in guests, assist in Front Office, support Guest Relations, learn Opera PMS, provide Customer Service, and handle Reservation Systems.",
                achievements="Checked in 5,000 hotel guests."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Hospitality Management",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV08: Experience Domain Trap (Mortuary Embalmer / Funeral Attendant)
    cands["CV08"] = make_candidate(
        candidate_name="Nguyễn Văn Hùng",
        desired_title="Funeral Home Attendant",
        professional_summary="Funeral Parlor Attendant with 5.5 years embalming bodies, arranging casket flowers, and directing grieving mourners.",
        work_experiences=[
            make_exp(
                company_name="Phung Hung Funeral Home",
                position_title="Senior Mortuary Attendant",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Apply formaldehyde embalming chemicals to deceased corpses, place floral wreaths around glass caskets, burn incense. No luxury hotel operations, Opera PMS check-in, or hotel guest relations.",
                achievements="Directed 1,000 funeral ceremonies with solemn decorum."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Medical College",
                major="Mortuary & Anatomy Sanitation",
                degree="Associate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Embalming", "Casket Dressing", "Funeral Coordination", "Mourning Protocol"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV09: Project vs Professional Experience (Only university tourism club mock check-in)
    cands["CV09"] = make_candidate(
        candidate_name="Bùi Thu Trang",
        desired_title="Hospitality Graduate",
        professional_summary="Recent graduate who performed mock check-in simulations and hotel roleplay tournaments.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Hotel Administration",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="National Hospitality Student Tournament",
                project_role="Mock Front Desk Lead",
                description="Roleplayed handling an angry hotel guest scenario and simulating room check-in.",
                technologies=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
                start_date="2023-08-01T00:00:00Z",
                end_date="2023-11-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV10: Internship Trap (Repeated luggage bellhop internships)
    cands["CV10"] = make_candidate(
        candidate_name="Lâm Quốc Đạt",
        desired_title="Hospitality Intern",
        professional_summary="Candidate with multiple luggage handling and door opening bellboy internships totaling 3.5 years part-time.",
        work_experiences=[
            make_exp(
                company_name="Melia Hanoi Hotel",
                position_title="Bellboy Intern",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Push luggage carts to guest elevators, open taxi doors."
            ),
            make_exp(
                company_name="Pan Pacific Hanoi",
                position_title="Door Attendant Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Hold umbrellas during rainy arrivals and tag luggage bags."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Hospitality Management",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV11: Freelance Trap (5 years freelance boutique resort hospitality consultant)
    cands["CV11"] = make_candidate(
        candidate_name="Đoàn Quỳnh Nga",
        desired_title="Senior Freelance Hospitality Consultant",
        professional_summary="Independent Resort Consultant with 5.5 years training Front Office teams, configuring Opera PMS, and establishing 5-star Guest Relations standards.",
        work_experiences=[
            make_exp(
                company_name="Nga Hospitality Operations Consultancy",
                position_title="Principal Hospitality Consultant",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Contracted by luxury resorts to restructure Front Office procedures, implement Opera PMS, train staff in Guest Relations, deliver Customer Service excellence, and streamline Reservation Systems.",
                achievements="Overhauled front office operations for 12 boutique resorts across Phu Quoc and Da Nang."
            )
        ],
        educations=[
            make_edu(
                school_name="National Economics University",
                major="Hospitality and Tourism",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[{"certificate_name": "Certified Hospitality Supervisor (CHS)", "issuing_organization": "AHLEI"}],
        languages=[{"language": "English", "proficiency": "IELTS 7.5"}]
    )

    # CV12: Overlapping Dates (2.2 calendar years claiming 5.0 years)
    cands["CV12"] = make_candidate(
        candidate_name="Ngô Văn Trọng",
        desired_title="Front Desk Manager",
        professional_summary="Hotelier claiming overlapping concurrent front office jobs.",
        work_experiences=[
            make_exp(
                company_name="Hotel De L'Opera Hanoi",
                position_title="Front Desk Supervisor",
                start_date="2021-08-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Manage Front Office check-in and Opera PMS."
            ),
            make_exp(
                company_name="Silk Path Hotel (Concurrent)",
                position_title="Guest Relations Officer",
                start_date="2021-10-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent guest relations officer."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Hospitality",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV13: Certification Equivalent Trap (Google Digital Garage instead of CHS)
    cands["CV13"] = make_candidate(
        candidate_name="Phan Thị Lan",
        desired_title="Front Office Manager",
        professional_summary="Front Office Manager with 5.5 years experience holding Google Digital Garage certificate.",
        work_experiences=[
            make_exp(
                company_name="Movenpick Hotel Hanoi",
                position_title="Front Office Lead",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Direct Front Office, Guest Relations, Opera PMS operations, Customer Service, and Reservation Systems.",
                achievements="Maintained 94% guest satisfaction score."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Economics HCMC",
                major="Hospitality Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[{"certificate_name": "Google Digital Garage Certificate", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV14: Certification Unrelated (CompTIA Security+)
    cands["CV14"] = make_candidate(
        candidate_name="Trần Minh Tuấn",
        desired_title="Front Office Manager",
        professional_summary="Front Office Manager with 5.5 years experience holding CompTIA Security+ IT certificate.",
        work_experiences=[
            make_exp(
                company_name="Novotel Danang Premier",
                position_title="Front Office Manager",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Lead Front Office, Guest Relations, Opera PMS, Customer Service, and Reservation Systems.",
                achievements="Reduced check-in wait times by 30%."
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
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[{"certificate_name": "CompTIA Security+ Certification", "issuing_organization": "CompTIA"}],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV15: Language Threshold Trap (IELTS 5.0 vs required 6.5)
    cands["CV15"] = make_candidate(
        candidate_name="Lê Hoàng Quân",
        desired_title="Front Office Manager",
        professional_summary="Front Office professional with 5.5 years experience, IELTS 5.0 English score.",
        work_experiences=[
            make_exp(
                company_name="Muong Thanh Luxury Hotel",
                position_title="Front Desk Manager",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Responsible for Front Office, Guest Relations, Opera PMS, Customer Service, and Reservation Systems.",
                achievements="Led front office team for 500-room property."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Open University",
                major="Hospitality Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 5.0"}]
    )

    # CV16: Wrong Language Trap (Russian TRKI-2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Đoàn Thu Thảo",
        desired_title="Front Office Specialist",
        professional_summary="Front office specialist with 5.5 years experience, fluent in Russian.",
        work_experiences=[
            make_exp(
                company_name="Cam Ranh Riviera Beach Resort",
                position_title="Guest Relations Lead",
                start_date="2018-12-01T00:00:00Z",
                is_current=True,
                description="Coordinate Front Office, Guest Relations, Opera PMS, Customer Service, and Reservation Systems for Russian charter tourist groups.",
                achievements="Managed 1,000 Russian tourist arrivals weekly."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="Russian Linguistics & Tourism",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Front Office", "Guest Relations", "Opera PMS", "Customer Service", "Reservation Systems"],
        certificates=[],
        languages=[{"language": "Russian", "proficiency": "TRKI-2"}]
    )

    # CV17: Semantic Similarity Trap (Guest Empathy Buzzwords without Opera PMS proof)
    cands["CV17"] = make_candidate(
        candidate_name="Võ Đăng Khôi",
        desired_title="Guest Chakra Alchemist",
        professional_summary="Visionary hospitality empath radiating cosmic guest connection, emotional aura harmony, and spiritual concierge vibes.",
        work_experiences=[
            make_exp(
                company_name="Spiritual Sanctuary Lodge",
                position_title="Guest Aura Harmonizer",
                start_date="2018-05-01T00:00:00Z",
                is_current=True,
                description="Sit in lotus posture by the lobby bamboo fountain, radiating peaceful energy to arriving travelers. Never touched Opera PMS or handled room keys.",
                achievements="Chanted welcoming mantras for 500 spiritual travelers."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Culture",
                major="Cultural Studies",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Mindful Empathy", "Spiritual Welcoming", "Public Speaking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Trần Văn Nam",
        desired_title="Front Office Manager",
        professional_summary="Hotel staff.",
        work_experiences=[
            make_exp(
                company_name="Hotel",
                position_title="Front Desk",
                start_date="",
                description="Welcome guests."
            )
        ],
        educations=[],
        skills=["Front Office", "Guest Relations"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Executive Pastry Chef / French Baker)
    cands["CV19"] = make_candidate(
        candidate_name="Nguyễn Văn Bảo",
        desired_title="Executive French Pastry Chef",
        professional_summary="Master Pastry Chef with 8 years crafting delicate French macarons, chocolate sculptures, and Michelin-star multi-tiered wedding cakes.",
        work_experiences=[
            make_exp(
                company_name="La Table du Metropole",
                position_title="Executive Pastry Chef",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Temper Belgian chocolate, bake 500 croissants daily, supervise 10 pastry cooks in hot kitchen ovens. No lobby operations, Opera PMS check-in, or hotel room allocations.",
                achievements="Won Best Pastry Chef Vietnam in International Culinary Cup."
            )
        ],
        educations=[
            make_edu(
                school_name="Le Cordon Bleu Paris",
                major="French Pastry & Baking Arts",
                degree="Associate",
                start_date="2013-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["Pastry Baking", "Chocolate Sculpting", "Croissant Lamination", "Kitchen Food Safety"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 7.0"}]
    )

    # CV20: Cross-Domain Near Match (Airline GDS Ticket Booking Agent)
    cands["CV20"] = make_candidate(
        candidate_name="Phạm Bích Ngọc",
        desired_title="Airline GDS Ticketing Agent",
        professional_summary="Airline Ticketing Specialist with 5.5 years issuing international flight tickets and booking seat assignments on Amadeus GDS.",
        work_experiences=[
            make_exp(
                company_name="Vietnam Airlines Booking Office",
                position_title="Senior GDS Ticketing Officer",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Issue electronic flight tickets, calculate airfare taxes, process passenger ticket refunds on Amadeus GDS. Never operated hotel Opera PMS, welcomed guests to hotel lobby, or managed hotel rooms.",
                achievements="Issued $3M in international air tickets."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Aviation Academy",
                major="Aviation Commercial Operations",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Amadeus GDS", "Flight Ticketing", "Fare Calculation", "Airline Rebooking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "IELTS 6.5"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 6.5 yrs experience, CHS cert, IELTS 7.5, Hospitality degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional CHS certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Opera PMS skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Fast-food burger cashier is not 5-star Hotel Front Office and Guest Relations."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Nuclear Physics fails Hospitality/Tourism/Business major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Doctorate in Metallurgical Science fails Hospitality/Business field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.8 years experience vs required 5.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Mortuary embalming and funeral attendance lacks luxury hotel guest relations and Opera PMS."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "Student mock check-in roleplays cannot replace 5.0 years professional hotel front office experience."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Luggage bellboy internships do not satisfy Senior Front Office Manager level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance hospitality consultant meets tenure, Opera PMS, and resort standards."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment duration is 2.2 years < 5.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get CHS cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "CompTIA IT cyber cert does not grant hospitality bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "IELTS 5.0 is below mandatory threshold IELTS 6.5."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Russian TRKI-2 does not substitute for required English IELTS 6.5."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Guest chakra buzzwords lack concrete Opera PMS and room management evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Pastry Chef lacks Front Office management, Opera PMS, and hotel lobby operations."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Airline GDS ticket agent lacks hotel lobby front desk, Opera PMS, and physical guest hospitality."),
    }
