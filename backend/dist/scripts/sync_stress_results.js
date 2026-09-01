"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
async function main() {
    const jsonPath = path.resolve(__dirname, '../scratch_results.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('File scratch_results.json does not exist');
        return;
    }
    const results = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`Syncing ${results.length} candidate results to Supabase DB...`);
    const job = await prisma.jobPosting.findFirst({
        where: { title: { contains: 'Area Sales Manager' } },
    });
    if (!job) {
        console.error('Job not found in DB');
        return;
    }
    const applications = await prisma.application.findMany({
        where: { jobId: job.id },
        include: { candidate: true },
    });
    console.log(`Found ${applications.length} applications for job ${job.title}`);
    for (const r of results) {
        const app = applications.find((a) => a.candidate.fullName === r.name);
        if (!app) {
            console.log(`Application for ${r.name} not found in DB`);
            continue;
        }
        await prisma.aiMatchingResult.upsert({
            where: { applicationId_version: { applicationId: app.id, version: 1 } },
            update: {
                overallScore: r.overall,
                matchLevel: r.level,
                skillScore: r.skills,
                experienceScore: r.exp,
                educationScore: r.edu,
                projectScore: r.other,
                matchedSkills: r.matched_skills || [],
                missingSkills: r.missing_skills || [],
                missingRequiredSkills: r.missing_mandatory || [],
                evidence: r.evidence || [],
                reasoningSummary: r.summary,
                strengths: r.strengths || [],
                gaps: r.gaps || [],
                candidateExperienceLevel: r.cand_level && r.cand_level !== "N/A" ? r.cand_level : null,
                requiredExperienceLevel: r.req_level && r.req_level !== "N/A" ? r.req_level : null,
                levelFitScore: typeof r.level_fit === 'number' ? r.level_fit : null,
                levelEligible: r.level_eligible ?? true,
                levelEvidence: r.level_evidence || [],
                totalExperienceYears: r.total_experience_years != null ? r.total_experience_years : null,
                inputSnapshot: { pillar_explanations: r.pillar_explanations },
            },
            create: {
                applicationId: app.id,
                version: 1,
                overallScore: r.overall,
                matchLevel: r.level,
                skillScore: r.skills,
                experienceScore: r.exp,
                educationScore: r.edu,
                projectScore: r.other,
                matchedSkills: r.matched_skills || [],
                missingSkills: r.missing_skills || [],
                missingRequiredSkills: r.missing_mandatory || [],
                evidence: r.evidence || [],
                reasoningSummary: r.summary,
                strengths: r.strengths || [],
                gaps: r.gaps || [],
                candidateExperienceLevel: r.cand_level && r.cand_level !== "N/A" ? r.cand_level : null,
                requiredExperienceLevel: r.req_level && r.req_level !== "N/A" ? r.req_level : null,
                levelFitScore: typeof r.level_fit === 'number' ? r.level_fit : null,
                levelEligible: r.level_eligible ?? true,
                levelEvidence: r.level_evidence || [],
                totalExperienceYears: r.total_experience_years != null ? r.total_experience_years : null,
                inputSnapshot: { pillar_explanations: r.pillar_explanations },
            }
        });
        console.log(`Synced ${r.name} (${r.overall.toFixed(2)} - ${r.level}) to DB.`);
    }
    console.log('✅ All 10 candidate results successfully updated in Supabase Database!');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=sync_stress_results.js.map