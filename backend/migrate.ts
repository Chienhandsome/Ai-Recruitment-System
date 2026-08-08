import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE ai_matching_results 
      ADD COLUMN IF NOT EXISTS evidence JSONB,
      ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3, 2);
    `);
    console.log("Successfully added evidence and confidence_score columns.");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
