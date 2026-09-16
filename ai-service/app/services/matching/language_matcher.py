import re
from typing import Any, Dict, List, Optional, Tuple

from app.schemas.matching import CandidateProfilePayload, JobPayload


# Canonical language codes and their recognized names/aliases
LANGUAGE_ALIASES: Dict[str, List[str]] = {
    "en": ["english", "tiếng anh", "tieng anh", "anh văn", "anh", "eng"],
    "ja": ["japanese", "tiếng nhật", "tieng nhat", "nhật", "nhat", "japan", "jp"],
    "zh": [
        "chinese",
        "tiếng trung",
        "tieng trung",
        "tiếng hoa",
        "trung",
        "hoa",
        "mandarin",
        "cn",
    ],
    "ko": ["korean", "tiếng hàn", "tieng han", "hàn", "han", "korea", "kr"],
    "fr": ["french", "tiếng pháp", "tieng phap", "pháp", "phap", "fr"],
    "de": ["german", "tiếng đức", "tieng duc", "đức", "duc", "ger", "de"],
    "vi": ["vietnamese", "tiếng việt", "tieng viet", "việt", "viet", "vn"],
}

# CEFR level values
CEFR_LEVELS = {
    "A1": 1,
    "A2": 2,
    "B1": 3,
    "B2": 4,
    "C1": 5,
    "C2": 6,
}

# JLPT levels (N5 lowest, N1 highest)
JLPT_LEVELS = {
    "N5": 1,
    "N4": 2,
    "N3": 3,
    "N2": 4,
    "N1": 5,
}

# HSK levels (HSK1 lowest, HSK6 highest)
HSK_LEVELS = {
    "HSK 1": 1,
    "HSK 2": 2,
    "HSK 3": 3,
    "HSK 4": 4,
    "HSK 5": 5,
    "HSK 6": 6,
    "HSK1": 1,
    "HSK2": 2,
    "HSK3": 3,
    "HSK4": 4,
    "HSK5": 5,
    "HSK6": 6,
}

# TOPIK levels (1 lowest, 6 highest)
TOPIK_LEVELS = {
    "TOPIK 1": 1,
    "TOPIK 2": 2,
    "TOPIK 3": 3,
    "TOPIK 4": 4,
    "TOPIK 5": 5,
    "TOPIK 6": 6,
    "TOPIK I": 1,
    "TOPIK II": 2,
}

QUALITATIVE_LEVELS = {
    "native": 6,
    "bản ngữ": 6,
    "bilingual": 6,
    "song ngữ": 6,
    "fluent": 5,
    "thành thạo": 5,
    "proficient": 5,
    "advanced": 5,
    "cao cấp": 5,
    "good": 4,
    "khá": 4,
    "upper-intermediate": 4,
    "intermediate": 3,
    "trung cấp": 3,
    "pre-intermediate": 2,
    "sơ cấp": 2,
    "basic": 1,
    "cơ bản": 1,
    "beginner": 1,
    "elementary": 1,
}


class ParsedLanguageSpec:
    def __init__(
        self,
        lang_code: str,
        test_type: Optional[str] = None,  # IELTS, TOEIC, TOEFL, JLPT, HSK, TOPIK, CEFR, QUALITATIVE
        numeric_score: Optional[float] = None,
        tier_level: Optional[int] = None,  # 1 to 6
        raw_text: str = "",
        is_mandatory: bool = False,
    ):
        self.lang_code = lang_code
        self.test_type = test_type
        self.numeric_score = numeric_score
        self.tier_level = tier_level
        self.raw_text = raw_text
        self.is_mandatory = is_mandatory


