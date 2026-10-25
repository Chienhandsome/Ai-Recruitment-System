import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'xt030411@gmail.com';
  const applications = await prisma.application.findMany({
    where: {
      job: {
        recruiter: {
          user: {
            email: { equals: targetEmail, mode: 'insensitive' },
          },
        },
      },
    },
    include: {
      candidate: {
        include: {
          educations: true,
        },
      },
      resume: {
        select: {
          id: true,
          parsedData: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  console.log(`Checking education details for ${applications.length} applications:\n`);

  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    console.log(`[#${i + 1}] Cand: ${app.candidate.fullName} | Job: ${app.job.title}`);
    for (const e of app.candidate.educations) {
      console.log(`  * Degree: '${e.degree}', Major: '${e.major}', School: '${e.schoolName}', Desc: '${e.description}', SourceText: '${e.sourceText}'`);
    }
    const parsed = app.resume?.parsedData as any;
    if (parsed?.educationData) {
      console.log(`  * ParsedData.educationData:`, JSON.stringify(parsed.educationData));
    }
  }
}

main().finally(() => prisma.$disconnect());
