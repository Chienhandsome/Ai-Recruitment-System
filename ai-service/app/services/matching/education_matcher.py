from typing import List, Tuple
# pyrefly: ignore [missing-import]
from app.schemas.matching import Education, JobPayload
# pyrefly: ignore [missing-import]
from app.utils.logger import log_evaluation_step

DEGREE_SCORES = {
    "tiến sĩ": 1.0,
    "doctorate": 1.0,
    "phd": 1.0,
    "thạc sĩ": 0.95,
    "master": 0.95,
    "cử nhân": 0.90,
    "bachelor": 0.90,
    "kỹ sư": 0.90,
    "engineer": 0.90,
    "cao đẳng": 0.70,
    "associate": 0.70,
    "trung cấp": 0.50,
}

RELEVANT_MAJORS = [
    "kỹ thuật phần mềm",
    "công nghệ thông tin",
    "khoa học máy tính",
    "hệ thống thông tin",
    "toán tin",
    "khoa học dữ liệu",
    "dữ liệu",
    "software engineering",
    "computer science",
    "information technology",
    "data science",
]


class EducationMatcher:
    """
    Evaluates Candidate Education based on degree level and major relevance.
    """

    def evaluate(
        self, educations: List[Education], job: JobPayload
    ) -> Tuple[float, List[str], List[str]]:
        strengths = []
        gaps = []

        if not educations:
            gaps.append("Chưa cung cấp thông tin học vấn / bằng cấp.")
            log_evaluation_step("EducationMatcher", {"score": 50.0, "has_education": False})
            return 50.0, strengths, gaps

        best_degree_score = 0.5
        best_major_score = 0.5
        best_edu_summary = ""

        for edu in educations:
            degree_str = (edu.degree or "").strip().lower()
            major_str = (edu.major or "").strip().lower()

            # Determine degree score
            deg_score = 0.6  # Default fallback degree score
            for deg_key, score_val in DEGREE_SCORES.items():
                if deg_key in degree_str:
                    deg_score = score_val
                    break

            # Determine major relevance score
            major_score = 0.6
            for rel_major in RELEVANT_MAJORS:
                if rel_major in major_str:
                    major_score = 1.0
                    break

            combined = 0.6 * deg_score + 0.4 * major_score
            if combined > (0.6 * best_degree_score + 0.4 * best_major_score):
                best_degree_score = deg_score
                best_major_score = major_score
                best_edu_summary = f"{edu.degree or 'Bằng cấp'} - ngành {edu.major or 'Chuyên ngành'} ({edu.school_name or 'Trường'})"

        raw_score = 0.6 * best_degree_score + 0.4 * best_major_score
        education_score = round(raw_score * 100.0, 2)

        if best_major_score >= 0.9:
            strengths.append(f"Học vấn đúng chuyên ngành chuyên môn: {best_edu_summary}.")
        else:
            gaps.append(f"Chuyên ngành học vấn không nằm trong chuyên môn cốt lõi của vị trí.")

        log_evaluation_step(
            "EducationMatcher",
            {
                "score": education_score,
                "degree_score": round(best_degree_score, 2),
                "major_score": round(best_major_score, 2),
            },
        )

        return education_score, strengths, gaps
