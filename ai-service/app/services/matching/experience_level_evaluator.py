"""Deterministic candidate experience-level assessment."""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Iterable, Optional

from app.schemas.matching import WorkExperience

LEVELS = (
    "INTERN",
    "FRESHER",
    "JUNIOR",
    "MIDDLE",
    "SENIOR",
    "LEAD",
    "MANAGER",
    "DIRECTOR",
)
LEVEL_RANK = {level: rank for rank, level in enumerate(LEVELS)}

TITLE_PATTERNS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("DIRECTOR", (r"\bdirector\b", r"\bhead of\b", r"giám đốc", r"trưởng phòng")),
    ("MANAGER", (r"\bmanager\b", r"engineering manager", r"quản lý")),
    ("LEAD", (r"\bteam lead\b", r"\btech lead\b", r"technical lead", r"trưởng nhóm")),
    ("SENIOR", (r"\bsenior\b", r"\bsr\.?\b", r"\bstaff\b", r"\bprincipal\b")),
    ("MIDDLE", (r"\bmiddle\b", r"\bmid[- ]level\b", r"\bintermediate\b")),
    ("JUNIOR", (r"\bjunior\b", r"\bjr\.?\b", r"\bentry[- ]level\b")),
    ("FRESHER", (r"\bfresher\b", r"\bnew graduate\b", r"mới tốt nghiệp")),
    ("INTERN", (r"\bintern\b", r"\binternship\b", r"thực tập", r"thực tập sinh")),
)

LEADERSHIP_PATTERNS = (
    r"dẫn dắt",
    r"trưởng nhóm",
    r"\bmentor(?:ed|ing)?\b",
    r"\bcoach(?:ed|ing)?\b",
    r"\bteam lead\b",
    r"\btech lead\b",
    r"phân công",
    r"code review",
)
MANAGEMENT_PATTERNS = (
    r"quản lý đội",
    r"quản lý nhân sự",
    r"đánh giá hiệu suất",
    r"\bmanag(?:e|ed|ing)\b.{0,30}\bteam",
    r"\bpeople management\b",
    r"\bline manager\b",
    r"\bdirect reports?\b",
    r"\bperformance review\b",
    r"\bheadcount\b",
    r"\bbudget\b",
    r"ngân sách",
    r"\bhiring\b",
    r"tuyển dụng",
    r"\broadmap\b",
)


