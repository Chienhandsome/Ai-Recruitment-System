-- CreateEnum
CREATE TYPE "CandidateProfileStatus" AS ENUM ('EMPTY', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable: Add status column with default EMPTY
ALTER TABLE "candidate_profiles" ADD COLUMN "status" "CandidateProfileStatus" NOT NULL DEFAULT 'EMPTY';

-- AlterTable: Add primary_resume_id column (nullable, unique)
ALTER TABLE "candidate_profiles" ADD COLUMN "primary_resume_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_primary_resume_id_key" ON "candidate_profiles"("primary_resume_id");

-- CreateIndex
CREATE INDEX "candidate_profiles_status_idx" ON "candidate_profiles"("status");

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_primary_resume_id_fkey" FOREIGN KEY ("primary_resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
