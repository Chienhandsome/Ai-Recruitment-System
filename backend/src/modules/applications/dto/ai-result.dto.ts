import { z } from 'zod';

export const SkillInfoSchema = z.object({
  name: z.string(),
  isMandatory: z.boolean().default(false),
});

export const EvidenceSchema = z.object({
  skillName: z.string(),
  evidenceText: z.string(),
  source: z.string().default('Context'),
});

const ExperienceLevelSchema = z.enum([
  'INTERN',
  'FRESHER',
  'JUNIOR',
  'MIDDLE',
  'SENIOR',
  'LEAD',
  'MANAGER',
  'DIRECTOR',
]);

export const ExperienceAssessmentSchema = z.object({
  candidate_level: ExperienceLevelSchema.nullable().default(null),
  required_level: ExperienceLevelSchema,
  total_experience_years: z.number().min(0),
  duration_score: z.number().min(0).max(100),
  relevance_score: z.number().min(0).max(100),
  level_fit_score: z.number().min(0).max(100).nullable().default(null),
  level_gap: z.number().int().nullable().default(null),
  level_eligible: z.boolean().nullable().default(null),
  level_confidence: z.number().min(0).max(1),
  level_requirement_mode: z.enum(['ADVISORY', 'REQUIRED']),
  recommendation: z.enum([
    'ELIGIBLE',
    'ADVISORY_LEVEL_GAP',
    'NOT_ELIGIBLE_LEVEL',
    'NEEDS_REVIEW',
  ]),
  evidence: z.array(z.string()).default([]),
  reason_codes: z.array(z.string()).default([]),
});

export const PillarScoreBreakdownItemSchema = z.object({
  earned_points: z.number().default(0),
  max_points: z.number().default(0),
  weight_pct: z.number().default(0),
  normalized_score: z.number().default(0),
});

export const ScoreBreakdownSchema = z.object({
  skills: PillarScoreBreakdownItemSchema,
  experience: PillarScoreBreakdownItemSchema,
  education: PillarScoreBreakdownItemSchema,
  other: PillarScoreBreakdownItemSchema,
});

export const PillarExplanationItemSchema = z.object({
  earned_points: z.number().default(0),
  max_points: z.number().default(0),
  plus_reasons: z.array(z.string()).default([]),
  minus_reasons: z.array(z.string()).default([]),
  summary: z.string().default(''),
});

export const PillarExplanationsSchema = z.object({
  skills: PillarExplanationItemSchema,
  experience: PillarExplanationItemSchema,
  education: PillarExplanationItemSchema,
  other: PillarExplanationItemSchema,
});

export const AiResultSchema = z.object({
  overall_score: z.number().default(0),
  match_level: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'])
    .default('LOW'),
  skills_score: z.number().default(0),
  experience_score: z.number().default(0),
  education_score: z.number().default(0),
  other_score: z.number().default(0),
  score_breakdown: ScoreBreakdownSchema.nullable().optional(),
  pillar_explanations: PillarExplanationsSchema.nullable().optional(),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  matched_skills: z.array(SkillInfoSchema).default([]),
  missing_skills: z.array(SkillInfoSchema).default([]),
  missing_required_skills: z.array(z.string()).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  confidence_score: z.number().default(1.0),
  evidence_confidence: z.number().default(1.0).optional(),
  temporal_recency_score: z.number().default(1.0).optional(),
  inflation_flags: z.array(z.string()).default([]).optional(),
  career_velocity: z.record(z.string(), z.any()).nullable().optional(),
  summary: z.string().default(''),
  experience_assessment: ExperienceAssessmentSchema.nullable().optional(),
});

export type AiResultDto = z.infer<typeof AiResultSchema>;
