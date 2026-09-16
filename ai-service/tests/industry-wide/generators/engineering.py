from typing import Dict, Any
from .common import make_jd, make_candidate, make_exp, make_edu, make_proj, make_expected


def get_jd() -> Dict[str, Any]:
    return make_jd(
        id="jd-engineering-automation-09",
        title="Senior Automation & Quality Engineering Manager",
        description=(
            "VinFast Advanced Manufacturing is seeking a Senior Automation & Quality Engineering Manager to drive factory automation, "
            "robotic assembly line optimization, and operational excellence. You will program and maintain PLC/SCADA industrial architectures, "
            "lead Lean Manufacturing and Six Sigma yield improvement initiatives, formulate Preventive Maintenance protocols, "
            "and eliminate factory downtime across high-throughput production lines."
        ),
        requirements=(
            "Required Qualifications:\n"
            "- Professional Experience: Minimum 5+ years in industrial manufacturing automation and process quality engineering.\n"
            "- Core Technical Skills: PLC (Siemens/Rockwell), SCADA, Lean Manufacturing, Six Sigma, Preventive Maintenance.\n"
            "- Preferred Skills: AutoCAD, FMEA, Robotics, Root Cause Analysis.\n"
            "- Education: Bachelor's degree or above in Electrical Engineering, Mechanical Engineering, Mechatronics, Automation Engineering, Industrial Engineering, or related field.\n"
            "- Language: Working English proficiency (TOEIC 700 or equivalent) for vendor technical manuals and equipment commissioning.\n"
            "- Certifications: Six Sigma Green Belt / Black Belt preferred."
        ),
        required_experience_years=5.0,
        experience_level="SENIOR",
        level_requirement_mode="REQUIRED",
        required_skills=[
            {"skill_name": "PLC", "is_mandatory": True, "minimum_years": 4.0},
            {"skill_name": "SCADA", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Lean Manufacturing", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Six Sigma", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "Preventive Maintenance", "is_mandatory": True, "minimum_years": 3.0},
            {"skill_name": "AutoCAD", "is_mandatory": False, "minimum_years": 0.0},
            {"skill_name": "FMEA", "is_mandatory": False, "minimum_years": 0.0},
        ],
        required_certificates=[
            {"certificate_name": "Six Sigma Black Belt", "is_mandatory": False},
        ],
        required_languages=[
            {"language": "English", "proficiency": "TOEIC 700", "is_mandatory": True},
        ],
        ai_weights_config={"skills": 40.0, "experience": 30.0, "education": 15.0, "other": 15.0},
    )


