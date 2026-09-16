from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-logistics-manager-06",
        title="Senior Logistics & Supply Chain Operations Manager",
        description=(
            "TransGlobal Logistics is seeking an experienced Senior Logistics & Supply Chain Operations Manager to direct our "
            "centralized fulfillment hub and cross-border distribution network. You will oversee multi-site warehouse operations, "
            "implement advanced WMS inventory tracking, plan freight demand cycles, ensure trade compliance under Incoterms 2020, "
            "and manage 3PL carrier contracts to reduce freight costs while maintaining 99.5% on-time order fulfillment."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 5+ years of end-to-end warehousing, distribution, and supply chain management experience.\n"
            "- Core Technical Skills: Warehouse Management, Inventory Management, Supply Chain Planning, WMS (Warehouse Management System), Incoterms.\n"
            "- Preferred Skills: Procurement, Customs clearance, 3PL Vendor Management, Cold Chain logistics.\n"
            "- Education: Bachelor's degree or above in Logistics, Supply Chain Management, International Trade, Industrial Engineering, Economics, or related field.\n"
            "- Language: Working English proficiency (TOEIC 700 or equivalent) for international shipping correspondence.\n"
            "- Certifications: CSCP (Certified Supply Chain Professional) or CLTD preferred."
        ),
        required_experience_years=5.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "Warehouse Management", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Inventory Management", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "Supply Chain Planning", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "WMS", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Incoterms", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Procurement", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "Customs", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "CSCP", "is_mandatory": False},
        ],
        required_languages=[
            {"language": "English", "proficiency": "TOEIC 700", "is_mandatory": True},
        ],
        ai_weights_config={"skills": 35.0, "experience": 35.0, "education": 15.0, "other": 15.0},
    )


