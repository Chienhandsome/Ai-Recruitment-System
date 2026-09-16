import json
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.services.matching.generic_matcher import generic_matching_engine
from app.schemas.matching import CandidateProfilePayload, JobPayload

for ind, cid, missing_skill in [('data', 'CV03', 'Python'), ('engineering', 'CV03', 'Six Sigma')]:
    with open(f"tests/industry-wide/{ind}/jd.json", encoding="utf-8") as f:
        jd_dict = json.load(f)
    with open(f"tests/industry-wide/{ind}/candidates/{cid}.json", encoding="utf-8") as f:
        cand_dict = json.load(f)
        
    job = JobPayload(**jd_dict)
    cand = CandidateProfilePayload(**cand_dict)

    res = generic_matching_engine._match_skills(cand, job)
    for m in res['matched']:
        if m['name'] == missing_skill:
            print(f"{ind.upper()} {cid} matched {missing_skill}:", m)
    for ev in res['evidence']:
        if ev.get('skillName') == missing_skill:
            print(f"{ind.upper()} {cid} evidence for {missing_skill}:", ev)
