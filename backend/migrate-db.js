const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding columns to job_postings...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "job_postings" 
      ADD COLUMN IF NOT EXISTS "auto_shortlist_threshold" DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS "auto_reject_threshold" DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS "reject_on_missing_mandatory" BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "skill_weight" DECIMAL(5,2) NOT NULL DEFAULT 40.0,
      ADD COLUMN IF NOT EXISTS "experience_weight" DECIMAL(5,2) NOT NULL DEFAULT 30.0,
      ADD COLUMN IF NOT EXISTS "education_weight" DECIMAL(5,2) NOT NULL DEFAULT 15.0,
      ADD COLUMN IF NOT EXISTS "other_weight" DECIMAL(5,2) NOT NULL DEFAULT 15.0;
    `);
    
    // Convert old scoring_weights if any, or drop it
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "job_postings" DROP COLUMN IF EXISTS "scoring_weights";`);
    } catch(e) {}

    console.log('Creating job_certificates table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "job_certificates" (
        "id" TEXT NOT NULL,
        "job_id" TEXT NOT NULL,
        "certificate_name" TEXT NOT NULL,
        "requirement_type" "SkillRequirementType" NOT NULL DEFAULT 'MANDATORY',
        CONSTRAINT "job_certificates_pkey" PRIMARY KEY ("id")
      );
    `);
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "job_certificates" ADD CONSTRAINT "job_certificates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch(e) {}
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "job_certificates_job_id_certificate_name_key" ON "job_certificates"("job_id", "certificate_name");
      `);
    } catch(e) {}

    console.log('Database schema updated successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
