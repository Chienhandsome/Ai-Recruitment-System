"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const apps = await prisma.application.findMany({
        include: {
            candidate: true,
            job: true,
            aiMatchingResults: true,
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
    });
    for (const app of apps) {
        console.log(`\nApplication ID: ${app.id}`);
        console.log(`Candidate: ${app.candidate?.fullName}`);
        console.log(`Processing Status: ${app.processingStatus}`);
        console.log(`AI Matching Results Count: ${app.aiMatchingResults?.length}`);
        if (app.aiMatchingResults?.length > 0) {
            console.log(`Result: Score=${app.aiMatchingResults[0].overallScore}, MatchLevel=${app.aiMatchingResults[0].matchLevel}`);
        }
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check-apps.js.map