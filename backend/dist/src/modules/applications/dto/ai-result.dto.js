"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiResultSchema = exports.EvidenceSchema = exports.SkillInfoSchema = void 0;
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
exports.AiResultSchema = zod_1.z.object({
    overall_score: zod_1.z.number().default(0),
    match_level: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('LOW'),
    skills_score: zod_1.z.number().default(0),
    experience_score: zod_1.z.number().default(0),
    education_score: zod_1.z.number().default(0),
    other_score: zod_1.z.number().default(0),
    strengths: zod_1.z.array(zod_1.z.string()).default([]),
    gaps: zod_1.z.array(zod_1.z.string()).default([]),
    matched_skills: zod_1.z.array(exports.SkillInfoSchema).default([]),
    missing_skills: zod_1.z.array(exports.SkillInfoSchema).default([]),
    missing_required_skills: zod_1.z.array(zod_1.z.string()).default([]),
    evidence: zod_1.z.array(exports.EvidenceSchema).default([]),
    confidence_score: zod_1.z.number().default(1.0),
    summary: zod_1.z.string().default(''),
});
//# sourceMappingURL=ai-result.dto.js.map