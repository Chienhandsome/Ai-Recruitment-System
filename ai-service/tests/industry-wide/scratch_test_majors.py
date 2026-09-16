import json
import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.services.matching.semantic import semantic_matcher

test_cases = [
    # The 5 P1s (should PASS)
    ("sales", "International Economics", "Business Administration, Marketing, International Trade, Economics"),
    ("hr", "Industrial Psychology", "Human Resource Management, Business Administration, Psychology, Law"),
    ("hr", "Psychology", "Human Resource Management, Business Administration, Psychology, Law"),
    ("design", "Multimedia", "Graphic Design, Interaction Design, Multimedia, Computer Science"),
    ("data", "Economics", "Data Science, Computer Science, Statistics, Information Systems, Mathematics, Economics"),
    # The 5 Trap CVs (should FAIL)
    ("marketing", "Classical Vietnamese Literature", "Marketing, Communications, Business Administration, Media"),
    ("hr", "Theoretical Astrophysics", "Human Resource Management, Business Administration, Psychology, Law"),
    ("data", "Archaeology & Ancient Civilizations", "Data Science, Computer Science, Statistics, Information Systems, Mathematics, Economics"),
    ("data", "Agronomy & Crop Science", "Data Science, Computer Science, Statistics, Information Systems, Mathematics, Economics"),
    ("hospitality", "Metallurgical Material Science", "Hospitality Management, Tourism, Hotel Administration, Foreign Languages, Business Administration")
]

for ind, cand_major, jd_edu in test_cases:
    # 1. Direct keyword match
    kw_match = any(m.strip().lower() in cand_major.lower() or cand_major.lower() in m.strip().lower() for m in jd_edu.split(","))
    # 2. Semantic match against allowed majors
    sim = max(semantic_matcher.compute_similarity(cand_major, m.strip()) for m in jd_edu.split(","))
    print(f"[{ind.upper()}] Major: '{cand_major}' | kw_match={kw_match} | max_sim_to_allowed={sim:.3f}")
