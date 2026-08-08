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

export const AiResultSchema = z.object({
  overall_score: z.number().default(0),
  match_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('LOW'),
  skills_score: z.number().default(0),
  experience_score: z.number().default(0),
  education_score: z.number().default(0),
  other_score: z.number().default(0),
  strengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  matched_skills: z.array(SkillInfoSchema).default([]),
  missing_skills: z.array(SkillInfoSchema).default([]),
  missing_required_skills: z.array(z.string()).default([]),
  evidence: z.array(EvidenceSchema).default([]),
  confidence_score: z.number().default(1.0),
  summary: z.string().default(''),
});

export type AiResultDto = z.infer<typeof AiResultSchema>;
