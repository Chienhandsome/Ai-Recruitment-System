import json
import os

targets = [
    ("sales", "CV11"), ("hr", "CV02"), ("hr", "CV14"), ("design", "CV13"), ("data", "CV13"),
    ("marketing", "CV06"), ("accounting", "CV03"), ("hr", "CV06"),
    ("data", "CV03"), ("data", "CV05"), ("data", "CV06"),
    ("engineering", "CV03"), ("hospitality", "CV06")
]

for ind, cid in targets:
    print(f"================== {ind.upper()} {cid} ==================")
    # Load candidate
    cv_file = f"tests/industry-wide/{ind}/candidates/{cid}.json"
    with open(cv_file, encoding="utf-8") as cf:
        cand = json.load(cf)
        print("Candidate Name:", cand.get("full_name"))
        print("Educations:", cand.get("educations"))
        print("Experiences:", [(e.get("title"), e.get("years")) for e in cand.get("experiences", [])])
        print("Skills:", [(s.get("skill_name"), s.get("years_experience")) for s in cand.get("skills", [])])

    # Load JD
    jd_file = f"tests/industry-wide/{ind}/jd.json"
    with open(jd_file, encoding="utf-8") as jf:
        jd = json.load(jf)
        print("JD Title:", jd.get("title"))
        print("JD Requirements:", jd.get("requirements"))
        print("JD Required Skills:", [(s.get("skill_name"), s.get("minimum_years"), s.get("is_mandatory")) for s in jd.get("required_skills", [])])

    # Load Expected
    exp_file = f"tests/industry-wide/{ind}/expected.json"
    with open(exp_file, encoding="utf-8") as ef:
        exp_data = json.load(ef)
        for c in exp_data.get("candidates", []):
            if c.get("candidate_id") == cid:
                print("Expected:", c)
    print()
