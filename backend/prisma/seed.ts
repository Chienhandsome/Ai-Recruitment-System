import {
  PrismaClient,
  DepartmentStatus,
} from '@prisma/client';
import { seedSkillCatalog } from './seed-skill-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Roles
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

  // 2. Company
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

  // 3. Departments
  const departments = [
    { code: 'HR', name: 'Human Resources', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'IT', name: 'Information Technology', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'MKT', name: 'Marketing', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'SALES', name: 'Sales', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'FIN', name: 'Finance', companyId: company.id, status: DepartmentStatus.ACTIVE },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log(`Seeded ${departments.length} departments.`);

  // 4. Canonical multi-industry skills and aliases
  const skillSeedResult = await seedSkillCatalog(prisma);
  console.log(
    `Seeded ${skillSeedResult.categories} skill categories, ` +
      `${skillSeedResult.skills} skills and ${skillSeedResult.aliases} aliases.`,
  );
  if (skillSeedResult.removedAmbiguousAliases > 0) {
    console.log(
      `Removed ${skillSeedResult.removedAmbiguousAliases} aliases that conflicted with canonical skill names.`,
    );
  }
  if (skillSeedResult.deprecatedLegacySkills > 0) {
    console.log(
      `Migrated ${skillSeedResult.migratedCandidateSkillLinks} candidate links and ` +
        `${skillSeedResult.migratedJobSkillLinks} job links from ` +
        `${skillSeedResult.deprecatedLegacySkills} legacy composite skills.`,
    );
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
