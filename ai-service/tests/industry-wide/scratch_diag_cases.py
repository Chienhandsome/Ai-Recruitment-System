import json
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.services.matching.generic_matcher import generic_matching_engine
from app.schemas.matching import CandidateProfilePayload, JobPayload

cases = [
    ("marketing", "CV06"),
    ("hr", "CV06"),
    ("data", "CV05"),
    ("data", "CV06"),
    ("hospitality", "CV06"),
    ("accounting", "CV03"),
    ("data", "CV03"),
    ("engineering", "CV03"),
    ("sales", "CV11"),
    ("hr", "CV02"),
    ("hr", "CV14"),
    ("design", "CV13"),
    ("data", "CV13"),
]

for ind, cid in cases:
    with open(f"tests/industry-wide/{ind}/jd.json", encoding="utf-8") as f:
        jd_dict = json.load(f)
    with open(f"tests/industry-wide/{ind}/candidates/{cid}.json", encoding="utf-8") as f:
        cand_dict = json.load(f)
        
    job = JobPayload(**jd_dict)
    cand = CandidateProfilePayload(**cand_dict)
    
    edu_res = generic_matching_engine._match_education(cand, job)
    skills_res = generic_matching_engine._match_skills(cand, job)
    
    print(f"=== {ind.upper()} {cid} ===")
    print(f"Edu: major_passed={edu_res.get('major_passed')}, degree_passed={edu_res.get('degree_passed')}, best_sim={edu_res.get('best_sim')}, best_major={edu_res.get('best_major')}")
    if edu_res.get('failures'):
        print(f"Edu Failures: {edu_res['failures']}")
    print(f"Skills: missing_mandatory={skills_res.get('missing_mandatory')}")
    if skills_res.get('mandatory_failures'):
        print(f"Skill Failures: {skills_res['mandatory_failures']}")
    print()