def get_candidates() -> Dict[str, Dict[str, Any]]:
    cands = {}

    # CV01: Near Perfect Match
    cands["CV01"] = make_candidate(
        candidate_name="Nguyễn Hữu Đạt",
        desired_title="Senior Logistics & Supply Chain Operations Manager",
        professional_summary="Logistics Operations Lead with 6.5 years directing 20,000 sqm fulfillment centers, WMS rollouts, and Incoterms freight compliance.",
        work_experiences=[
            make_exp(
                company_name="DHL Supply Chain Vietnam",
                position_title="Senior Warehouse Operations Manager",
                start_date="2021-02-01T00:00:00Z",
                is_current=True,
                description="Direct Warehouse Management across 3 regional DCs. Lead Inventory Management, Supply Chain Planning, Manhattan WMS optimization, and import/export Incoterms compliance.",
                achievements="Improved warehouse order picking throughput by 32% while reducing inventory shrinkage below 0.05%."
            ),
            make_exp(
                company_name="Kuehne + Nagel Vietnam",
                position_title="Supply Chain Specialist",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-01-31T00:00:00Z",
                description="Managed international freight routing, cargo manifests, and warehouse dispatching.",
                achievements="Managed $4M annual ocean freight lane volume."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Maritime University",
                major="Logistics and Supply Chain Management",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms", "Procurement", "Customs"],
        certificates=[{"certificate_name": "CSCP", "issuing_organization": "APICS"}],
        languages=[{"language": "English", "proficiency": "TOEIC 850"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Văn Khánh",
        desired_title="Logistics Manager",
        professional_summary="Supply chain professional with 5.5 years in Warehouse Management, WMS integration, Inventory Management, and Incoterms.",
        work_experiences=[
            make_exp(
                company_name="Schenker Vietnam",
                position_title="Logistics Hub Manager",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage Warehouse Management hub, maintain accurate Inventory Management, oversee Supply Chain Planning, operate SAP WMS, and handle Incoterms freight documentation.",
                achievements="Maintained 99.4% on-time shipment dispatch rate."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Business and Logistics",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Incoterms)
    cands["CV03"] = make_candidate(
        candidate_name="Lê Đình Bách",
        desired_title="Warehouse Operations Lead",
        professional_summary="Domestic Warehouse Manager with 5.5 years managing local stock distribution, lacking international trade and Incoterms experience.",
        work_experiences=[
            make_exp(
                company_name="Giaohangtietkiem (GHTK)",
                position_title="Hub Operations Supervisor",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Supervise domestic parcel sorting, Warehouse Management, Inventory Management, WMS tracking, and local Supply Chain Planning. Purely domestic operations with no Incoterms knowledge.",
                achievements="Managed sorting line processing 100K parcels per day."
            )
        ],
        educations=[
            make_edu(
                school_name="Thuongmai University",
                major="Logistics Management",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS"],
        certificates=[{"certificate_name": "CSCP", "issuing_organization": "APICS"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV04: Similar Skill Trap (Motorbike Delivery Courier)
    cands["CV04"] = make_candidate(
        candidate_name="Phạm Văn Toàn",
        desired_title="Delivery Courier",
        professional_summary="Motorbike Delivery Driver with 6 years picking up food orders and delivering packages to residential households.",
        work_experiences=[
            make_exp(
                company_name="Shopee Express Rider Network",
                position_title="Last-mile Motorbike Courier",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Ride motorbike around Hanoi streets, deliver shoe boxes and bubble tea to individual shoppers, collect cash on delivery (COD). No warehouse management or supply chain planning.",
                achievements="Maintained 5-star delivery rating over 10,000 completed motorbike deliveries."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Vocational College",
                major="Automotive Repair",
                degree="Associate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Motorbike Riding", "Cash on Delivery", "Route Navigation", "Parcel Dropoff"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV05: Education Major Trap (Music / Vocal Performance)
    cands["CV05"] = make_candidate(
        candidate_name="Hoàng Quốc Bảo",
        desired_title="Logistics Manager",
        professional_summary="Logistics operations lead with 5.5 years in warehouse and freight management, holding a degree in vocal performance.",
        work_experiences=[
            make_exp(
                company_name="Nippon Express Vietnam",
                position_title="Warehouse Operations Lead",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage Warehouse Management, Inventory Management, Supply Chain Planning, WMS, and Incoterms documentation.",
                achievements="Streamlined outbound dispatch cycle."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam National Academy of Music",
                major="Vocal Performance and Opera",
                degree="Bachelor",
                start_date="2013-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[{"certificate_name": "CSCP", "issuing_organization": "APICS"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV06: Higher Degree Trap (PhD in Organic Chemistry)
    cands["CV06"] = make_candidate(
        candidate_name="Võ Thị Thu Hà",
        desired_title="Logistics Operations Lead",
        professional_summary="Logistics specialist with 5.2 years in distribution hubs holding a PhD in Organic Chemistry.",
        work_experiences=[
            make_exp(
                company_name="Damco Vietnam",
                position_title="Supply Chain Coordinator",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Oversee Warehouse Management, Inventory Management, Supply Chain Planning, WMS, and Incoterms freight.",
                achievements="Managed regional cold chain audits."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam National University",
                major="Organic Chemistry",
                degree="Doctorate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 800"}]
    )

    # CV07: Experience Threshold Trap (1.8 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Đặng Tuấn Minh",
        desired_title="Junior Logistics Officer",
        professional_summary="Junior Logistics Officer with 1.8 years experience in inventory cycle counts and inbound receiving.",
        work_experiences=[
            make_exp(
                company_name="YCH Group Logistics",
                position_title="Junior Warehouse Officer",
                start_date="2022-09-01T00:00:00Z",
                is_current=True,
                description="Assist in Warehouse Management, record counts in Inventory Management, learn WMS system, support Incoterms tracking and Supply Chain Planning.",
                achievements="Assisted in annual physical stocktake of 15,000 SKUs."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="Logistics",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 720"}]
    )

    # CV08: Experience Domain Trap (Airline Flight Attendant / Cabin Crew)
    cands["CV08"] = make_candidate(
        candidate_name="Nguyễn Bích Thảo",
        desired_title="Flight Attendant Purser",
        professional_summary="Senior Cabin Crew with 5.5 years serving in-flight meals and conducting passenger safety demonstrations.",
        work_experiences=[
            make_exp(
                company_name="Vietnam Airlines",
                position_title="Cabin Crew Purser",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Welcome airplane passengers, serve chicken or fish meals, demonstrate oxygen masks, ensure seatbelts fastened during turbulence. No cargo palletizing, WMS, or freight logistics.",
                achievements="Completed 1,200 commercial flights with zero safety incidents."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University",
                major="English Studies",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["In-flight Service", "Passenger Safety", "Hospitality", "Beverage Service"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV09: Project vs Professional Experience (Only uni supply chain club simulation)
    cands["CV09"] = make_candidate(
        candidate_name="Bùi Hoàng Long",
        desired_title="Supply Chain Trainee",
        professional_summary="Recent graduate who participated in national university supply chain simulation challenges.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Economics and Logistics",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="National Supply Chain Case Competition 2023",
                project_role="Team Analyst",
                description="Modeled hypothetical warehouse layout and simulated WMS inventory dispatch pipeline under Incoterms conditions.",
                technologies=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
                start_date="2023-08-01T00:00:00Z",
                end_date="2023-11-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV10: Internship Trap (Repeated barcode scanning internships)
    cands["CV10"] = make_candidate(
        candidate_name="Lâm Đình Trọng",
        desired_title="Logistics Intern",
        professional_summary="Candidate with multiple short barcode scanning and packing internships totaling 3.5 years part-time.",
        work_experiences=[
            make_exp(
                company_name="Lazada Logistics",
                position_title="Packing Intern",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Scan barcode on incoming cardboard cartons and tape boxes."
            ),
            make_exp(
                company_name="Kerry Express",
                position_title="Warehouse Tally Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Check manifest papers against pallet numbers in staging area."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Maritime University",
                major="Logistics",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV11: Freelance Trap (5 years freelance logistics & 3PL supply chain consultant)
    cands["CV11"] = make_candidate(
        candidate_name="Đoàn Quốc Tuấn",
        desired_title="Senior Freelance Supply Chain Consultant",
        professional_summary="Independent Logistics Consultant with 5.5 years designing Warehouse Management, WMS rollouts, Inventory Management, and Incoterms compliance for manufacturing clients.",
        work_experiences=[
            make_exp(
                company_name="Tuan Logistics Advisory",
                position_title="Principal Logistics Consultant",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Contracted by multinational factories to configure WMS systems, structure Warehouse Management processes, audit Inventory Management, optimize Supply Chain Planning, and enforce Incoterms.",
                achievements="Designed and commissioned 4 greenfield distribution centers."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Maritime University",
                major="Logistics and Supply Chain",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[{"certificate_name": "CSCP", "issuing_organization": "APICS"}],
        languages=[{"language": "English", "proficiency": "TOEIC 780"}]
    )

    # CV12: Overlapping Dates (2.2 calendar years claiming 5.0 years)
    cands["CV12"] = make_candidate(
        candidate_name="Ngô Trọng Hiếu",
        desired_title="Logistics Manager",
        professional_summary="Logistics specialist claiming overlapping concurrent warehouse positions.",
        work_experiences=[
            make_exp(
                company_name="Vinafco Logistics",
                position_title="Warehouse Supervisor",
                start_date="2021-08-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Manage Warehouse Management and WMS systems."
            ),
            make_exp(
                company_name="Sotrans Logistics (Concurrent)",
                position_title="Distribution Lead",
                start_date="2021-10-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent distribution operations supervisor."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Maritime University",
                major="Logistics",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV13: Certification Equivalent Trap (Google Digital Marketing instead of CSCP)
    cands["CV13"] = make_candidate(
        candidate_name="Phan Minh Hoàng",
        desired_title="Logistics Operations Manager",
        professional_summary="Logistics operations lead with 5.5 years experience holding Google Digital Marketing certificate.",
        work_experiences=[
            make_exp(
                company_name="Yusen Logistics Vietnam",
                position_title="Operations Lead",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Direct Warehouse Management, Inventory Management, Supply Chain Planning, WMS, and Incoterms documentation.",
                achievements="Managed 15,000 TEU freight volume."
            )
        ],
        educations=[
            make_edu(
                school_name="Foreign Trade University",
                major="International Trade",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[{"certificate_name": "Google Digital Marketing Certificate", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV14: Certification Unrelated (CEH Certified Ethical Hacker)
    cands["CV14"] = make_candidate(
        candidate_name="Trần Văn Tài",
        desired_title="Logistics Manager",
        professional_summary="Logistics operations manager with 5.5 years experience holding CEH ethical hacker cert.",
        work_experiences=[
            make_exp(
                company_name="Gemadept Corporation",
                position_title="Warehouse Manager",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Lead Warehouse Management, Inventory Management, Supply Chain Planning, WMS, and Incoterms operations.",
                achievements="Reduced turnaround time by 20%."
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
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[{"certificate_name": "CEH Certified Ethical Hacker", "issuing_organization": "EC-Council"}],
        languages=[{"language": "English", "proficiency": "TOEIC 740"}]
    )

    # CV15: Language Threshold Trap (TOEIC 500 vs required 700)
    cands["CV15"] = make_candidate(
        candidate_name="Lê Quốc Cường",
        desired_title="Logistics Manager",
        professional_summary="Logistics manager with 5.5 years experience, TOEIC 500 English score.",
        work_experiences=[
            make_exp(
                company_name="Tan Cang Logistics",
                position_title="Operations Lead",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Lead Warehouse Management, Inventory Management, Supply Chain Planning, WMS, and Incoterms documentation.",
                achievements="Maintained accurate port container dispatch logs."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Maritime University",
                major="Logistics",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 500"}]
    )

    # CV16: Wrong Language Trap (Russian TRKI-2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Dương Bích Thủy",
        desired_title="Logistics Specialist",
        professional_summary="Logistics specialist with 5.5 years experience, fluent in Russian.",
        work_experiences=[
            make_exp(
                company_name="Vietsovpetro Logistics",
                position_title="Supply Operations Officer",
                start_date="2018-12-01T00:00:00Z",
                is_current=True,
                description="Coordinate Warehouse Management, Inventory Management, Supply Chain Planning, WMS, and Incoterms freight with Russian suppliers.",
                achievements="Managed offshore oil rig parts dispatching."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="Russian Studies & Logistics",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Warehouse Management", "Inventory Management", "Supply Chain Planning", "WMS", "Incoterms"],
        certificates=[],
        languages=[{"language": "Russian", "proficiency": "TRKI-2"}]
    )

    # CV17: Semantic Similarity Trap (Cosmic Logistics Buzzwords without real WMS/SKU evidence)
    cands["CV17"] = make_candidate(
        candidate_name="Võ Đăng Khoa",
        desired_title="Cosmic Cargo Harmonizer",
        professional_summary="Visionary kinetic flow harmonizer channeling vibrational parcel momentum, quantum cargo alignment, and universal freight chakras.",
        work_experiences=[
            make_exp(
                company_name="Zen Logistics Lab",
                position_title="Kinetic Flow Alchemist",
                start_date="2018-05-01T00:00:00Z",
                is_current=True,
                description="Meditate on the metaphysical flow of physical objects in space. Never operated pallet jacks, barcode scanners, or WMS systems.",
                achievements="Wrote self-help poetry about the journey of cardboard boxes."
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
        skills=["Mindful Flow", "Meditation", "Public Speaking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Trần Văn Nam",
        desired_title="Warehouse Manager",
        professional_summary="Warehouse professional.",
        work_experiences=[
            make_exp(
                company_name="Warehouse Hub",
                position_title="Warehouse Lead",
                start_date="",
                description="Manage warehouse stock."
            )
        ],
        educations=[],
        skills=["Warehouse Management", "Inventory Management"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Merchant Navy Ocean Captain)
    cands["CV19"] = make_candidate(
        candidate_name="Nguyễn Văn Đại",
        desired_title="Ocean Master Mariner / Ship Captain",
        professional_summary="Master Mariner with 8 years commanding 10,000 TEU container ships across open ocean routes, celestial navigation, and nautical seamanship.",
        work_experiences=[
            make_exp(
                company_name="Vinalines Shipping Fleet",
                position_title="Ship Captain",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Command navigation bridge of 50,000 DWT vessel, manage 25 crew members, steer ship through typhoons using radar and GPS. No warehouse distribution, WMS configuration, or domestic 3PL routing.",
                achievements="Navigated 80 trans-Pacific voyages without navigational incident."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Maritime University",
                major="Navigation and Seamanship",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["Ship Navigation", "Celestial Navigation", "Radar Plotting", "Vessel Seamanship", "Maritime Safety"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 850"}]
    )

    # CV20: Cross-Domain Near Match (Grain Silo Chemical Quality Inspector)
    cands["CV20"] = make_candidate(
        candidate_name="Phạm Thu Hà",
        desired_title="Agricultural Grain Quality Inspector",
        professional_summary="Grain Quality Inspector with 5.5 years testing rice moisture levels and pest infestation in bulk agricultural grain silos.",
        work_experiences=[
            make_exp(
                company_name="Vinafood 2 Corporation",
                position_title="Grain Quality Testing Specialist",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Insert grain sampling spears into rice silos, perform laboratory chemical moisture analysis, issue grain grade certificates. Never operated WMS, scheduled truck deliveries, or drafted Incoterms contracts.",
                achievements="Tested 200,000 metric tons of exported rice."
            )
        ],
        educations=[
            make_edu(
                school_name="Can Tho University",
                major="Agronomy & Food Technology",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Grain Sampling", "Chemical Moisture Testing", "Infestation Inspection", "Lab Titration"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 6.5 yrs experience, CSCP cert, TOEIC 850, Logistics degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional CSCP certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Incoterms skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Motorbike food/parcel courier is not enterprise Warehouse Management and Supply Chain Planning."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in Vocal Performance fails Logistics/Engineering/Trade major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Doctorate in Organic Chemistry fails Logistics/Trade field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.8 years experience vs required 5.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Airline flight attendant cabin service lacks cargo logistics, WMS, and inventory."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "University simulation projects cannot replace 5.0 years professional logistics operations."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Barcode scanning internships do not satisfy Senior Logistics Manager level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance supply chain consultant meets tenure, skills, and DC design."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment duration is 2.2 years < 5.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get CSCP cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "CEH cyber cert does not grant logistics bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "TOEIC 500 is below mandatory threshold TOEIC 700."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Russian TRKI-2 does not substitute for required English TOEIC 700."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Cosmic cargo buzzwords lack concrete WMS and inventory evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Ship Captain lacks land-based warehouse management, WMS, and domestic logistics operations."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Agricultural grain tester lacks WMS, truck scheduling, and Incoterms shipping."),
    }
