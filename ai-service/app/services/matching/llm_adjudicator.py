"""
LLM Semantic Adjudicator & Depth Evaluator for H-CAME V4.
Uses Google Gemini (with Structured Output) to evaluate project depth,
business impact, and resolve borderline / ambiguous qualification criteria.
Does NOT generate interview questions (as requested).
"""
import logging
from typing import Any, Dict, Optional, Tuple
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings
from app.schemas.matching import CandidateProfilePayload, JobPayload

logger = logging.getLogger(__name__)


class LLMAdjudicationResult(BaseModel):
    project_impact_score: float = Field(
        default=0.0,
        description="Điểm cộng/trừ cho độ phức tạp, quy mô và chiều sâu thực tế của dự án/công việc trong hồ sơ (-5.0 đến +5.0). Dự án quy mô lớn, kỹ thuật cao được cộng điểm; dự án nhỏ lẻ, mô tả sơ sài bị trừ điểm nhẹ.",
    )
    borderline_skill_confirmed: bool = Field(
        default=True,
        description="Xác nhận ứng viên có thực sự nắm vững các kỹ năng yêu cầu trong thực tế hay không (True nếu chứng minh được qua ngữ cảnh, False nếu chỉ là nói suông/thiếu bằng chứng).",
    )
    seniority_depth_multiplier: float = Field(
        default=1.0,
        description="Hệ số chiều sâu thâm niên thực chiến (từ 0.9 đến 1.1).",
    )
    concise_reasoning: str = Field(
        default="",
        description="Nhận xét chuyên môn ngắn gọn (1-2 câu) giải thích lý do đánh giá hoặc điều chỉnh điểm của LLM.",
    )


class SkillTransferJudgement(BaseModel):
    is_transferable: bool = Field(
        description="Có thể chuyển giao năng lực thực tế giữa 2 kỹ năng này trong công việc hay không (True nếu người làm kỹ năng nguồn có thể học và thích ứng nhanh với kỹ năng mục tiêu, False nếu hoàn toàn khác biệt hoặc thuộc ngành nghề khác)."
    )
    transfer_credit: float = Field(
        default=0.0,
        description="Tỷ lệ kế thừa năng lực từ 0.0 (không kế thừa) đến 1.0 (kế thừa hoàn toàn). Ví dụ: 0.8 cho kỹ năng rất gần, 0.0 cho kỹ năng không liên quan."
    )
    reason_vi: str = Field(
        default="",
        description="Giải thích ngắn gọn 1 câu bằng tiếng Việt về lý do chuyển giao hoặc từ chối chuyển giao để báo cáo cho HR."
    )


SKILL_TRANSFER_SYSTEM_PROMPT = """Bạn là Chuyên gia Đánh giá Kỹ năng và Năng lực Tuyển dụng Đa ngành (Senior Cross-Industry Skill Transfer Assessor).
Nhiệm vụ của bạn:
Thẩm định xem một nhân sự có kinh nghiệm ở 'Kỹ năng ứng viên có' (Source Skill) có thể chuyển giao (transfer) sang 'Kỹ năng yêu cầu tuyển dụng' (Target Skill) trong bối cảnh ngành nghề hay không.
Hệ thống tuyển dụng bao quát nhiều ngành nghề: Công nghệ thông tin, Marketing, Bán hàng, Kế toán & Tài chính, Logistics & Chuỗi cung ứng, Khách sạn & Nhà hàng, Nhân sự, Thiết kế, Kỹ thuật/Sản xuất.

NGUYÊN TẮC THẨM ĐỊNH ĐA NGÀNH:
1. KHÁC NGÀNH NGHỀ HOẶC LĨNH VỰC NGHIỆP VỤ HOÀN TOÀN KHÁC:
   - Ví dụ: 'Advantage+ Shopping Campaigns (Meta Ads)' vs 'Tailwind CSS' (Marketing Ads vs Frontend IT).
   - Ví dụ: 'Kế toán thuế TNCN' vs 'Lập trình Python' (Kế toán vs IT).
   - Ví dụ: 'Lễ tân khách sạn' vs 'Quản trị mạng hệ thống' (Khách sạn vs IT).
   - Ví dụ: 'Quản lý kho nội địa' vs 'Kê khai hải quan quốc tế VNACCS'.
   -> is_transferable = False, transfer_credit = 0.0, reason_vi nêu rõ hai kỹ năng thuộc hai lĩnh vực nghiệp vụ hoàn toàn khác biệt.
2. CÙNG NGÀNH HOẶC CÙNG PHÂN KHÚC NGHIỆP VỤ TƯƠNG ĐỒNG:
   - Ví dụ: 'Vue.js' vs 'React' (Frontend Web Frameworks) -> is_transferable = True, credit = 0.82.
   - Ví dụ: 'Google Ads' vs 'Facebook Ads' (Performance Marketing) -> is_transferable = True, credit = 0.80.
   - Ví dụ: 'Smile PMS' vs 'Opera PMS' (Hotel Front Desk Systems) -> is_transferable = True, credit = 0.80.
   - Ví dụ: 'MISA' vs 'Bravo/Fast' (Phần mềm kế toán Việt Nam) -> is_transferable = True, credit = 0.85.
   -> is_transferable = True, transfer_credit từ 0.70 đến 0.85, reason_vi giải thích sự tương đồng nghiệp vụ.
3. THÂM NIÊN KỸ NĂNG NGUỒN QUÁ NGẮN (< 1.0 NĂM):
   - Nếu ứng viên làm chưa đủ 1 năm ở công cụ nguồn mà chuyển sang công cụ khác -> Cần xem xét khắt khe, nếu không đủ chiều sâu thì is_transferable = False hoặc credit rất thấp.
TUYỆT ĐỐI KHÔNG sinh câu hỏi phỏng vấn. Chỉ trả lời JSON theo đúng schema."""


