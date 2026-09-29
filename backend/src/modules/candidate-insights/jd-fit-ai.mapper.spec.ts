import { MatchLevel } from '@prisma/client';
import {
  mapAiMatchLevel,
  mapAiResultToCandidateJdFit,
} from './jd-fit-ai.mapper';
import type { AiResultDto } from '../applications/dto/ai-result.dto';

describe('jd-fit-ai.mapper', () => {
  const baseAiResult: AiResultDto = {
    overall_score: 81.5,
    match_level: 'HIGH',
    skills_score: 78,
    experience_score: 70,
    education_score: 60,
    other_score: 55,
    strengths: ['Strong NestJS experience'],
    gaps: ['Limited cloud exposure'],
    matched_skills: [{ name: 'NestJS', isMandatory: true }],
    missing_skills: [{ name: 'Kubernetes', isMandatory: false }],
    missing_required_skills: ['PostgreSQL'],
    evidence: [],
    confidence_score: 0.9,
    summary: 'Solid backend fit with one mandatory gap.',
    mandatory_status: 'CONDITIONAL_PASS',
    mandatory_ratio: 0.75,
    mandatory_failures: [],
  };

  it('maps overall_score and pillar scores from AI (not heuristic)', () => {
    const mapped = mapAiResultToCandidateJdFit(baseAiResult);
    expect(mapped.overallScore).toBe(81.5);
    expect(mapped.matchLevel).toBe(MatchLevel.HIGH);
    expect(mapped.analysis.scoreBreakdown).toEqual({
      skills: 78,
      experience: 70,
      education: 60,
      other: 55,
    });
    expect(mapped.analysis.matchedSkills[0].name).toBe('NestJS');
    expect(mapped.analysis.missingRequiredSkills).toEqual(['PostgreSQL']);
    expect(mapped.analysis.strengths).toContain('Strong NestJS experience');
    expect(mapped.analysis.gaps).toContain('Limited cloud exposure');
    expect(mapped.analysis.summary).toContain('Solid backend');
  });

  it('builds suggestions from AI evidence only', () => {
    const mapped = mapAiResultToCandidateJdFit(baseAiResult);
    expect(
      mapped.suggestions.some((s) => s.skill === 'PostgreSQL'),
    ).toBe(true);
    expect(
      mapped.suggestions.some((s) => s.message.includes('Limited cloud')),
    ).toBe(true);
    expect(
      mapped.suggestions.some((s) => /70%|title bonus|heuristic/i.test(s.message)),
    ).toBe(false);
  });

  it('normalizes AI match levels onto Prisma MatchLevel', () => {
    expect(mapAiMatchLevel('EXCELLENT')).toBe(MatchLevel.HIGH);
    expect(mapAiMatchLevel('FAIR')).toBe(MatchLevel.MEDIUM);
    expect(mapAiMatchLevel('POOR')).toBe(MatchLevel.LOW);
  });
});
