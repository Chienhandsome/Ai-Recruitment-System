"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const jobs = await prisma.jobCategory.findMany();
    const skills = await prisma.skillCategory.findMany();
    console.log('--- Job Categories ---');
    jobs.forEach(j => console.log(j.id, j.name));
    console.log('--- Skill Categories ---');
    skills.forEach(s => console.log(s.id, s.name));
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=check-db.js.map