ADJUDICATION_SYSTEM_PROMPT = """Bạn là Chuyên gia Đánh giá Kỹ thuật và Năng lực Ứng viên (Senior Technical Talent Assessor).
Nhiệm vụ của bạn:
1. Đọc mô tả công việc (JD) và hồ sơ kinh nghiệm, dự án thực tế của ứng viên.
2. Đánh giá ĐỘ SÂU THỰC CHIẾN và QUY MÔ DỰ ÁN (project_impact_score từ -5.0 đến +5.0):
   - Cộng điểm (+1.0 đến +5.0): Dự án có độ phức tạp cao, quy mô lớn, số liệu thành tựu rõ ràng, giải quyết bài toán khó.
   - Điểm 0.0: Dự án ở mức tiêu chuẩn, phù hợp kỳ vọng bình thường.
   - Trừ điểm (-1.0 đến -5.0): Mô tả chung chung, thiếu số liệu, dự án quy mô nhỏ, công việc chỉ mang tính hỗ trợ cơ bản.
3. Thẩm định các kỹ năng ca biên hoặc tuyên bố năng lực (borderline_skill_confirmed: true/false).
4. Đưa ra nhận xét chuyên môn ngắn gọn (concise_reasoning: tối đa 2 câu).
LƯU Ý QUAN TRỌNG: Tuyệt đối KHÔNG sinh câu hỏi phỏng vấn. Chỉ tập trung vào thẩm định chiều sâu và điều chỉnh điểm số.
"""