class LanguageMatcher:
    """
    Deterministic Rule-Based Language Engine.
    Enforces:
    1. Language Identity First (NO semantic similarity crossing English and Japanese).
    2. Quantitative Scale Comparison (IELTS, TOEIC, TOEFL, JLPT, HSK, TOPIK, CEFR).
    3. Independent Score (partial credit based on achievement) vs Mandatory Gate (PASS/FAIL).
    """

    def normalize_language_code(self, text: str) -> Optional[str]:
        if not text:
            return None
        t = text.lower().strip()
        for code, aliases in LANGUAGE_ALIASES.items():
            for alias in aliases:
                if re.search(rf"\b{re.escape(alias)}\b", t):
                    return code
        return None

    def parse_language_spec(
        self, text: str, default_lang: Optional[str] = None, is_mandatory: bool = False
    ) -> Optional[ParsedLanguageSpec]:
        if not text or not text.strip():
            return None
        t = text.strip()
        t_lower = t.lower()

        lang_code = self.normalize_language_code(t_lower) or default_lang

        # 1. IELTS check
        ielts_match = re.search(r"ielts\s*(?:>=|>|:)?\s*([1-9](?:\.[05])?)", t_lower)
        if ielts_match:
            score = float(ielts_match.group(1))
            return ParsedLanguageSpec(
                lang_code=lang_code or "en",
                test_type="IELTS",
                numeric_score=score,
                tier_level=self._ielts_to_tier(score),
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 2. TOEIC check
        toeic_match = re.search(r"toeic\s*(?:>=|>|:)?\s*(\d{2,3})", t_lower)
        if toeic_match:
            score = float(toeic_match.group(1))
            return ParsedLanguageSpec(
                lang_code=lang_code or "en",
                test_type="TOEIC",
                numeric_score=score,
                tier_level=self._toeic_to_tier(score),
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 3. TOEFL check
        toefl_match = re.search(r"toefl(?:\s*ibt)?\s*(?:>=|>|:)?\s*(\d{2,3})", t_lower)
        if toefl_match:
            score = float(toefl_match.group(1))
            return ParsedLanguageSpec(
                lang_code=lang_code or "en",
                test_type="TOEFL",
                numeric_score=score,
                tier_level=self._toefl_to_tier(score),
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 4. JLPT check
        jlpt_match = re.search(r"(?:jlpt\s*)?(n[1-5])\b", t_lower)
        if jlpt_match and (lang_code == "ja" or "jlpt" in t_lower or "nhat" in t_lower or "nhật" in t_lower or not lang_code):
            level_str = jlpt_match.group(1).upper()
            return ParsedLanguageSpec(
                lang_code="ja",
                test_type="JLPT",
                tier_level=JLPT_LEVELS.get(level_str, 1),
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 5. HSK check
        hsk_match = re.search(r"hsk\s*([1-6])\b", t_lower)
        if hsk_match:
            lvl = int(hsk_match.group(1))
            return ParsedLanguageSpec(
                lang_code="zh",
                test_type="HSK",
                tier_level=lvl,
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 6. TOPIK check
        topik_match = re.search(r"topik\s*([1-6]|i{1,2})\b", t_lower)
        if topik_match:
            val = topik_match.group(1).upper()
            tier = TOPIK_LEVELS.get(f"TOPIK {val}", 1)
            return ParsedLanguageSpec(
                lang_code="ko",
                test_type="TOPIK",
                tier_level=tier,
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 7. CEFR check (C2, C1, B2, B1, A2, A1)
        cefr_match = re.search(r"\b(c2|c1|b2|b1|a2|a1)\b", t_lower)
        if cefr_match and (lang_code or any(k in t_lower for k in ["tiếng", "level", "trình độ", "cefr"])):
            lvl_str = cefr_match.group(1).upper()
            return ParsedLanguageSpec(
                lang_code=lang_code or "en",
                test_type="CEFR",
                tier_level=CEFR_LEVELS.get(lvl_str, 1),
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        # 8. Qualitative levels
        for kw, tier in QUALITATIVE_LEVELS.items():
            if kw in t_lower:
                return ParsedLanguageSpec(
                    lang_code=lang_code or "en",
                    test_type="QUALITATIVE",
                    tier_level=tier,
                    raw_text=t,
                    is_mandatory=is_mandatory,
                )

        # If language recognized but no specific test level
        if lang_code:
            return ParsedLanguageSpec(
                lang_code=lang_code,
                test_type="UNSPECIFIED",
                tier_level=3,  # default intermediate credit
                raw_text=t,
                is_mandatory=is_mandatory,
            )

        return None

    def _ielts_to_tier(self, score: float) -> int:
        if score >= 8.0:
            return 6  # C2
        if score >= 7.0:
            return 5  # C1
        if score >= 5.5:
            return 4  # B2
        if score >= 4.0:
            return 3  # B1
        if score >= 3.0:
            return 2  # A2
        return 1

    def _toeic_to_tier(self, score: float) -> int:
        if score >= 945:
            return 5  # C1
        if score >= 785:
            return 4  # B2
        if score >= 550:
            return 3  # B1
        if score >= 225:
            return 2  # A2
        return 1

    def _toefl_to_tier(self, score: float) -> int:
        if score >= 95:
            return 5  # C1
        if score >= 72:
            return 4  # B2
        if score >= 42:
            return 3  # B1
        return 2

    def extract_job_language_requirements(
        self, job: JobPayload
    ) -> List[ParsedLanguageSpec]:
        specs: List[ParsedLanguageSpec] = []
        seen_langs = set()

        # 1. From explicit required_languages in job
        for r_lang in getattr(job, "required_languages", []) or []:
            spec = self.parse_language_spec(
                f"{r_lang.language} {r_lang.proficiency or ''}",
                default_lang=self.normalize_language_code(r_lang.language),
                is_mandatory=r_lang.is_mandatory,
            )
            if spec:
                specs.append(spec)
                seen_langs.add(spec.lang_code)

        # 2. From required_certificates (e.g. "IELTS 6.5", "JLPT N2", "TOEIC 750")
        for cert in getattr(job, "required_certificates", []) or []:
            spec = self.parse_language_spec(
                cert.certificate_name,
                is_mandatory=getattr(cert, "is_mandatory", True),
            )
            if spec and spec.test_type != "UNSPECIFIED":
                if spec.lang_code not in seen_langs:
                    specs.append(spec)
                    seen_langs.add(spec.lang_code)

        # 3. From job.requirements text scanning for explicit patterns
        req_text = f"{job.requirements or ''} {job.description or ''}"
        if req_text:
            lines = re.split(r"[\n;•\*\-]", req_text)
            for line in lines:
                line_clean = line.strip()
                if not line_clean or len(line_clean) > 120:
                    continue
                line_lower = line_clean.lower()
                is_mand = any(
                    k in line_lower
                    for k in ["bắt buộc", "yêu cầu", "mandatory", "required", "phải có"]
                )
                spec = self.parse_language_spec(line_clean, is_mandatory=is_mand)
                if spec and spec.test_type not in (None, "UNSPECIFIED"):
                    if spec.lang_code not in seen_langs:
                        specs.append(spec)
                        seen_langs.add(spec.lang_code)

        return specs

    def extract_candidate_languages(
        self, cand_profile: CandidateProfilePayload
    ) -> List[ParsedLanguageSpec]:
        specs: List[ParsedLanguageSpec] = []

        # 1. From cand_profile.languages
        for c_lang in getattr(cand_profile, "languages", []) or []:
            spec = self.parse_language_spec(
                f"{c_lang.language} {c_lang.proficiency or ''}",
                default_lang=self.normalize_language_code(c_lang.language),
            )
            if spec:
                specs.append(spec)

        # 2. From cand_profile.certificates
        for cert in getattr(cand_profile, "certificates", []) or []:
            spec = self.parse_language_spec(cert.certificate_name)
            if spec and spec.test_type != "UNSPECIFIED":
                specs.append(spec)

        return specs

    def evaluate_language_match(
        self,
        job_req: ParsedLanguageSpec,
        cand_specs: List[ParsedLanguageSpec],
    ) -> Tuple[float, bool, str, Optional[str]]:
        """
        Evaluates candidate against a specific job language requirement.
        Returns: (score [0.0 - 1.0], is_passed [bool], status_str, candidate_value_str)
        """
        # Filter candidate specs to MATCH THE SAME LANGUAGE IDENTITY
        matched_cand_specs = [
            c for c in cand_specs if c.lang_code == job_req.lang_code
        ]

        if not matched_cand_specs:
            # Language IDENTITY mismatch: Candidate does not have this language at all!
            return (
                0.0,
                False,
                "MISSING",
                None,
            )

        best_score = 0.0
        best_passed = False
        best_status = "FAIL"
        best_cand_val = None

        for cand in matched_cand_specs:
            cand_val_str = cand.raw_text

            # Same specific test type (e.g. IELTS vs IELTS)
            if job_req.test_type == "IELTS" and cand.test_type == "IELTS":
                req_score = job_req.numeric_score or 6.0
                cand_score = cand.numeric_score or 0.0
                cand_val_str = f"IELTS {cand_score:.1f}"

                if cand_score >= req_score:
                    score = 1.0
                    passed = True
                    status = "PASS"
                else:
                    score = max(0.2, min(0.95, cand_score / req_score))
                    passed = False
                    status = "FAIL"

            elif job_req.test_type == "TOEIC" and cand.test_type == "TOEIC":
                req_score = job_req.numeric_score or 600.0
                cand_score = cand.numeric_score or 0.0
                cand_val_str = f"TOEIC {int(cand_score)}"

                if cand_score >= req_score:
                    score = 1.0
                    passed = True
                    status = "PASS"
                else:
                    score = max(0.2, min(0.95, cand_score / req_score))
                    passed = False
                    status = "FAIL"

            elif job_req.test_type == "JLPT" and cand.test_type == "JLPT":
                req_tier = job_req.tier_level or 4
                cand_tier = cand.tier_level or 0
                # Tier: N5=1, N4=2, N3=3, N2=4, N1=5. Higher tier is better!
                cand_val_str = f"JLPT N{6 - cand_tier if 1 <= cand_tier <= 5 else '?'}"

                if cand_tier >= req_tier:
                    score = 1.0
                    passed = True
                    status = "PASS"
                else:
                    score = max(0.2, min(0.85, cand_tier / float(req_tier)))
                    passed = False
                    status = "FAIL"

            elif job_req.test_type == "HSK" and cand.test_type == "HSK":
                req_tier = job_req.tier_level or 3
                cand_tier = cand.tier_level or 0
                cand_val_str = f"HSK {cand_tier}"

                if cand_tier >= req_tier:
                    score = 1.0
                    passed = True
                    status = "PASS"
                else:
                    score = max(0.2, min(0.85, cand_tier / float(req_tier)))
                    passed = False
                    status = "FAIL"

            else:
                # Compare by standardized tier level (1 to 6)
                req_tier = job_req.tier_level or 3
                cand_tier = cand.tier_level or 3

                if cand_tier >= req_tier:
                    score = 1.0
                    passed = True
                    status = "PASS"
                else:
                    ratio = cand_tier / float(req_tier)
                    score = max(0.2, min(0.85, ratio))
                    passed = False
                    status = "FAIL"

            if score > best_score:
                best_score = score
                best_passed = passed
                best_status = status
                best_cand_val = cand_val_str

        return best_score, best_passed, best_status, best_cand_val

    def match(
        self, cand_profile: CandidateProfilePayload, job: JobPayload
    ) -> Dict[str, Any]:
        job_reqs = self.extract_job_language_requirements(job)
        cand_specs = self.extract_candidate_languages(cand_profile)

        if not job_reqs:
            # Job does not require any specific language
            return {
                "score": 1.0,
                "has_requirements": False,
                "mandatory_passed": True,
                "failures": [],
                "evaluations": [],
            }

        scores = []
        failures = []
        evaluations = []
        all_mand_passed = True

        for req in job_reqs:
            score, passed, status, cand_val = self.evaluate_language_match(
                req, cand_specs
            )
            scores.append(score)

            eval_item = {
                "language": req.lang_code,
                "requirement": req.raw_text,
                "candidate_value": cand_val,
                "status": status,
                "score": score,
                "is_mandatory": req.is_mandatory,
            }
            evaluations.append(eval_item)

            if req.is_mandatory and not passed:
                all_mand_passed = False
                failures.append(
                    {
                        "type": "LANGUAGE",
                        "requirement": req.raw_text,
                        "candidateValue": cand_val or "Không có / Chưa đạt",
                        "status": "FAIL",
                        "reason": f"Yêu cầu ngoại ngữ bắt buộc '{req.raw_text}' chưa được thỏa mãn (Giá trị ứng viên: {cand_val or 'Thiếu'}).",
                    }
                )

        avg_score = sum(scores) / len(scores) if scores else 1.0
        return {
            "score": avg_score,
            "has_requirements": True,
            "mandatory_passed": all_mand_passed,
            "failures": failures,
            "evaluations": evaluations,
        }


language_matcher = LanguageMatcher()
