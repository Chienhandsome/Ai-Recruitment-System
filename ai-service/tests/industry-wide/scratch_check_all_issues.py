import json
from pathlib import Path

base = Path("tests/industry-wide")
with open(base / "evaluations_200cv_results.json", encoding="utf-8") as f:
    master = json.load(f)

by_sev = {"P0": [], "P1": [], "P2": []}
for ind, d in master.items():
    issues = d.get("issues", [])
    for iss in issues:
        sev = iss.get("severity")
        by_sev.setdefault(sev, []).append((ind, iss))

print(f"P0 count: {len(by_sev['P0'])}")
print(f"P1 count: {len(by_sev['P1'])}")
print(f"P2 count: {len(by_sev['P2'])}")

print("\n--- P0 ISSUES ---")
for ind, iss in by_sev["P0"]:
    print(f"{ind.upper()} {iss.get('candidateId')} ({iss.get('candidateName')}): {iss.get('requirement')} | exp={iss.get('expected')} act={iss.get('actual')}")

print("\n--- P1 ISSUES ---")
for ind, iss in by_sev["P1"]:
    print(f"{ind.upper()} {iss.get('candidateId')} ({iss.get('candidateName')}): {iss.get('requirement')} | exp={iss.get('expected')} act={iss.get('actual')}")
