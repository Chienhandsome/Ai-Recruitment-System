"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const jobs = await prisma.jobPosting.findMany({
        include: {
            jobSkills: {
                include: {
                    skill: true,
                },
            },
        },
    });
    console.log("Found jobs:", JSON.stringify(jobs, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=inspect-jobs.js.map