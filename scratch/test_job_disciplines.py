import sys
sys.path.insert(0, '.')
import json
from app.schemas.matching import JobPayload, CandidateProfilePayload
from app.services.matching.generic_matcher import GenericMatchingEngine
generic_matcher = GenericMatchingEngine()

with open('d:/DATN/Ai-Recruitment-System-Test-Deploy/scratch/audit_25_apps.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    idx = item['index']
    cand = item['candidate']
    job_data = item['job']
    edus = cand['educations']
    
    # We can check with real requirements from job
    job_payload = JobPayload(
        id=job_data.get('id', 'test'),
        title=job_data['title'],
        requirements='',
        description='',
    )
    jf, discs = generic_matcher._detect_job_disciplines(job_payload)
    majors = [e.get('major') for e in edus if e.get('major')]
    major_discs = [generic_matcher._detect_major_discipline(m) for m in majors]
    
    print(f"[{idx:02d}] Job: '{job_data['title']}' -> jf: '{jf}', disciplines: {discs}")
    print(f"     Candidate Major: {majors} -> major_disciplines: {major_discs}")
    print("-" * 60)
