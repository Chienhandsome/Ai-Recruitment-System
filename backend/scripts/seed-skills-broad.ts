import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedSkillCatalog } from '../prisma/seed-skill-catalog';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding canonical multi-industry skill catalog...');
  const result = await seedSkillCatalog(prisma);
  console.log(
    `Skill catalog ready: ${result.categories} categories, ` +
      `${result.skills} skills, ${result.aliases} aliases.`,
  );
  if (result.removedAmbiguousAliases > 0) {
    console.log(
      `Removed ${result.removedAmbiguousAliases} ambiguous legacy aliases.`,
    );
  }
  if (result.deprecatedLegacySkills > 0) {
    console.log(
      `Migrated ${result.migratedCandidateSkillLinks} candidate links and ` +
        `${result.migratedJobSkillLinks} job links from ` +
        `${result.deprecatedLegacySkills} legacy composite skills.`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Error seeding skill catalog:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
