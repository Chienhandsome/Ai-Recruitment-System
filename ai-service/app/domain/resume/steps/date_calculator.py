"""Deterministically calculate non-overlapping professional experience."""

from datetime import date

from app.schemas.llm_output import ResumeExtractionResult


def apply_experience_duration(result: ResumeExtractionResult) -> ResumeExtractionResult:
    intervals: list[tuple[date, date]] = []
    today = date.today()

    for experience in result.work_experiences:
        if not experience.start_date:
            continue
        start = date.fromisoformat(experience.start_date)
        end_value = today if experience.is_current else experience.end_date
        if not end_value:
            continue
        end = date.fromisoformat(end_value) if isinstance(end_value, str) else end_value
        if end < start:
            continue
        intervals.append((start, end))

    intervals.sort(key=lambda interval: interval[0])
    merged: list[tuple[date, date]] = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))

    total_days = sum((end - start).days for start, end in merged)
    total_years = round(total_days / 365.25, 1)
    return result.model_copy(update={"total_years_experience": total_years})
