import json
from pathlib import Path

base_dir = Path("tests/industry-wide")
with open(base_dir / "evaluations_200cv_results.json", "r", encoding="utf-8") as f:
    master_results = json.load(f)

for ind_key, ind_data in master_results.items():
    evals = ind_data["evaluations"]
    with open(base_dir / ind_key / "expected.json", "r", encoding="utf-8") as f:
        expected = json.load(f)
    for cv_id, res in evals.items():
        exp = expected[cv_id]
        exp_st = exp["expected_mandatory_status"]
        act_st = res["mandatoryStatus"]
        if exp_st != act_st:
            kind = "FALSE POSITIVE (P0)" if act_st == "PASS" else "FALSE NEGATIVE (P1)"
            pat = exp["pattern_name"]
            failures = res["mandatoryFailures"]
            score = res["overallScore"]
            print(f"[{kind}] {ind_key.upper()} - {cv_id} ({res['candidateName']})")
            print(f"  Pattern: {pat}")
            print(f"  Expected: {exp_st} | Actual: {act_st} (Score: {score})")
            print(f"  Actual Failures: {failures}")
            print(f"  Rationale: {exp['rationale']}\n")
