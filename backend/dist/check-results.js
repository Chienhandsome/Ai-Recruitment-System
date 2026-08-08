"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const results = await prisma.aiMatchingResult.findMany({
        include: {
            application: {
                include: {
                    candidate: true,
                    job: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    console.log("\n📊 AI Matching Results in DB:");
    for (const r of results) {
        console.log(`------------------------------------------------`);
        console.log(`Candidate: ${r.application.candidate.fullName}`);
        console.log(`Job: ${r.application.job.title}`);
        console.log(`Overall Score: ${r.overallScore} | Match Level: ${r.matchLevel}`);
        console.log(`Breakdown: Skills=${r.skillScore}, Exp=${r.experienceScore}, Edu=${r.educationScore}, Proj=${r.projectScore}`);
        console.log(`Confidence Score: ${r.confidenceScore}`);
        console.log(`Evidence Count: ${Array.isArray(r.evidence) ? r.evidence.length : 0}`);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check-results.js.map