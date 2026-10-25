import json

with open('scratch/audit_25_apps.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

lines = []
lines.append(f"TOTAL APPLICATIONS: {len(data)}\n")

for item in data:
    idx = item['index']
    cand = item['candidate']
    job = item['job']
    res = item['aiResult'] or {}
    edus = cand['educations']
    exps = cand['workExperiences']
    
    edu_str = "; ".join([f"{e.get('degree')} in {e.get('major')} at {e.get('school')}" for e in edus]) if edus else "None"
    exp_str = "; ".join([f"{w.get('title')} ({w.get('company')})" for w in exps]) if exps else "None"
    
    lines.append(f"[{idx:02d}] {cand['name']} (Desired: {cand.get('desiredTitle')})")
    lines.append(f"     Target Job: {job['title']} | ReqLevel: {job.get('level')} | ReqYears: {job.get('reqExpYears')}")
    lines.append(f"     Edu in CV: {edu_str} ==> EduScore: {res.get('educationScore')}")
    lines.append(f"     Exp in CV ({len(exps)} entries): {exp_str}")
    lines.append(f"     Exp Metrics: TotalExp={res.get('totalExpYears')}y | CandLevel={res.get('candidateExpLevel')} | LevelFit={res.get('levelFitScore')} ==> ExpScore: {res.get('experienceScore')}")
    lines.append(f"     Scores: Overall={res.get('overallScore')} | Skills={res.get('skillScore')} | Exp={res.get('experienceScore')} | Edu={res.get('educationScore')} | Project={res.get('projectScore')}")
    
    breakdown = res.get('scoreBreakdown') or {}
    lines.append(f"     Breakdown: Edu={breakdown.get('education', {})} | Exp={breakdown.get('experience', {})}")
    pillars = res.get('pillarExplanations') or {}
    p_edu = pillars.get('education') or pillars.get('hoc_van') or {}
    p_exp = pillars.get('experience') or pillars.get('kinh_nghiem') or {}
    lines.append(f"     Pillar Edu: {p_edu.get('summary', '')} | Plus: {p_edu.get('plus_reasons', [])} | Minus: {p_edu.get('minus_reasons', [])}")
    lines.append(f"     Pillar Exp: {p_exp.get('summary', '')} | Plus: {p_exp.get('plus_reasons', [])} | Minus: {p_exp.get('minus_reasons', [])}")
    lines.append("-" * 90)

with open('scratch/all_25_analysis.txt', 'w', encoding='utf-8') as out_f:
    out_f.write("\n".join(lines))

print("Wrote scratch/all_25_analysis.txt successfully.")
