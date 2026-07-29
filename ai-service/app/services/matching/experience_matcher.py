from datetime import datetime
from typing import List, Tuple
# pyrefly: ignore [missing-import]
from app.schemas.matching import JobPayload, WorkExperience
# pyrefly: ignore [missing-import]
from app.services.matching.semantic import semantic_matcher
# pyrefly: ignore [missing-import]
from app.utils.logger import log_evaluation_step

DOMAIN_KEYWORDS = ["backend", "frontend", "devops", "data", "java", "reporting", "software"]


class ExperienceMatcher:
    """
    Evaluates Candidate Work Experience against Job requirements.
    Calculates total experience duration, position title relevance, and semantic description similarity.
    Merged interval calculation ensures overlapping experience ranges are NOT double-counted.
    """

    def evaluate(
        self, work_experiences: List[WorkExperience], job: JobPayload
    ) -> Tuple[float, List[str], List[str]]:
        strengths = []
        gaps = []

        if not work_experiences:
            if job.required_experience_years > 0:
                gaps.append(
                    f"Chưa có kinh nghiệm làm việc thực tế (Yêu cầu: {job.required_experience_years} năm)."
                )
                log_evaluation_step("ExperienceMatcher", {"score": 20.0, "total_years": 0})
                return 20.0, strengths, gaps
            else:
                strengths.append("Phù hợp với vị trí không yêu cầu kinh nghiệm.")
                log_evaluation_step("ExperienceMatcher", {"score": 90.0, "total_years": 0})
                return 90.0, strengths, gaps

        total_years = self._calculate_total_years(work_experiences)
        req_years = float(job.required_experience_years or 0.0)

        if req_years > 0:
            duration_score = min(1.0, total_years / req_years)
            if total_years >= req_years:
                strengths.append(
                    f"Kinh nghiệm làm việc {total_years:.1f} năm đáp ứng yêu cầu ({req_years} năm)."
                )
            else:
                gaps.append(
                    f"Kinh nghiệm {total_years:.1f} năm chưa đạt số năm yêu cầu ({req_years} năm)."
                )
        else:
            duration_score = 1.0
            strengths.append(f"Kinh nghiệm làm việc tích lũy: {total_years:.1f} năm.")

        candidate_titles = [exp.position_title for exp in work_experiences if exp.position_title]
        title_sim = self._calc_title_relevance(job.title, candidate_titles)

        exp_descriptions = [
            f"{exp.position_title}: {exp.description or ''} {exp.achievements or ''}"
            for exp in work_experiences
        ]
        job_full_desc = f"{job.title}. {job.description or ''}. {job.requirements or ''}"
        desc_sim = semantic_matcher.compute_best_similarity(job_full_desc, exp_descriptions)

        relevance_score = 0.7 * title_sim + 0.3 * desc_sim

        if title_sim >= 0.7:
            strengths.append(f"Đã từng đảm nhiệm vị trí tương đồng ({candidate_titles[0]}).")

        raw_score = 0.5 * duration_score + 0.5 * relevance_score
        experience_score = round(raw_score * 100.0, 2)

        log_evaluation_step(
            "ExperienceMatcher",
            {
                "score": experience_score,
                "total_years": round(total_years, 2),
                "duration_score": round(duration_score, 2),
                "relevance_score": round(relevance_score, 2),
            },
        )

        return experience_score, strengths, gaps

    def _calc_title_relevance(self, job_title: str, candidate_titles: List[str]) -> float:
        if not candidate_titles:
            return 0.0

        j_title_lower = job_title.lower()
        is_job_intern = "intern" in j_title_lower
        best_rel = 0.0

        for c_title in candidate_titles:
            c_title_lower = c_title.lower()
            is_cand_intern = "intern" in c_title_lower

            if c_title_lower in j_title_lower or j_title_lower in c_title_lower:
                rel = 1.0
            else:
                rel = 0.0
                for kw in DOMAIN_KEYWORDS:
                    if kw in j_title_lower and kw in c_title_lower:
                        rel = max(rel, 0.85)

                sem_sim = semantic_matcher.compute_similarity(job_title, c_title)
                rel = max(rel, sem_sim)

            if is_cand_intern and not is_job_intern:
                rel *= 0.55

            best_rel = max(best_rel, rel)

        return best_rel

    def _calculate_total_years(self, experiences: List[WorkExperience]) -> float:
        """
        Calculates total experience duration in years.
        Merges overlapping date intervals to prevent double-counting experience days.
        """
        if not experiences:
            return 0.0

        now = datetime.now()
        intervals = []

        for exp in experiences:
            try:
                start_dt = datetime.strptime(exp.start_date, "%Y-%m-%d") if exp.start_date else now
            except ValueError:
                start_dt = now

            if exp.is_current or not exp.end_date:
                end_dt = now
            else:
                try:
                    end_dt = datetime.strptime(exp.end_date, "%Y-%m-%d")
                except ValueError:
                    end_dt = now

            if start_dt > end_dt:
                start_dt, end_dt = end_dt, start_dt

            intervals.append((start_dt, end_dt))

        # Sort intervals by start_date
        intervals.sort(key=lambda x: x[0])

        merged_intervals = []
        for current_start, current_end in intervals:
            if not merged_intervals:
                merged_intervals.append((current_start, current_end))
            else:
                last_start, last_end = merged_intervals[-1]
                if current_start <= last_end:
                    # Overlapping: merge intervals
                    merged_intervals[-1] = (last_start, max(last_end, current_end))
                else:
                    merged_intervals.append((current_start, current_end))

        total_days = sum((end - start).days for start, end in merged_intervals)
        return total_days / 365.25
