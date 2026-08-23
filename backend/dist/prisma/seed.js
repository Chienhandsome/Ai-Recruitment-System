"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const seed_skill_catalog_1 = require("./seed-skill-catalog");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
    const roles = [
        { code: 'ADMIN', name: 'Administrator', description: 'System Administrator' },
        { code: 'RECRUITER', name: 'Recruiter', description: 'HR / Recruitment Staff' },
        { code: 'CANDIDATE', name: 'Candidate', description: 'Job Applicant' },
    ];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { code: role.code },
            update: {},
            create: role,
        });
    }
    console.log(`Seeded ${roles.length} roles.`);
    const company = await prisma.company.upsert({
        where: { code: 'ABC' },
        update: {},
        create: {
            name: 'Công ty ABC',
            code: 'ABC',
            website: 'https://abc.com',
            description: 'Công ty công nghệ hàng đầu',
        },
    });
    console.log(`Seeded company: ${company.name}`);
    const departments = [
        { code: 'HR', name: 'Human Resources', companyId: company.id, status: client_1.DepartmentStatus.ACTIVE },
        { code: 'IT', name: 'Information Technology', companyId: company.id, status: client_1.DepartmentStatus.ACTIVE },
        { code: 'MKT', name: 'Marketing', companyId: company.id, status: client_1.DepartmentStatus.ACTIVE },
        { code: 'SALES', name: 'Sales', companyId: company.id, status: client_1.DepartmentStatus.ACTIVE },
        { code: 'FIN', name: 'Finance', companyId: company.id, status: client_1.DepartmentStatus.ACTIVE },
    ];
    for (const dept of departments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: dept,
        });
    }
    console.log(`Seeded ${departments.length} departments.`);
    const skillSeedResult = await (0, seed_skill_catalog_1.seedSkillCatalog)(prisma);
    console.log(`Seeded ${skillSeedResult.categories} skill categories, ` +
        `${skillSeedResult.skills} skills and ${skillSeedResult.aliases} aliases.`);
    if (skillSeedResult.removedAmbiguousAliases > 0) {
        console.log(`Removed ${skillSeedResult.removedAmbiguousAliases} aliases that conflicted with canonical skill names.`);
    }
    if (skillSeedResult.deprecatedLegacySkills > 0) {
        console.log(`Migrated ${skillSeedResult.migratedCandidateSkillLinks} candidate links and ` +
            `${skillSeedResult.migratedJobSkillLinks} job links from ` +
            `${skillSeedResult.deprecatedLegacySkills} legacy composite skills.`);
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map