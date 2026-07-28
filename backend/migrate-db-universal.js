const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating Enums for Universal Architecture...');
    try {
      await prisma.$executeRawUnsafe(`CREATE TYPE "ProofType" AS ENUM ('PORTFOLIO', 'CODE_REPOSITORY', 'CASE_STUDY', 'SALES_RECORD', 'PUBLICATION', 'CERTIFICATE_DOC', 'OTHER');`);
    } catch (e) { console.log('ProofType enum might already exist'); }

    try {
      await prisma.$executeRawUnsafe(`CREATE TYPE "WorkingModel" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE', 'SHIFT');`);
    } catch (e) { console.log('WorkingModel enum might already exist'); }

    console.log('Creating job_categories table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "job_categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
      );
    `);
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "job_categories_name_key" ON "job_categories"("name");`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "job_categories_slug_key" ON "job_categories"("slug");`);
    } catch(e) {}

    console.log('Updating job_postings with category, workingModel, proof requirements...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "job_postings"
      ADD COLUMN IF NOT EXISTS "category_id" TEXT,
      ADD COLUMN IF NOT EXISTS "working_model" "WorkingModel" NOT NULL DEFAULT 'ON_SITE',
      ADD COLUMN IF NOT EXISTS "requires_proof_of_work" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "proof_of_work_type" "ProofType";
    `);

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch (e) {}

    console.log('Dropping unused screening and interview question tables...');
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "application_answers" CASCADE;`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "job_screening_questions" CASCADE;`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "interview_questions" CASCADE;`);
    } catch(e) { console.error('Error dropping question tables:', e); }

    console.log('Universal Multi-Industry Schema successfully applied!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