class ExperienceLevelEvaluator:
    """Infer a conservative level from dates, titles, and role evidence."""

    def evaluate(
        self,
        work_experiences: list[WorkExperience],
        required_level: str,
        requirement_mode: str = "ADVISORY",
        reference_date: Optional[str] = None,
    ) -> dict[str, Any]:
        required = required_level if required_level in LEVEL_RANK else "JUNIOR"
        mode = (
            requirement_mode
            if requirement_mode in {"ADVISORY", "REQUIRED"}
            else "ADVISORY"
        )
        reference = self._parse_reference_date(reference_date)
        total_years, valid_intervals = self._calculate_total_years(
            work_experiences, reference
        )

        if not work_experiences:
            return self._unknown_result(required, mode, total_years)

        recent_experience = self._most_recent_experience(work_experiences, reference)
        recent_title = (recent_experience.position_title or "").strip()
        title_level = self._title_level(recent_title)
        baseline_level = self._years_baseline(total_years)
        all_role_text = " ".join(
            filter(
                None,
                (
                    f"{experience.description or ''} {experience.achievements or ''}"
                    for experience in work_experiences
                ),
            )
        ).casefold()
        has_leadership_evidence = self._contains_any(all_role_text, LEADERSHIP_PATTERNS)
        has_management_evidence = self._contains_any(all_role_text, MANAGEMENT_PATTERNS)

        candidate_level, reason_codes = self._resolve_level(
            baseline_level=baseline_level,
            title_level=title_level,
            total_years=total_years,
            has_leadership_evidence=has_leadership_evidence,
            has_management_evidence=has_management_evidence,
        )
        confidence = self._confidence(
            valid_intervals=valid_intervals,
            title_level=title_level,
            baseline_level=baseline_level,
            candidate_level=candidate_level,
        )

        evidence = [f"{total_years:.2f} năm kinh nghiệm không trùng thời gian"]
        if recent_title:
            evidence.append(f"Chức danh gần nhất: {recent_title}")
        if has_management_evidence:
            evidence.append("Có bằng chứng quản lý hoặc chịu trách nhiệm đội ngũ")
        elif has_leadership_evidence:
            evidence.append("Có bằng chứng dẫn dắt hoặc mentoring")
        elif title_level in {"LEAD", "MANAGER", "DIRECTOR"}:
            evidence.append("Chưa đủ bằng chứng trách nhiệm quản lý trong mô tả")

        if confidence < 0.5:
            gap = None
            level_fit_score = None
            eligible = None
            recommendation = "NEEDS_REVIEW"
            candidate_level = None
            reason_codes.append("INSUFFICIENT_DATA")
        else:
            gap = LEVEL_RANK[required] - LEVEL_RANK[candidate_level]
            level_fit_score = self._fit_score(gap)
            eligible = gap <= 0
            recommendation = self._recommendation(mode, eligible)

        return {
            "candidate_level": candidate_level,
            "required_level": required,
            "total_experience_years": round(total_years, 2),
            "level_fit_score": level_fit_score,
            "level_gap": gap,
            "level_eligible": eligible,
            "level_confidence": confidence,
            "level_requirement_mode": mode,
            "recommendation": recommendation,
            "evidence": evidence,
            "reason_codes": reason_codes,
        }

    def _unknown_result(
        self, required_level: str, requirement_mode: str, total_years: float
    ) -> dict[str, Any]:
        return {
            "candidate_level": None,
            "required_level": required_level,
            "total_experience_years": round(total_years, 2),
            "level_fit_score": None,
            "level_gap": None,
            "level_eligible": None,
            "level_confidence": 0.3,
            "level_requirement_mode": requirement_mode,
            "recommendation": "NEEDS_REVIEW",
            "evidence": ["Không có kinh nghiệm làm việc để xác định level"],
            "reason_codes": ["INSUFFICIENT_DATA"],
        }

    def _resolve_level(
        self,
        *,
        baseline_level: str,
        title_level: Optional[str],
        total_years: float,
        has_leadership_evidence: bool,
        has_management_evidence: bool,
    ) -> tuple[str, list[str]]:
        reasons = ["YEARS_BASELINE"]
        candidate_level = baseline_level

        if title_level:
            reasons.append("RECENT_TITLE_SIGNAL")
            if title_level == "INTERN" and total_years < 1.0:
                candidate_level = "INTERN"
            elif title_level == "FRESHER" and total_years < 2.0:
                candidate_level = "FRESHER"
            elif LEVEL_RANK[title_level] <= LEVEL_RANK["SENIOR"]:
                candidate_level = min(
                    (baseline_level, title_level), key=lambda item: LEVEL_RANK[item]
                )
                if baseline_level != title_level:
                    reasons.append("TITLE_YEARS_CONFLICT")

        if title_level == "LEAD":
            if total_years >= 6.0 and has_leadership_evidence:
                candidate_level = "LEAD"
                reasons.append("LEADERSHIP_EVIDENCE")
            else:
                candidate_level = "SENIOR"
                reasons.append("INSUFFICIENT_MANAGEMENT_EVIDENCE")
        elif title_level == "MANAGER":
            if total_years >= 5.0 and has_management_evidence:
                candidate_level = "MANAGER"
                reasons.append("MANAGEMENT_EVIDENCE")
            else:
                candidate_level = "SENIOR"
                reasons.append("INSUFFICIENT_MANAGEMENT_EVIDENCE")
        elif title_level == "DIRECTOR":
            if total_years >= 8.0 and has_management_evidence:
                candidate_level = "DIRECTOR"
                reasons.append("MANAGEMENT_EVIDENCE")
            else:
                candidate_level = "SENIOR"
                reasons.append("INSUFFICIENT_MANAGEMENT_EVIDENCE")

        return candidate_level, list(dict.fromkeys(reasons))

    @staticmethod
    def _years_baseline(total_years: float) -> str:
        if total_years < 1.0:
            return "FRESHER"
        if total_years < 2.0:
            return "JUNIOR"
        if total_years < 4.0:
            return "MIDDLE"
        return "SENIOR"

    @staticmethod
    def _fit_score(gap: int) -> float:
        if gap <= 0:
            return 100.0
        if gap == 1:
            return 70.0
        if gap == 2:
            return 35.0
        return 0.0

    @staticmethod
    def _recommendation(mode: str, eligible: bool) -> str:
        if eligible:
            return "ELIGIBLE"
        if mode == "REQUIRED":
            return "NOT_ELIGIBLE_LEVEL"
        return "ADVISORY_LEVEL_GAP"

    @staticmethod
    def _confidence(
        *,
        valid_intervals: int,
        title_level: Optional[str],
        baseline_level: str,
        candidate_level: str,
    ) -> float:
        if valid_intervals > 0 and title_level:
            if title_level == baseline_level:
                return 0.95
            if title_level == candidate_level and candidate_level in {
                "LEAD",
                "MANAGER",
                "DIRECTOR",
            }:
                return 0.9
            return 0.72
        if valid_intervals > 0 or title_level:
            return 0.6
        return 0.3

    def _calculate_total_years(
        self, experiences: Iterable[WorkExperience], reference: date
    ) -> tuple[float, int]:
        intervals: list[tuple[date, date]] = []
        for experience in experiences:
            start = self._parse_date(experience.start_date)
            if start is None:
                continue
            end = (
                reference
                if experience.is_current or not experience.end_date
                else self._parse_date(experience.end_date)
            )
            if end is None:
                continue
            if start > end:
                continue
            intervals.append((start, min(end, reference)))

        if not intervals:
            return 0.0, 0

        intervals.sort(key=lambda item: item[0])
        merged: list[tuple[date, date]] = []
        for start, end in intervals:
            if not merged or start > merged[-1][1]:
                merged.append((start, end))
                continue
            previous_start, previous_end = merged[-1]
            merged[-1] = (previous_start, max(previous_end, end))

        days = sum((end - start).days for start, end in merged)
        return max(0.0, days / 365.25), len(intervals)

    def _most_recent_experience(
        self, experiences: list[WorkExperience], reference: date
    ) -> WorkExperience:
        def sort_key(experience: WorkExperience) -> date:
            if experience.is_current:
                return reference
            return (
                self._parse_date(experience.end_date)
                or self._parse_date(experience.start_date)
                or date.min
            )

        return max(experiences, key=sort_key)

    @staticmethod
    def _title_level(title: str) -> Optional[str]:
        normalized = title.casefold()
        for level, patterns in TITLE_PATTERNS:
            if any(
                re.search(pattern, normalized, flags=re.IGNORECASE)
                for pattern in patterns
            ):
                return level
        return None

    @staticmethod
    def _contains_any(text: str, patterns: Iterable[str]) -> bool:
        return any(
            re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns
        )

    @staticmethod
    def _parse_reference_date(value: Optional[str]) -> date:
        parsed = ExperienceLevelEvaluator._parse_date(value)
        return parsed or date.today()

    @staticmethod
    def _parse_date(value: Optional[str]) -> Optional[date]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
        except (TypeError, ValueError):
            try:
                return date.fromisoformat(str(value)[:10])
            except (TypeError, ValueError):
                return None


experience_level_evaluator = ExperienceLevelEvaluator()
