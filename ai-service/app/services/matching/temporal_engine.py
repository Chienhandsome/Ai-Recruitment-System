"""
Temporal Dynamics & Career Velocity Engine (H-CAME V4):
Models skill recency time-decay e^(-lambda * delta_t) and candidate career progression velocity.
"""

from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timezone
import math


class TemporalEngine:
    """
    Evaluates temporal recency of skills and career trajectory velocity.
    """

    # Seniority rank hierarchy for career velocity tracking
    SENIORITY_RANKS = {
        "intern": 1,
        "fresher": 2,
        "junior": 3,
        "middle": 4,
        "mid": 4,
        "senior": 5,
        "lead": 6,
        "tech lead": 6,
        "team lead": 6,
        "principal": 7,
        "staff": 7,
        "manager": 7,
        "director": 8,
        "head": 8,
        "vp": 9,
        "cto": 9,
        "ceo": 9,
    }

    def calculate_skill_recency(
        self,
        skill_name: str,
        work_experiences: List[Any],
        projects: List[Any],
        eval_date: Optional[datetime] = None
    ) -> Tuple[float, str]:
        """
        Calculates exponential time-decay weight for a specific skill based on the latest date it was utilized.

        Formula:
            w(t) = max(0.40, e^(-0.12 * delta_years))

        Returns:
            (recency_factor: float [0.4 - 1.0], recency_diagnostic: str)
        """
        if not eval_date:
            eval_date = datetime.now(timezone.utc)

        target_skill = skill_name.lower().strip()
        latest_end_year = None
        found_in_current = False

        # 1. Search in Work Experiences
        for exp in work_experiences:
            desc = (getattr(exp, "description", "") or "").lower()
            achieve = (getattr(exp, "achievements", "") or "").lower()
            title = (getattr(exp, "position_title", "") or "").lower()

            if target_skill in desc or target_skill in achieve or target_skill in title:
                if getattr(exp, "is_current", False):
                    found_in_current = True
                    break
                end_d = getattr(exp, "end_date", None)
                if end_d:
                    try:
                        if isinstance(end_d, str):
                            dt = datetime.fromisoformat(end_d.replace("Z", "+00:00"))
                        else:
                            dt = end_d
                        if latest_end_year is None or dt.year > latest_end_year:
                            latest_end_year = dt.year
                    except Exception:
                        pass

        # 2. Search in Projects
        if not found_in_current:
            for proj in projects:
                techs = [t.lower().strip() for t in (getattr(proj, "technologies", []) or [])]
                p_desc = (getattr(proj, "description", "") or "").lower()
                if target_skill in techs or target_skill in p_desc:
                    end_d = getattr(proj, "end_date", None)
                    if end_d:
                        try:
                            if isinstance(end_d, str):
                                dt = datetime.fromisoformat(end_d.replace("Z", "+00:00"))
                            else:
                                dt = end_d
                            if latest_end_year is None or dt.year > latest_end_year:
                                latest_end_year = dt.year
                        except Exception:
                            pass

        if found_in_current or latest_end_year == eval_date.year:
            return (1.0, "Kỹ năng đang được sử dụng thực chiến gần đây (Độ tươi 100%).")

        if latest_end_year is None:
            # Skill listed in profile but not tied to dated text -> moderate recency baseline
            return (0.85, "Kỹ năng được khai báo trong hồ sơ chuyên môn.")

        delta_years = max(0.0, eval_date.year - latest_end_year)
        if delta_years <= 1.0:
            return (1.0, f"Sử dụng gần nhất trong năm {latest_end_year} (Độ tươi tối ưu).")

        # Exponential decay: lambda = 0.12
        decay_factor = round(max(0.45, math.exp(-0.12 * delta_years)), 3)
        return (decay_factor, f"Sử dụng lần cuối cách đây khoảng {int(delta_years)} năm (Năm {latest_end_year}) - Hệ số độ tươi: {int(decay_factor*100)}%.")

    def calculate_career_velocity(self, work_experiences: List[Any]) -> Dict[str, Any]:
        """
        Analyzes candidate job progression trajectory and promotion velocity.

        Returns:
            Dict with velocity_score, promotion_count, velocity_label, trajectory_evidence.
        """
        if not work_experiences or len(work_experiences) <= 1:
            return {
                "velocity_score": 1.0,
                "promotion_count": 0,
                "velocity_label": "STEADY_GROWTH",
                "trajectory_evidence": "Hồ sơ giai đoạn khởi đầu hoặc chưa ghi nhận chuyển bậc chức danh."
            }

        # Sort experiences by start date ascending
        parsed_exps = []
        for exp in work_experiences:
            title = (getattr(exp, "position_title", "") or "").lower().strip()
            rank = self._extract_rank(title)
            start_d = getattr(exp, "start_date", None)
            year = 2020
            if start_d:
                try:
                    if isinstance(start_d, str):
                        dt = datetime.fromisoformat(start_d.replace("Z", "+00:00"))
                    else:
                        dt = start_d
                    year = dt.year
                except Exception:
                    pass
            parsed_exps.append({"title": title, "rank": rank, "year": year})

        parsed_exps.sort(key=lambda x: x["year"])

        promotions = 0
        max_jump = 0
        for i in range(1, len(parsed_exps)):
            diff = parsed_exps[i]["rank"] - parsed_exps[i-1]["rank"]
            if diff > 0:
                promotions += 1
                max_jump = max(max_jump, diff)

        total_years = max(1.0, parsed_exps[-1]["year"] - parsed_exps[0]["year"] + 1)
        velocity_ratio = promotions / float(total_years)

        if promotions >= 2 and total_years <= 4:
            velocity_score = 1.10  # 10% potential bonus
            label = "FAST_TRACK"
            evidence = f"Ứng viên có tốc độ phát triển nghề nghiệp rất nhanh ({promotions} lần thăng tiến trong {total_years} năm)."
        elif promotions >= 1:
            velocity_score = 1.05
            label = "STEADY_GROWTH"
            evidence = f"Quỹ đạo phát triển thăng tiến đều đặn qua các vị trí công việc."
        else:
            velocity_score = 1.0
            label = "EXPERIENCED_STABLE"
            evidence = "Quỹ đạo làm việc ổn định tại các vị trí chuyên môn tương đương."

        return {
            "velocity_score": velocity_score,
            "promotion_count": promotions,
            "velocity_label": label,
            "trajectory_evidence": evidence
        }

    def _extract_rank(self, title: str) -> int:
        best_rank = 3  # default Junior/Mid level
        for keyword, rank in self.SENIORITY_RANKS.items():
            if keyword in title:
                best_rank = max(best_rank, rank)
        return best_rank


# Singleton temporal engine instance
temporal_engine = TemporalEngine()
