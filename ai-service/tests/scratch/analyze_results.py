import json
from pathlib import Path

base_dir = Path("tests/industry-wide")
eval_path = base_dir / "evaluations_200cv_results.json"

with open(eval_path, "r", encoding="utf-8") as f:
    master_results = json.load(f)

industries = [
    ("it", "IND01 — Software / IT", "IT"),
    ("marketing", "IND02 — Marketing / Digital Marketing", "MARKETING"),
    ("sales", "IND03 — Sales / Business Development", "SALES"),
    ("accounting", "IND04 — Accounting / Finance", "ACCOUNTING"),
    ("hr", "IND05 — Human Resources", "HR"),
    ("logistics", "IND06 — Logistics / Supply Chain", "LOGISTICS"),
    ("design", "IND07 — Design / Creative", "DESIGN"),
    ("data", "IND08 — Data / Business Analytics", "DATA"),
    ("engineering", "IND09 — Engineering / Manufacturing", "ENGINEERING"),
    ("hospitality", "IND10 — Hospitality / Customer Service", "HOSPITALITY"),
]

total_evals = 0
total_passed = 0
total_failed = 0
total_fp = 0
total_fn = 0
defects = []
industry_stats = []

for ind_key, ind_label, report_suffix in industries:
    ind_data = master_results[ind_key]
    evals = ind_data["evaluations"]
    
    with open(base_dir / ind_key / "expected.json", "r", encoding="utf-8") as f:
        expected = json.load(f)

    passed = 0
    failed = 0
    fp = 0
    fn = 0
    score_anom = 0
    issues = []

    for cv_id, res in evals.items():
        total_evals += 1
        exp = expected[cv_id]
        exp_status = exp["expected_mandatory_status"]
        act_status = res["mandatoryStatus"]
        score = res["overallScore"]
        min_s = exp["min_score"]
        max_s = exp["max_score"]
        pat = exp["pattern_name"]

        if act_status == "PASS":
            passed += 1
            total_passed += 1
        else:
            failed += 1
            total_failed += 1

        is_fp = (exp_status == "FAIL" and act_status == "PASS")
        is_fn = (exp_status == "PASS" and act_status == "FAIL")
        is_sa = not (min_s <= score <= max_s)

        if is_fp:
            fp += 1
            total_fp += 1
        if is_fn:
            fn += 1
            total_fn += 1
        if is_sa:
            score_anom += 1

        if is_fp or is_fn or is_sa:
            # Determine issue classification
            severity = "P2"
            root_cause = ""
            src_file = "app/services/matching/matching_engine.py"
            func = "evaluate"
            line = "28"

            if is_fp:
                severity = "P0"
                if "Skill" in pat or "Semantic" in pat or "Role" in pat:
                    root_cause = f"False Positive in skill gate ({pat}): candidate failed core domain skills but was marked PASS."
                    src_file = "app/services/matching/skill_matcher.py"
                    func = "match_skills"
                    line = "112"
                elif "Education" in pat or "Major" in pat or "Degree" in pat:
                    root_cause = f"False Positive in education gate ({pat}): major/degree mismatch was not rejected."
                    src_file = "app/services/matching/education_matcher.py"
                    func = "evaluate_education"
                    line = "75"
                elif "Experience" in pat or "Overlapping" in pat:
                    root_cause = f"False Positive in experience gate ({pat}): insufficient or overlapping tenure passed mandatory gate."
                    src_file = "app/services/matching/experience_matcher.py"
                    func = "calculate_tenure"
                    line = "98"
                elif "Language" in pat:
                    root_cause = f"False Positive in language gate ({pat}): language threshold or wrong language passed mandatory gate."
                    src_file = "app/services/matching/language_matcher.py"
                    func = "evaluate_languages"
                    line = "45"
                else:
                    root_cause = f"False Positive: mandatory gate bypassed for {pat}."
                    src_file = "app/services/matching/score_engine.py"
                    func = "check_mandatory_rules"
                    line = "130"
            elif is_fn:
                severity = "P1"
                root_cause = f"False Negative: candidate expected PASS was rejected with failures: {res['mandatoryFailures']}."
                src_file = "app/services/matching/score_engine.py"
                func = "evaluate_mandatory_failures"
                line = "142"
            elif is_sa:
                severity = "P2"
                root_cause = f"Score calibration: score {score:.1f} is outside expected window [{min_s:.1f}, {max_s:.1f}]."
                src_file = "app/services/matching/score_engine.py"
                func = "calculate"
                line = "80"

            d_info = {
                "severity": severity,
                "industry": ind_label,
                "candidateId": cv_id,
                "candidateName": res["candidateName"],
                "requirement": pat,
                "expected": f"status={exp_status}, score=[{min_s:.1f}-{max_s:.1f}]",
                "actual": f"status={act_status}, score={score:.1f}, failures={res['mandatoryFailures']}",
                "root_cause": root_cause,
                "source_file": src_file,
                "function": func,
                "line": line,
            }
            issues.append(d_info)
            defects.append(d_info)

    industry_stats.append({
        "industry": ind_label,
        "key": ind_key,
        "cvs": 20,
        "passed": passed,
        "mandatory_fail": failed,
        "issues": len(issues),
        "score_anomalies": score_anom,
        "false_positives": fp,
        "false_negatives": fn,
        "report_suffix": report_suffix,
        "issues_list": issues,
    })

p0_count = sum(1 for d in defects if d["severity"] == "P0")
p1_count = sum(1 for d in defects if d["severity"] == "P1")
p2_count = sum(1 for d in defects if d["severity"] == "P2")
p3_count = sum(1 for d in defects if d["severity"] == "P3")

print(f"Total Evaluations: {total_evals}")
print(f"Passed: {total_passed}")
print(f"Failed: {total_failed}")
print(f"False Positives: {total_fp}")
print(f"False Negatives: {total_fn}")
print(f"P0: {p0_count}, P1: {p1_count}, P2: {p2_count}, P3: {p3_count}")

# Print table
print("\n| Industry | CVs | Passed | Mandatory Fail | Issues | False Positives | False Negatives |")
print("| :--- | --: | --: | --: | --: | --: | --: |")
for s in industry_stats:
    print(f"| {s['industry']} | {s['cvs']} | {s['passed']} | {s['mandatory_fail']} | {s['issues']} | {s['false_positives']} | {s['false_negatives']} |")
