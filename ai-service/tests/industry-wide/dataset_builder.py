import os
import sys
import json
from pathlib import Path

# Add current directory so 'generators' can be imported cleanly
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from generators import (
    it,
    marketing,
    sales,
    accounting,
    hr,
    logistics,
    design,
    data,
    engineering,
    hospitality,
)

MODULES = {
    "it": it,
    "marketing": marketing,
    "sales": sales,
    "accounting": accounting,
    "hr": hr,
    "logistics": logistics,
    "design": design,
    "data": data,
    "engineering": engineering,
    "hospitality": hospitality,
}


def build_all_datasets(base_dir: Path):
    print(f"Building Industry-Wide ATS Datasets in: {base_dir}")
    total_jds = 0
    total_cvs = 0
    total_expected = 0

    for ind_key, mod in MODULES.items():
        ind_dir = base_dir / ind_key
        cands_dir = ind_dir / "candidates"
        ind_dir.mkdir(parents=True, exist_ok=True)
        cands_dir.mkdir(parents=True, exist_ok=True)

        # 1. JD
        jd_data = mod.get_jd()
        with open(ind_dir / "jd.json", "w", encoding="utf-8") as f:
            json.dump(jd_data, f, ensure_ascii=False, indent=2)
        total_jds += 1

        # 2. Expected
        expected_data = mod.get_expected()
        with open(ind_dir / "expected.json", "w", encoding="utf-8") as f:
            json.dump(expected_data, f, ensure_ascii=False, indent=2)
        total_expected += 1

        # 3. Candidates (CV01 - CV20)
        cands_data = mod.get_candidates()
        for cv_id, cand in cands_data.items():
            filename = f"{cv_id.lower()}.json"
            with open(cands_dir / filename, "w", encoding="utf-8") as f:
                json.dump(cand, f, ensure_ascii=False, indent=2)
            total_cvs += 1

        print(f"  [OK] {ind_key.upper()}: 1 JD, {len(cands_data)} CVs, expected.json")

    print(f"\nCompleted! Generated {total_jds} JDs, {total_cvs} CVs across {len(MODULES)} industries.")
    assert total_jds == 10, f"Expected 10 JDs, got {total_jds}"
    assert total_cvs == 200, f"Expected 200 CVs, got {total_cvs}"
    assert total_expected == 10, f"Expected 10 Expected files, got {total_expected}"


if __name__ == "__main__":
    base_path = Path(__file__).resolve().parent
    build_all_datasets(base_path)
