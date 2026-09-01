"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const results = await prisma.aiMatchingResult.findMany({
        where: {
            application: {
                job: {
                    jobCode: 'JOB-ASM-FMCG-2026',
                },
            },
        },
        include: {
            application: {
                include: {
                    candidate: true,
                    job: true,
                },
            },
        },
        orderBy: {
            overallScore: 'desc',
        },
    });
    const fs = require('fs');
    fs.writeFileSync('scratch_results.json', JSON.stringify(results, null, 2));
    console.log('TOTAL_RESULTS_COUNT:', results.length);
    for (const r of results) {
        console.log('----------------------------------------------------');
        console.log(`CANDIDATE: ${r.application.candidate.fullName} (${r.application.candidate.email})`);
        console.log(`SCORES: Overall=${r.overallScore}, Level=${r.matchLevel}, Skill=${r.skillScore}, Exp=${r.experienceScore}, Edu=${r.educationScore}, Other=${r.projectScore}`);
        console.log(`MISSING_REQUIRED:`, JSON.stringify(r.missingRequiredSkills));
        console.log(`MATCHED_SKILLS:`, JSON.stringify(r.matchedSkills?.map((m) => m.name)));
        console.log(`STRENGTHS:`, JSON.stringify(r.strengths));
        console.log(`GAPS:`, JSON.stringify(r.gaps));
        console.log(`SUMMARY:`, r.reasoningSummary);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=dump_test_results.js.map