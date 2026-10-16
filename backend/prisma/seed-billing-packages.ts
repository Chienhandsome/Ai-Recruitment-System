import { PrismaClient } from '@prisma/client';
import { seedCandidatePackages } from './seed-candidate-packages';
import { seedEmployerPackages } from './seed-employer-packages';

async function main() {
  const prisma = new PrismaClient();
  try {
    const employer = await seedEmployerPackages(prisma);
    const candidate = await seedCandidatePackages(prisma);
    console.log(`Seeded employer=${employer}, candidate=${candidate}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
