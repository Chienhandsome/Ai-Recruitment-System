"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiResultSchema = exports.PillarExplanationsSchema = exports.PillarExplanationItemSchema = exports.ScoreBreakdownSchema = exports.PillarScoreBreakdownItemSchema = exports.ExperienceAssessmentSchema = exports.EvidenceSchema = exports.SkillInfoSchema = void 0;
const zod_1 = require("zod");
exports.SkillInfoSchema = zod_1.z.object({
    name: zod_1.z.string(),
    isMandatory: zod_1.z.boolean().default(false),
});
exports.EvidenceSchema = zod_1.z.object({
    skillName: zod_1.z.string(),
    evidenceText: zod_1.z.string(),
    source: zod_1.z.string().default('Context'),
});
const ExperienceLevelSchema = zod_1.z.enum([
    'INTERN',
    'FRESHER',
    'JUNIOR',
    'MIDDLE',
    'SENIOR',
    'LEAD',
    'MANAGER',
    'DIRECTOR',
]);
exports.ExperienceAssessmentSchema = zod_1.z.object({
    candidate_level: ExperienceLevelSchema.nullable().default(null),
    required_level: ExperienceLevelSchema,
    total_experience_years: zod_1.z.number().min(0),
    duration_score: zod_1.z.number().min(0).max(100),
    relevance_score: zod_1.z.number().min(0).max(100),
    level_fit_score: zod_1.z.number().min(0).max(100).nullable().default(null),
    level_gap: zod_1.z.number().int().nullable().default(null),
    level_eligible: zod_1.z.boolean().nullable().default(null),
    level_confidence: zod_1.z.number().min(0).max(1),
    level_requirement_mode: zod_1.z.enum(['ADVISORY', 'REQUIRED']),
    recommendation: zod_1.z.enum([
        'ELIGIBLE',
        'ADVISORY_LEVEL_GAP',
        'NOT_ELIGIBLE_LEVEL',
        'NEEDS_REVIEW',
    ]),
    evidence: zod_1.z.array(zod_1.z.string()).default([]),
    reason_codes: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.PillarScoreBreakdownItemSchema = zod_1.z.object({
    earned_points: zod_1.z.number().default(0),
    max_points: zod_1.z.number().default(0),
    weight_pct: zod_1.z.number().default(0),
    normalized_score: zod_1.z.number().default(0),
});
exports.ScoreBreakdownSchema = zod_1.z.object({
    skills: exports.PillarScoreBreakdownItemSchema,
    experience: exports.PillarScoreBreakdownItemSchema,
    education: exports.PillarScoreBreakdownItemSchema,
    other: exports.PillarScoreBreakdownItemSchema,
});
exports.PillarExplanationItemSchema = zod_1.z.object({
    earned_points: zod_1.z.number().default(0),
    max_points: zod_1.z.number().default(0),
    plus_reasons: zod_1.z.array(zod_1.z.string()).default([]),
    minus_reasons: zod_1.z.array(zod_1.z.string()).default([]),
    summary: zod_1.z.string().default(''),
});
exports.PillarExplanationsSchema = zod_1.z.object({
    skills: exports.PillarExplanationItemSchema,
    experience: exports.PillarExplanationItemSchema,
    education: exports.PillarExplanationItemSchema,
    other: exports.PillarExplanationItemSchema,
});
exports.AiResultSchema = zod_1.z.object({
    overall_score: zod_1.z.number().default(0),
    match_level: zod_1.z
        .enum(['LOW', 'MEDIUM', 'HIGH', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'])
        .default('LOW'),
    skills_score: zod_1.z.number().default(0),
    experience_score: zod_1.z.number().default(0),
    education_score: zod_1.z.number().default(0),
    other_score: zod_1.z.number().default(0),
    score_breakdown: exports.ScoreBreakdownSchema.nullable().optional(),
    pillar_explanations: exports.PillarExplanationsSchema.nullable().optional(),
    strengths: zod_1.z.array(zod_1.z.string()).default([]),
    gaps: zod_1.z.array(zod_1.z.string()).default([]),
    matched_skills: zod_1.z.array(exports.SkillInfoSchema).default([]),
    missing_skills: zod_1.z.array(exports.SkillInfoSchema).default([]),
    missing_required_skills: zod_1.z.array(zod_1.z.string()).default([]),
    evidence: zod_1.z.array(exports.EvidenceSchema).default([]),
    confidence_score: zod_1.z.number().default(1.0),
    summary: zod_1.z.string().default(''),
    experience_assessment: exports.ExperienceAssessmentSchema.nullable().optional(),
});
//# sourceMappingURL=ai-result.dto.js.map