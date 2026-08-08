"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const midApp = await prisma.application.findFirst({
        where: {
            candidate: {
                email: 'fe.mid@example.com',
            },
        },
        include: {
            candidate: {
                include: {
                    candidateSkills: { include: { skill: true } },
                    workExperiences: true,
                    educations: true,
                    projects: true,
                },
            },
            job: {
                include: {
                    jobSkills: { include: { skill: true } },
                },
            },
            aiMatchingResults: true,
        },
    });
    console.log("Mid Candidate Application:", JSON.stringify(midApp, null, 2));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-mid.js.map