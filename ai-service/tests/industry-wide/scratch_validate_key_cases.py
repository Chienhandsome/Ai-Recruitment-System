import json
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.services.matching.matching_engine import matching_engine
from app.schemas.matching import EvaluationRequest, JobPayload, CandidateProfilePayload

test_cases = [
    ("it", "CV14"),
    ("marketing", "CV06"),
    ("accounting", "CV03"),
    ("data", "CV03"),
    ("data", "CV05"),
    ("engineering", "CV03"),
    ("sales", "CV11"),
    ("hr", "CV02"),
    ("hr", "CV14"),
    ("design", "CV13"),
    ("data", "CV13"),
]

for ind, cid in test_cases:
    with open(f"tests/industry-wide/{ind}/jd.json", encoding="utf-8") as f:
        jd = json.load(f)
    with open(f"tests/industry-wide/{ind}/candidates/{cid.lower()}.json", encoding="utf-8") as f:
        cand = json.load(f)
    with open(f"tests/industry-wide/{ind}/expected.json", encoding="utf-8") as f:
        exp = json.load(f)[cid]

    req = EvaluationRequest(
        application_id=f"test-{ind}-{cid}",
        job=JobPayload(**jd),
        candidate_profile=CandidateProfilePayload(**cand),
    )
    res = matching_engine.evaluate(req)
    exp_stat = exp["expected_mandatory_status"]
    act_stat = res.mandatory_status
    score = res.overall_score
    min_s = exp["min_score"]
    max_s = exp["max_score"]
    stat_ok = (exp_stat == act_stat)
    score_ok = (min_s <= score <= max_s)
    stat_mark = "OK" if stat_ok else "FAIL"
    score_mark = "OK" if score_ok else "OUT"
    print(f"[{ind.upper()} {cid}] Stat: {act_stat} (exp {exp_stat}) [{stat_mark}] | Score: {score:.1f} (exp {min_s}-{max_s}) [{score_mark}]")