class LLMAdjudicator:
    def __init__(self, api_key: str = "", model_name: str = ""):
        self._api_key = api_key or settings.gemini_api_key
        self._model_name = model_name or settings.llm_model
        self._client = None
        self._transfer_cache: Dict[Tuple[str, str, str], SkillTransferJudgement] = {}
        if self._api_key:
            try:
                self._client = genai.Client(api_key=self._api_key)
            except Exception as e:
                logger.warning("Failed to initialize GenAI client: %s", e)

    @property
    def is_available(self) -> bool:
        return bool(self._api_key and self._client is not None)

    def adjudicate(
        self,
        cand_profile: CandidateProfilePayload,
        job: JobPayload,
        match_metrics: Dict[str, Any],
        final_scores: Dict[str, Any],
    ) -> Optional[LLMAdjudicationResult]:
        """
        Adjudicate candidate experience and project depth using LLM.
        Returns LLMAdjudicationResult if successful, or None if skipped/failed.
        """
        if not self.is_available:
            return None

        # Optimization: Only run LLM adjudication on non-trivial candidates (e.g. score >= 45.0)
        # to avoid wasting API quota on completely unrelated profiles.
        base_score = final_scores.get("overall_score", 0.0)
        if base_score < 45.0:
            return None

        prompt = self._build_prompt(cand_profile, job, match_metrics, base_score)

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=ADJUDICATION_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=LLMAdjudicationResult,
                    temperature=0.1,
                ),
            )
            if not response.text:
                return None

            result = LLMAdjudicationResult.model_validate_json(response.text)
            logger.info(
                "[LLMAdjudicator] Candidate: %s, Impact: %.1f, Confirmed: %s, Reason: %s",
                getattr(cand_profile.profile, "desired_title", "Candidate"),
                result.project_impact_score,
                result.borderline_skill_confirmed,
                result.concise_reasoning,
            )
            return result
        except errors.APIError as exc:
            logger.warning("[LLMAdjudicator] Gemini API error: %s", exc)
            return None
        except ValidationError as exc:
            logger.warning("[LLMAdjudicator] Schema validation error: %s", exc)
            return None
        except Exception as exc:
            logger.warning("[LLMAdjudicator] Unexpected error during adjudication: %s", exc)
            return None

    def judge_skill_transfer(
        self,
        target_skill: str,
        candidate_skill: str,
        domain_context: Optional[str] = None,
        source_years: float = 0.0,
    ) -> Optional[SkillTransferJudgement]:
        """
        Adjudicate whether candidate_skill can transfer to target_skill across any industry.
        Uses in-memory cache to ensure instant O(1) response on repeated pairs.
        """
        if not self.is_available:
            return None

        cache_key = (
            target_skill.strip().lower(),
            candidate_skill.strip().lower(),
            (domain_context or "").strip().lower(),
        )
        if cache_key in self._transfer_cache:
            return self._transfer_cache[cache_key]

        prompt = f"""THẨM ĐỊNH KHẢ NĂNG CHUYỂN GIAO KỸ NĂNG:
- Kỹ năng yêu cầu (Target Skill): {target_skill}
- Kỹ năng ứng viên có (Source Skill): {candidate_skill}
- Thâm niên ứng viên ở kỹ năng nguồn: {source_years:.1f} năm
- Bối cảnh ngành nghề tuyển dụng: {domain_context or 'Đa ngành / Tổng hợp'}

Hãy thẩm định xem trong thực tế tuyển dụng của ngành nghề này, năng lực từ kỹ năng nguồn có thể chuyển giao sang kỹ năng yêu cầu hay không."""

        try:
            response = self._client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SKILL_TRANSFER_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=SkillTransferJudgement,
                    temperature=0.0,
                ),
            )
            if not response.text:
                return None
            result = SkillTransferJudgement.model_validate_json(response.text)
            self._transfer_cache[cache_key] = result
            logger.info(
                "[LLMAdjudicator] Skill Transfer '%s' -> '%s' (Domain: %s): Transferable=%s, Credit=%.2f, Reason: %s",
                candidate_skill,
                target_skill,
                domain_context,
                result.is_transferable,
                result.transfer_credit,
                result.reason_vi,
            )
            return result
        except Exception as exc:
            logger.warning("[LLMAdjudicator] Error judging skill transfer: %s", exc)
            return None

    def _build_prompt(
        self,
        cand_profile: CandidateProfilePayload,
        job: JobPayload,
        match_metrics: Dict[str, Any],
        base_score: float,
    ) -> str:
        exps = []
        for e in (cand_profile.work_experiences or [])[:5]:
            exps.append(
                f"- Vị trí: {e.position_title or 'N/A'} tại {e.company_name or 'N/A'} "
                f"({e.start_date or ''} - {'Hiện tại' if getattr(e, 'is_current', False) else (e.end_date or '')})\n"
                f"  Mô tả: {e.description or 'N/A'}\n"
                f"  Thành tựu: {e.achievements or 'N/A'}"
            )
        exp_summary = "\n".join(exps) if exps else "Không có chi tiết kinh nghiệm."

        projs = []
        for p in (cand_profile.projects or [])[:4]:
            projs.append(
                f"- Dự án: {p.project_name or 'N/A'}\n"
                f"  Công nghệ: {', '.join(p.technologies or [])}\n"
                f"  Mô tả: {p.description or 'N/A'}"
            )
        proj_summary = "\n".join(projs) if projs else "Không có dự án độc lập."

        skills_list = [s.skill_name for s in (cand_profile.skills or [])[:20]]
        req_skills = [
            f"{s.skill_name} ({'Bắt buộc' if s.is_mandatory else 'Ưu tiên'})"
            for s in (job.required_skills or [])[:15]
        ]
        missing_mandatory = match_metrics.get("skills", {}).get("missing_mandatory", [])

        return f"""YÊU CẦU CÔNG VIỆC (JOB DESCRIPTION):
Tiêu đề: {job.title}
Cấp bậc yêu cầu: {job.experience_level or 'Không yêu cầu cụ thể'} ({job.required_experience_years} năm thâm niên)
Kỹ năng yêu cầu: {', '.join(req_skills) if req_skills else 'N/A'}
Mô tả công việc: {(job.description or '')[:800]}

HỒ SƠ ỨNG VIÊN (CANDIDATE PROFILE):
Chức danh kỳ vọng: {getattr(cand_profile.profile, 'desired_title', '') or 'N/A'}
Tóm tắt năng lực: {getattr(cand_profile.profile, 'professional_summary', '') or 'N/A'}
Kỹ năng khai báo: {', '.join(skills_list) if skills_list else 'N/A'}
Kinh nghiệm làm việc:
{exp_summary}
Dự án tiêu biểu:
{proj_summary}

ĐÁNH GIÁ SƠ BỘ TỪ RULE ENGINE:
- Điểm sơ bộ: {base_score:.1f}/100
- Kỹ năng bắt buộc còn thiếu: {', '.join(missing_mandatory) if missing_mandatory else 'Không có (Đã đủ)'}

Hãy phân tích và trả lời theo schema JSON yêu cầu. Tuyệt đối KHÔNG sinh câu hỏi phỏng vấn."""


# Global singleton instance
llm_adjudicator = LLMAdjudicator()
