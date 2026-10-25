import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    include: {
      candidate: true,
      job: true,
      aiMatchingResults: true,
    },
  });

  console.log(`Checking ${apps.length} total applications in database...`);
  for (const a of apps) {
    for (const r of a.aiMatchingResults) {
      const ev = JSON.stringify(r.evidence || '');
      if (ev.includes('backend_runtimes') || ev.includes('Zola') || ev.includes('.NET')) {
        console.log(`\n>>> MATCH FOUND!`);
        console.log(`Application ID: ${a.id}`);
        console.log(`Candidate: ${a.candidate?.fullName}`);
        console.log(`Job Title: ${a.job?.title}`);
        console.log(`Recruiter ID: ${a.job?.recruiterId}`);
        console.log(`Evidence Sample: ${ev.substring(0, 300)}...`);
      }
    }
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
