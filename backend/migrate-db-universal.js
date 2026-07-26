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

    console.log('Creating job_screening_questions table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "job_screening_questions" (
        "id" TEXT NOT NULL,
        "job_id" TEXT NOT NULL,
        "question_text" TEXT NOT NULL,
        "is_required" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "job_screening_questions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "job_screening_questions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Updating candidate_profiles with expected salary and preferred model...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "candidate_profiles"
      ADD COLUMN IF NOT EXISTS "expected_min_salary" DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS "expected_max_salary" DECIMAL(12,2),
      ADD COLUMN IF NOT EXISTS "preferred_model" "WorkingModel";
    `);

    console.log('Creating candidate_proofs table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "candidate_proofs" (
        "id" TEXT NOT NULL,
        "candidate_id" TEXT NOT NULL,
        "proof_type" "ProofType" NOT NULL DEFAULT 'PORTFOLIO',
        "title" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "candidate_proofs_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "candidate_proofs_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Creating application_answers table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "application_answers" (
        "id" TEXT NOT NULL,
        "application_id" TEXT NOT NULL,
        "question_id" TEXT NOT NULL,
        "answer_text" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "application_answers_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "application_answers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "application_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "job_screening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Universal Multi-Industry Schema successfully applied!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