def get_candidates() -> Dict[str, Dict[str, Any]]:
    cands = {}

    # CV01: Near Perfect Match
    cands["CV01"] = make_candidate(
        candidate_name="Nguyễn Văn Đức",
        desired_title="Senior Automation & Quality Engineering Manager",
        professional_summary="Senior Automation Engineer with 6.5 years designing Siemens S7-1500 PLC systems, SCADA architectures, and implementing Lean Six Sigma production frameworks.",
        work_experiences=[
            make_exp(
                company_name="Schneider Electric Vietnam",
                position_title="Senior Automation & Quality Lead",
                start_date="2021-02-01T00:00:00Z",
                is_current=True,
                description="Lead factory automation via Siemens PLC programming and WinCC SCADA systems. Drive Lean Manufacturing and Six Sigma DMAIC projects. Supervise plant-wide Preventive Maintenance schedules.",
                achievements="Reduced unplanned machine downtime by 42% and achieved Six Sigma quality yield of 99.7%."
            ),
            make_exp(
                company_name="Foxconn Precision Industry",
                position_title="Process Automation Engineer",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-01-31T00:00:00Z",
                description="Programmed Mitsubishi PLCs, integrated SCADA telemetry, executed daily line preventive maintenance.",
                achievements="Automated 3 manual stamping cells reducing labor costs by 30%."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Automation and Control Engineering",
                degree="Bachelor",
                start_date="2012-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance", "AutoCAD", "FMEA"],
        certificates=[{"certificate_name": "Six Sigma Black Belt", "issuing_organization": "ASQ"}],
        languages=[{"language": "English", "proficiency": "TOEIC 850"}]
    )

    # CV02: Strong Match
    cands["CV02"] = make_candidate(
        candidate_name="Trần Hùng Cường",
        desired_title="Automation Manager",
        professional_summary="Industrial automation engineer with 5.5 years in PLC ladder programming, SCADA monitoring, Lean Manufacturing, and Preventive Maintenance.",
        work_experiences=[
            make_exp(
                company_name="Canon Vietnam",
                position_title="Senior Maintenance & Automation Engineer",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Manage Omron PLC automation lines, SCADA real-time alerts, apply Lean Manufacturing 5S/Kaizen, conduct Six Sigma quality studies, and enforce Preventive Maintenance.",
                achievements="Led factory Kaizen initiative saving $150K annually in scrap reduction."
            )
        ],
        educations=[
            make_edu(
                school_name="Ho Chi Minh City University of Technology (HCMUT)",
                major="Mechatronics Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV03: Mandatory Threshold Failure (Missing Six Sigma)
    cands["CV03"] = make_candidate(
        candidate_name="Lê Quốc Tuấn",
        desired_title="Automation Specialist",
        professional_summary="Maintenance Engineer with 5.5 years in electrical wiring, PLC, and SCADA, lacking statistical quality control and Six Sigma experience.",
        work_experiences=[
            make_exp(
                company_name="Suntory PepsiCo Vietnam",
                position_title="Plant Automation Technician",
                start_date="2019-02-01T00:00:00Z",
                is_current=True,
                description="Debug Siemens PLC controllers, monitor SCADA screens, perform Preventive Maintenance on conveyor belts and apply Lean Manufacturing 5S. Never trained in Six Sigma statistical process control.",
                achievements="Maintained 98% line uptime on bottling line."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industry",
                major="Electrical Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Preventive Maintenance"],
        certificates=[{"certificate_name": "Six Sigma Black Belt", "issuing_organization": "ASQ"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV04: Similar Skill Trap (Auto Mechanic / Oil Changer)
    cands["CV04"] = make_candidate(
        candidate_name="Phạm Văn Dũng",
        desired_title="Auto Garage Mechanic",
        professional_summary="Car Mechanic with 6 years changing oil filters, replacing brake pads, and rotating tires on passenger cars in local auto repair shop.",
        work_experiences=[
            make_exp(
                company_name="Gara Auto 247",
                position_title="Lead Garage Mechanic",
                start_date="2018-03-01T00:00:00Z",
                is_current=True,
                description="Drain motor oil from engines, replace air filters, bleed hydraulic brake lines with hand spanners. No factory production lines, PLC ladder programming, or SCADA telemetry.",
                achievements="Repaired over 2,000 passenger vehicles."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Vocational College",
                major="Automotive Maintenance",
                degree="Associate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Engine Oil Change", "Brake Pad Replacement", "Tire Rotation", "Auto Diagnostics"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV05: Education Major Trap (English Linguistics)
    cands["CV05"] = make_candidate(
        candidate_name="Hoàng Thị Mai",
        desired_title="Automation Engineer",
        professional_summary="Automation engineer with 5.5 years in PLC, SCADA, and Lean Six Sigma, holding a degree in English Linguistics.",
        work_experiences=[
            make_exp(
                company_name="VinFast Automotive",
                position_title="Automation Specialist",
                start_date="2019-01-01T00:00:00Z",
                is_current=True,
                description="Program Siemens PLC units, monitor SCADA interfaces, drive Lean Manufacturing, execute Six Sigma root-cause studies, and manage Preventive Maintenance.",
                achievements="Reduced plant energy consumption by 15%."
            )
        ],
        educations=[
            make_edu(
                school_name="University of Languages and International Studies",
                major="English Linguistics & Translation",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[{"certificate_name": "Six Sigma Black Belt", "issuing_organization": "ASQ"}],
        languages=[{"language": "English", "proficiency": "TOEIC 850"}]
    )

    # CV06: Higher Degree Trap (PhD in Ancient Oriental Theology)
    cands["CV06"] = make_candidate(
        candidate_name="Võ Văn Hậu",
        desired_title="Plant Quality Lead",
        professional_summary="Plant engineering specialist with 5.2 years experience holding a PhD in Ancient Oriental Theology.",
        work_experiences=[
            make_exp(
                company_name="LG Electronics Haiphong",
                position_title="Automation & Quality Lead",
                start_date="2019-04-01T00:00:00Z",
                is_current=True,
                description="Manage PLC control loops, SCADA integration, Lean Manufacturing processes, Six Sigma quality inspections, and Preventive Maintenance.",
                achievements="Standardized automated soldering inspection."
            )
        ],
        educations=[
            make_edu(
                school_name="Vietnam Academy of Social Sciences",
                major="Oriental Religious Philosophy & Theology",
                degree="Doctorate",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 800"}]
    )

    # CV07: Experience Threshold Trap (1.8 years experience)
    cands["CV07"] = make_candidate(
        candidate_name="Đỗ Gia Bảo",
        desired_title="Junior Automation Engineer",
        professional_summary="Junior Automation Engineer with 1.8 years assisting in PLC wiring and sensory calibration.",
        work_experiences=[
            make_exp(
                company_name="Panasonic Industrial Devices",
                position_title="Junior Automation Technician",
                start_date="2022-09-01T00:00:00Z",
                is_current=True,
                description="Assist in PLC ladder debugging, calibrate SCADA sensors, observe Lean Manufacturing and Six Sigma projects, help with Preventive Maintenance.",
                achievements="Assisted in annual overhaul of 3 assembly lines."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Control and Automation",
                degree="Bachelor",
                start_date="2018-09-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 720"}]
    )

    # CV08: Experience Domain Trap (Garment Factory Sewing Seamstress)
    cands["CV08"] = make_candidate(
        candidate_name="Nguyễn Thị Nụ",
        desired_title="Garment Production Seamstress",
        professional_summary="Garment Factory Sewing Operator with 5.5 years operating single-needle electric sewing machines to stitch shirt collars.",
        work_experiences=[
            make_exp(
                company_name="May 10 Garment Corporation",
                position_title="Assembly Line Seamstress",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Depress foot pedal to stitch cloth seams on cotton shirts, trim loose threads with scissors, place shirts in plastic baskets. No PLC programming, SCADA telemetry, or engineering maintenance.",
                achievements="Sewed 400 shirt collars per shift with consistent stitch line."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi Industrial Textile Vocational School",
                major="Garment Sewing",
                degree="Vocational",
                start_date="2015-09-01T00:00:00Z",
                end_date="2017-06-01T00:00:00Z"
            )
        ],
        skills=["Sewing Machine Operation", "Stitching", "Thread Trimming", "Garment Assembly"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV09: Project vs Professional Experience (Only uni student Robocon robot project)
    cands["CV09"] = make_candidate(
        candidate_name="Bùi Tuấn Kiệt",
        desired_title="Mechatronics Graduate",
        professional_summary="Recent graduate who built university autonomous student contest robots for national Robocon competitions.",
        work_experiences=[],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Mechatronics",
                degree="Bachelor",
                start_date="2020-09-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z"
            )
        ],
        projects=[
            make_proj(
                project_name="National Robocon Contest Robot",
                project_role="Programming Lead",
                description="Built battery-powered mobile robot with Arduino and basic PLC logic to pick up balls in student arena.",
                technologies=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
                start_date="2023-08-01T00:00:00Z",
                end_date="2023-12-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV10: Internship Trap (Repeated meter reading internships)
    cands["CV10"] = make_candidate(
        candidate_name="Lâm Văn Quyết",
        desired_title="Maintenance Intern",
        professional_summary="Candidate with multiple short factory gauge-reading and meter-logging internships totaling 3.5 years part-time.",
        work_experiences=[
            make_exp(
                company_name="Siam Cement Group Vietnam",
                position_title="Gauge Reading Intern",
                start_date="2021-01-01T00:00:00Z",
                end_date="2022-06-01T00:00:00Z",
                description="Walk through boiler room and copy dial numbers onto paper clipboard."
            ),
            make_exp(
                company_name="Viglacera Ceramic",
                position_title="Kiln Observation Intern",
                start_date="2022-07-01T00:00:00Z",
                end_date="2024-06-01T00:00:00Z",
                description="Check temperature display panel on tile baking kiln once per hour."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industry",
                major="Automation Engineering",
                degree="Bachelor",
                start_date="2019-09-01T00:00:00Z",
                end_date="2023-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV11: Freelance Trap (5 years freelance factory automation systems integrator)
    cands["CV11"] = make_candidate(
        candidate_name="Đoàn Quốc Bảo",
        desired_title="Senior Freelance Automation Consultant",
        professional_summary="Independent Automation Systems Integrator with 5.5 years commissioning PLC lines, SCADA telemetry, Lean Manufacturing, and Preventive Maintenance for food and auto plants.",
        work_experiences=[
            make_exp(
                company_name="Bao Automation Engineering Services",
                position_title="Principal Automation Consultant",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Contracted by industrial factories to program Allen-Bradley and Siemens PLC networks, integrate SCADA interfaces, train operators in Lean Manufacturing and Six Sigma, and formulate Preventive Maintenance protocols.",
                achievements="Commissioned 22 industrial automation production cells across Vietnam."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Automation Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[{"certificate_name": "Six Sigma Black Belt", "issuing_organization": "ASQ"}],
        languages=[{"language": "English", "proficiency": "TOEIC 780"}]
    )

    # CV12: Overlapping Dates (2.2 calendar years claiming 5.0 years)
    cands["CV12"] = make_candidate(
        candidate_name="Ngô Văn Trọng",
        desired_title="Automation Engineer",
        professional_summary="Engineer holding concurrent factory maintenance positions.",
        work_experiences=[
            make_exp(
                company_name="Sumitomo Bakelite",
                position_title="Maintenance Engineer",
                start_date="2021-08-01T00:00:00Z",
                end_date="2024-01-01T00:00:00Z",
                description="Maintain PLC equipment and SCADA systems."
            ),
            make_exp(
                company_name="Hoya Glass Disk (Concurrent)",
                position_title="Automation Technician",
                start_date="2021-10-01T00:00:00Z",
                end_date="2023-12-31T00:00:00Z",
                description="Concurrent factory equipment maintenance."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industry",
                major="Electrical Engineering",
                degree="Bachelor",
                start_date="2017-09-01T00:00:00Z",
                end_date="2021-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    # CV13: Certification Equivalent Trap (Google IT Support instead of Six Sigma)
    cands["CV13"] = make_candidate(
        candidate_name="Phan Văn Huy",
        desired_title="Automation Engineer",
        professional_summary="Automation engineer with 5.5 years experience holding Google IT Support Professional certificate.",
        work_experiences=[
            make_exp(
                company_name="ABB Vietnam",
                position_title="Automation Service Engineer",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Deploy PLC industrial code, monitor SCADA networks, implement Lean Manufacturing, Six Sigma tools, and Preventive Maintenance.",
                achievements="Commissioned substation automation systems."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Electrical Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[{"certificate_name": "Google IT Support Professional Certificate", "issuing_organization": "Google"}],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV14: Certification Unrelated (TEFL English Teaching)
    cands["CV14"] = make_candidate(
        candidate_name="Trần Thế Hưng",
        desired_title="Automation Engineer",
        professional_summary="Automation engineer with 5.5 years experience holding TEFL English teaching certificate.",
        work_experiences=[
            make_exp(
                company_name="Minda Vietnam Automotive",
                position_title="Plant Automation Engineer",
                start_date="2018-11-01T00:00:00Z",
                is_current=True,
                description="Configure PLC controllers, maintain SCADA views, implement Lean Manufacturing and Six Sigma, and conduct Preventive Maintenance.",
                achievements="Upgraded wiring on 5 injection molding cells."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Control and Automation",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[{"certificate_name": "TEFL Teaching English Certificate", "issuing_organization": "TEFL Academy"}],
        languages=[{"language": "English", "proficiency": "TOEIC 740"}]
    )

    # CV15: Language Threshold Trap (TOEIC 500 vs required 700)
    cands["CV15"] = make_candidate(
        candidate_name="Lê Minh Trí",
        desired_title="Automation Engineer",
        professional_summary="Automation engineer with 5.5 years experience, TOEIC 500 English score.",
        work_experiences=[
            make_exp(
                company_name="Posco Yamato Steel",
                position_title="Automation Technician",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Responsible for PLC programming, SCADA monitoring, Lean Manufacturing, Six Sigma inspections, and Preventive Maintenance.",
                achievements="Managed mill rolling automation."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Industry",
                major="Automation Engineering",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 500"}]
    )

    # CV16: Wrong Language Trap (Japanese JLPT N2, no English)
    cands["CV16"] = make_candidate(
        candidate_name="Đoàn Văn Nam",
        desired_title="Automation Engineer",
        professional_summary="Automation engineer with 5.5 years experience, fluent in Japanese.",
        work_experiences=[
            make_exp(
                company_name="Nidec Vietnam Corporation",
                position_title="Plant Automation Specialist",
                start_date="2018-12-01T00:00:00Z",
                is_current=True,
                description="Lead PLC programming, SCADA setups, Lean Manufacturing Kaizen, Six Sigma SPC, and Preventive Maintenance with Japanese leadership.",
                achievements="Commissioned precision motor assembly line."
            )
        ],
        educations=[
            make_edu(
                school_name="Hanoi University of Science and Technology",
                major="Mechatronics & Japanese Studies",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["PLC", "SCADA", "Lean Manufacturing", "Six Sigma", "Preventive Maintenance"],
        certificates=[],
        languages=[{"language": "Japanese", "proficiency": "JLPT N2"}]
    )

    # CV17: Semantic Similarity Trap (Mechanical Energy Buzzwords without PLC/SCADA proof)
    cands["CV17"] = make_candidate(
        candidate_name="Võ Đăng Minh",
        desired_title="Kinetic Torque Alchemist",
        professional_summary="Visionary mechanical philosopher harmonizing machine aura, rotational gear spirituality, and celestial kinetic vibration alignment.",
        work_experiences=[
            make_exp(
                company_name="Zen Machinery Guild",
                position_title="Kinetic Aura Shaman",
                start_date="2018-05-01T00:00:00Z",
                is_current=True,
                description="Feel the vibrational resonance of metal rods in meditation. Never written a line of PLC ladder logic or configured SCADA communication tags.",
                achievements="Guided mindful machine blessing ceremonies."
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
        skills=["Kinetic Meditation", "Spiritual Alignment", "Public Speaking"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 750"}]
    )

    # CV18: Missing Information (Missing dates and education)
    cands["CV18"] = make_candidate(
        candidate_name="Trần Văn Nam",
        desired_title="Automation Engineer",
        professional_summary="Automation engineer.",
        work_experiences=[
            make_exp(
                company_name="Factory",
                position_title="Automation Engineer",
                start_date="",
                description="Maintain PLC."
            )
        ],
        educations=[],
        skills=["PLC", "SCADA"],
        certificates=[],
        languages=[]
    )

    # CV19: Strong Resume / Wrong Role (Skyscraper Structural Civil Engineer)
    cands["CV19"] = make_candidate(
        candidate_name="Nguyễn Văn Lâm",
        desired_title="Chief Structural Civil Engineer",
        professional_summary="Civil Structural Engineer with 8 years calculating reinforced concrete shear walls, foundation deep pilings, and earthquake resistance for 60-story skyscrapers.",
        work_experiences=[
            make_exp(
                company_name="Hoa Binh Construction Group",
                position_title="Senior Structural Engineer",
                start_date="2016-01-01T00:00:00Z",
                is_current=True,
                description="Model structural concrete loads in ETABS, inspect steel reinforcement cages in muddy foundation pits, certify building safety. No industrial factory robotics, PLC programming, or SCADA telemetry.",
                achievements="Completed structural engineering for Landmark 81 annex tower."
            )
        ],
        educations=[
            make_edu(
                school_name="National University of Civil Engineering",
                major="Civil & Industrial Construction",
                degree="Bachelor",
                start_date="2011-09-01T00:00:00Z",
                end_date="2015-06-01T00:00:00Z"
            )
        ],
        skills=["ETABS", "Structural Concrete", "Foundation Piles", "Earthquake Resistance", "Construction Safety"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 850"}]
    )

    # CV20: Cross-Domain Near Match (Electronic PCB Solderer)
    cands["CV20"] = make_candidate(
        candidate_name="Phạm Thu Cúc",
        desired_title="PCB Assembly Line Solderer",
        professional_summary="Manual Electronics Solderer with 5.5 years holding hot copper irons to melt tin solder onto resistor pins on PCB boards.",
        work_experiences=[
            make_exp(
                company_name="Samsung Electronics Vietnam (SEVT)",
                position_title="SMD Manual Solderer",
                start_date="2018-10-01T00:00:00Z",
                is_current=True,
                description="Hold magnifying glass, touch soldering iron to circuit boards to solder lead wire pins, place completed boards on conveyor rack. Never programmed PLCs, configured SCADA systems, or managed Lean Six Sigma.",
                achievements="Soldered 500 circuit boards daily under microscope."
            )
        ],
        educations=[
            make_edu(
                school_name="Thai Nguyen University of Technology",
                major="Electronics Technology",
                degree="Bachelor",
                start_date="2014-09-01T00:00:00Z",
                end_date="2018-06-01T00:00:00Z"
            )
        ],
        skills=["Manual Soldering", "PCB Inspection", "Microscope Inspection", "Flux Cleaning"],
        certificates=[],
        languages=[{"language": "English", "proficiency": "TOEIC 710"}]
    )

    return cands


def get_expected() -> Dict[str, Dict[str, Any]]:
    return {
        "CV01": make_expected("Near Perfect Match", "PASS", [], 90.0, 100.0, "Meets all mandatory skills, 6.5 yrs experience, Six Sigma Black Belt, TOEIC 850, Engineering degree."),
        "CV02": make_expected("Strong Match", "PASS", [], 84.0, 92.0, "Meets all mandatory criteria, missing optional Six Sigma Black Belt certificate."),
        "CV03": make_expected("Mandatory Threshold Failure", "FAIL", ["SKILL"], 65.0, 80.0, "Missing mandatory Six Sigma skill."),
        "CV04": make_expected("Similar Skill Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Auto mechanic oil changer is not industrial factory PLC/SCADA automation."),
        "CV05": make_expected("Education Major Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Degree in English Linguistics fails Engineering/Mechatronics major requirement."),
        "CV06": make_expected("Higher Degree Trap", "FAIL", ["EDUCATION"], 70.0, 85.0, "Doctorate in Oriental Theology fails Engineering/Technology field requirement."),
        "CV07": make_expected("Experience Threshold Trap", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Has 1.8 years experience vs required 5.0 years."),
        "CV08": make_expected("Experience Domain Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Garment sewing machine operator lacks PLC, SCADA, and factory automation engineering."),
        "CV09": make_expected("Project vs Professional Experience", "FAIL", ["EXPERIENCE"], 35.0, 60.0, "Robocon student contest robots cannot replace 5.0 years professional plant automation."),
        "CV10": make_expected("Internship Trap", "FAIL", ["EXPERIENCE"], 45.0, 70.0, "Boiler meter reading internships do not satisfy Senior Automation Manager level."),
        "CV11": make_expected("Freelance Trap", "PASS", [], 75.0, 90.0, "Verified freelance automation integrator meets tenure, PLC/SCADA skills, and plant commissioning."),
        "CV12": make_expected("Overlapping Dates", "FAIL", ["EXPERIENCE"], 60.0, 75.0, "Non-overlapping employment duration is 2.2 years < 5.0 years required."),
        "CV13": make_expected("Certification Equivalent Trap", "PASS", [], 80.0, 90.0, "Optional cert missing does not fail mandatory, but doesn't get Six Sigma cert credit."),
        "CV14": make_expected("Certification Unrelated", "PASS", [], 80.0, 90.0, "TEFL English teaching cert does not grant engineering bonus points."),
        "CV15": make_expected("Language Threshold Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "TOEIC 500 is below mandatory threshold TOEIC 700."),
        "CV16": make_expected("Wrong Language Trap", "FAIL", ["LANGUAGE"], 70.0, 85.0, "Japanese JLPT N2 does not substitute for required English TOEIC 700."),
        "CV17": make_expected("Semantic Similarity Trap", "FAIL", ["SKILL"], 30.0, 55.0, "Torque aura buzzwords lack concrete PLC ladder logic and SCADA evidence."),
        "CV18": make_expected("Missing Information", "FAIL", ["EDUCATION", "EXPERIENCE"], 10.0, 40.0, "Missing dates and education fails multiple mandatory gates."),
        "CV19": make_expected("Strong Resume / Wrong Role", "FAIL", ["SKILL"], 30.0, 55.0, "Civil Skyscraper Engineer lacks industrial robotics, PLC, and factory SCADA systems."),
        "CV20": make_expected("Cross-Domain Near Match", "FAIL", ["SKILL"], 40.0, 65.0, "Manual PCB solderer lacks PLC ladder programming, SCADA, and Lean Six Sigma systems."),
    }
