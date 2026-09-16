import json

with open("tests/industry-wide/evaluations_200cv_results.json", encoding="utf-8") as f:
    data = json.load(f)

p0_count = 0
p1_count = 0

print("=================== P0 & P1 ISSUES ===================")
for ind, content in data.items():
    issues = content.get("issues", [])
    for issue in issues:
        sev = issue.get("severity")
        if sev in ["P0", "P1"]:
            if sev == "P0":
                p0_count += 1
            else:
                p1_count += 1
            cid = issue.get("candidateId")
            cname = issue.get("candidateName")
            req = issue.get("requirement")
            exp = issue.get("expected")
            act = issue.get("actual")
            rc = issue.get("root_cause")
            print(f"[{sev}] {ind.upper()} {cid} ({cname}): {req}")
            print(f"    Expected: {exp} | Actual: {act}")
            print(f"    Root Cause: {rc}")

print(f"\nTotal P0: {p0_count}, Total P1: {p1_count}")
