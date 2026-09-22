import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Applying Performance Indexes to PostgreSQL ---');

  const statements = [
    {
      name: 'idx_resumes_candidate_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_resumes_candidate_id ON resumes(candidate_id);',
    },
    {
      name: 'idx_interviews_application_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);',
    },
    {
      name: 'idx_interviews_scheduled_at',
      sql: 'CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);',
    },
    {
      name: 'idx_skills_name',
      sql: 'CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);',
    },
    {
      name: 'idx_job_skills_skill_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_job_skills_skill_id ON job_skills(skill_id);',
    },
  ];

  for (const { name, sql } of statements) {
    try {
      console.log(`Applying: ${name}...`);
      await prisma.$executeRawUnsafe(sql);
      console.log(`✓ Applied: ${name}`);
    } catch (err) {
      console.error(`✗ Failed to apply ${name}:`, err);
    }
  }

  console.log('--- All Performance Indexes Applied Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
