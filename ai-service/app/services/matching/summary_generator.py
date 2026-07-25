from typing import List


class SummaryGenerator:
    """
    Generates structured strengths, gaps, missing skills, and natural language summary based on evaluation results.
    """

    @staticmethod
    def generate_summary(
        candidate_name: str,
        job_title: str,
        overall_score: float,
        match_level: str,
        skills_score: float,
        experience_score: float,
        education_score: float,
        project_score: float,
        missing_required_skills: List[str],
        strengths: List[str],
        gaps: List[str],
    ) -> str:
        """Synthesizes a clear, human-readable evaluation summary."""
        level_labels = {
            "HIGH": "rất cao (Phù hợp hàng đầu)",
            "MEDIUM": "trung bình (Cần cân nhắc / Đào tạo thêm)",
            "LOW": "thấp (Chưa đáp ứng tiêu chí cốt lõi)",
        }
        level_desc = level_labels.get(match_level, match_level)

        summary_parts = [
            f"Ứng viên đạt mức độ phù hợp {match_level} ({overall_score:.2f}/100) cho vị trí '{job_title}'."
        ]

        if match_level == "HIGH":
            summary_parts.append(
                f"Hồ sơ ứng viên đáp ứng xuất sắc các tiêu chí tuyển dụng chính với điểm kỹ năng {skills_score:.1f} và kinh nghiệm {experience_score:.1f}."
            )
        elif match_level == "MEDIUM":
            summary_parts.append(
                f"Ứng viên đạt yêu cầu nền tảng với điểm kỹ năng {skills_score:.1f} và kinh nghiệm {experience_score:.1f}."
            )
            if missing_required_skills:
                summary_parts.append(
                    f"Tuy nhiên, ứng viên còn thiếu một số kỹ năng bắt buộc: {', '.join(missing_required_skills)}."
                )
        else:
            summary_parts.append(
                f"Hồ sơ ứng viên còn khoảng cách lớn so với yêu cầu công việc (Điểm kỹ năng: {skills_score:.1f}, Kinh nghiệm: {experience_score:.1f})."
            )

        if strengths:
            summary_parts.append(f"Điểm mạnh nổi bật: {strengths[0]}")

        return " ".join(summary_parts)
