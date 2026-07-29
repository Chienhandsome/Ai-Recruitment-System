import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.jobCategory.findMany();
  const skills = await prisma.skillCategory.findMany();
  console.log('--- Job Categories ---');
  jobs.forEach(j => console.log(j.id, j.name));
  console.log('--- Skill Categories ---');
  skills.forEach(s => console.log(s.id, s.name));
}
main().finally(() => prisma.$disconnect());
