import json
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.services.matching.generic_matcher import generic_matching_engine
from app.schemas.matching import CandidateProfilePayload, JobPayload

with open("tests/industry-wide/accounting/jd.json", encoding="utf-8") as f:
    jd_dict = json.load(f)
with open("tests/industry-wide/accounting/candidates/CV03.json", encoding="utf-8") as f:
    cand_dict = json.load(f)
    
job = JobPayload(**jd_dict)
cand = CandidateProfilePayload(**cand_dict)

print("Candidate Skills:", [s.skill_name for s in cand.skills])
print("Candidate Exps:", len(cand.work_experiences))
for exp in cand.work_experiences:
    print("Exp:", exp.position_title, exp.description)

for req in job.required_skills:
    cand_years = generic_matching_engine._calculate_skill_years(req.skill_name, cand)
    print(f"Req: {req.skill_name}, is_mandatory={req.is_mandatory}, min_years={req.minimum_years}, cand_years={cand_years}")
    
res = generic_matching_engine._match_skills(cand, job)
print("Matched:", [m['name'] for m in res['matched']])
print("Missing:", res['missing'])
print("Missing mandatory:", res['missing_mandatory'])
