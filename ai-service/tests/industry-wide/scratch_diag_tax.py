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

res = generic_matching_engine._match_skills(cand, job)
for m in res['matched']:
    if m['name'] == 'Tax Accounting':
        print("Tax Accounting match info:", m)
