import { z } from 'zod';
export declare const SkillInfoSchema: z.ZodObject<{
    name: z.ZodString;
    isMandatory: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const EvidenceSchema: z.ZodObject<{
    skillName: z.ZodString;
    evidenceText: z.ZodString;
    source: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const AiResultSchema: z.ZodObject<{
    overall_score: z.ZodDefault<z.ZodNumber>;
    match_level: z.ZodDefault<z.ZodEnum<{
        HIGH: "HIGH";
        MEDIUM: "MEDIUM";
        LOW: "LOW";
        EXCELLENT: "EXCELLENT";
        GOOD: "GOOD";
        FAIR: "FAIR";
        POOR: "POOR";
    }>>;
    skills_score: z.ZodDefault<z.ZodNumber>;
    experience_score: z.ZodDefault<z.ZodNumber>;
    education_score: z.ZodDefault<z.ZodNumber>;
    other_score: z.ZodDefault<z.ZodNumber>;
    strengths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    gaps: z.ZodDefault<z.ZodArray<z.ZodString>>;
    matched_skills: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        isMandatory: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    missing_skills: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        isMandatory: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    missing_required_skills: z.ZodDefault<z.ZodArray<z.ZodString>>;
    evidence: z.ZodDefault<z.ZodArray<z.ZodObject<{
        skillName: z.ZodString;
        evidenceText: z.ZodString;
        source: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>>;
    confidence_score: z.ZodDefault<z.ZodNumber>;
    summary: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type AiResultDto = z.infer<typeof AiResultSchema>;
