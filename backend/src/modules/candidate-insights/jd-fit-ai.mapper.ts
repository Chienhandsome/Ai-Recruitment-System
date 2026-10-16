import { MatchLevel } from '@prisma/client';
import type { AiResultDto } from '../applications/dto/ai-result.dto';

export type JdFitSuggestion = {
  type: string;
  skill?: string;
  message: string;
};

export type CandidateJdFitAnalysisPayload = {
  overallScore: number;
  matchLevel: MatchLevel;
  analysis: {
    scoreBreakdown: {
      skills: number;
      experience: number;
      education: number;
      other: number;
    };
    matchedSkills: Array<{ name: string; isMandatory?: boolean }>;
    missingSkills: Array<{ name: string; isMandatory?: boolean }>;
    missingRequiredSkills: string[];
    strengths: string[];
    gaps: string[];
    summary: string;
    mandatoryStatus: string | null;
    mandatoryRatio: number | null;
    dataScopeNote: string;
  };
  suggestions: JdFitSuggestion[];
};

export function mapAiMatchLevel(level: string): MatchLevel {
  if (level === 'HIGH' || level === 'EXCELLENT' || level === 'GOOD') {
    return MatchLevel.HIGH;
  }
  if (level === 'MEDIUM' || level === 'FAIR') {
    return MatchLevel.MEDIUM;
  }
  return MatchLevel.LOW;
}

/**
 * Map AI Matching Engine response into Candidate-facing analysis + suggestions.
 * Only uses fields the AI actually returned — no invented tips.
 */
export function mapAiResultToCandidateJdFit(
  result: AiResultDto,
): CandidateJdFitAnalysisPayload {
  const matchedSkills = (result.matched_skills ?? []).map((s) => ({
    name: s.name,
    isMandatory: s.isMandatory,
  }));
  const missingSkills = (result.missing_skills ?? []).map((s) => ({
    name: s.name,
    isMandatory: s.isMandatory,
  }));
  const missingRequiredSkills = [...(result.missing_required_skills ?? [])];
  const strengths = [...(result.strengths ?? [])];
  const gaps = [...(result.gaps ?? [])];
  const summary =
    typeof result.summary === 'string' && result.summary.trim()
      ? result.summary.trim()
      : 'AI đã hoàn tất đánh giá mức phù hợp CV–JD.';

  const suggestions: JdFitSuggestion[] = [];
  const seen = new Set<string>();
  const push = (item: JdFitSuggestion) => {
    const key = `${item.type}:${item.skill ?? ''}:${item.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(item);
  };

  for (const skill of missingRequiredSkills) {
    push({
      type: 'ADD_REQUIRED_SKILL',
      skill,
      message: `Bổ sung hoặc làm rõ kỹ năng bắt buộc "${skill}" trên CV (kinh nghiệm/dự án liên quan).`,
    });
  }

  for (const skill of missingSkills) {
    if (skill.isMandatory) continue;
    if (missingRequiredSkills.includes(skill.name)) continue;
    push({
      type: 'ADD_SKILL',
      skill: skill.name,
      message: `Nên bổ sung hoặc làm rõ kỹ năng "${skill.name}" nếu bạn đã có kinh nghiệm liên quan.`,
    });
  }

  const experience = result.experience_assessment;
  if (experience) {
    if (experience.recommendation === 'NOT_ELIGIBLE_LEVEL') {
      push({
        type: 'EXPERIENCE_LEVEL',
        message:
          'Mức kinh nghiệm trên CV chưa đạt yêu cầu cấp bậc của tin tuyển dụng. Hãy nêu rõ hơn số năm và trách nhiệm liên quan.',
      });
    } else if (experience.recommendation === 'ADVISORY_LEVEL_GAP') {
      push({
        type: 'EXPERIENCE_LEVEL',
        message:
          'Cấp bậc kinh nghiệm còn lệch so với JD. Nhấn mạnh dự án/vai trò gần với yêu cầu hơn.',
      });
    }
    if (
      experience.relevance_score < 50 &&
      Array.isArray(experience.evidence) &&
      experience.evidence.length > 0
    ) {
      push({
        type: 'EXPERIENCE_RELEVANCE',
        message:
          'Kinh nghiệm chưa đủ liên quan tới JD. Ưu tiên mô tả công việc và thành tựu sát yêu cầu tin tuyển dụng.',
      });
    }
  }

  for (const gap of gaps.slice(0, 8)) {
    push({ type: 'GAP', message: gap });
  }

  for (const failure of result.mandatory_failures ?? []) {
    if (failure.type === 'CERTIFICATE' || /certificate/i.test(failure.type)) {
      push({
        type: 'CERTIFICATE',
        message:
          failure.reason ??
          `Thiếu chứng chỉ bắt buộc: ${failure.requirement}.`,
      });
    } else if (failure.type === 'LANGUAGE' || /language/i.test(failure.type)) {
      push({
        type: 'LANGUAGE',
        message:
          failure.reason ??
          `Thiếu yêu cầu ngôn ngữ: ${failure.requirement}.`,
      });
    } else if (
      failure.type === 'EDUCATION' ||
      /education/i.test(failure.type)
    ) {
      push({
        type: 'EDUCATION',
        message:
          failure.reason ??
          `Học vấn chưa đáp ứng: ${failure.requirement}.`,
      });
    }
  }

  if (matchedSkills.length > 0 && strengths.length === 0) {
    // no invented strengths
  }

  if (
    (result.other_score ?? 0) < 40 &&
    (missingSkills.length > 0 || gaps.some((g) => /project|chứng chỉ|certificate|language|ngôn ngữ/i.test(g)))
  ) {
    push({
      type: 'EVIDENCE',
      message:
        'Nhấn mạnh dự án, chứng chỉ hoặc ngôn ngữ liên quan trên CV để tăng phần điểm bằng chứng khác.',
    });
  }

  return {
    overallScore: Number(result.overall_score),
    matchLevel: mapAiMatchLevel(result.match_level),
    analysis: {
      scoreBreakdown: {
        skills: Number(result.skills_score ?? 0),
        experience: Number(result.experience_score ?? 0),
        education: Number(result.education_score ?? 0),
        other: Number(result.other_score ?? 0),
      },
      matchedSkills,
      missingSkills,
      missingRequiredSkills,
      strengths,
      gaps,
      summary,
      mandatoryStatus: result.mandatory_status ?? null,
      mandatoryRatio:
        typeof result.mandatory_ratio === 'number'
          ? result.mandatory_ratio
          : null,
      dataScopeNote:
        'Dữ liệu CV lấy theo resume đã chọn (kèm mục không gắn resumeId ở cấp hồ sơ). Điểm dùng cùng AI Matching Engine với phía HR.',
    },
    suggestions,
  };
}
