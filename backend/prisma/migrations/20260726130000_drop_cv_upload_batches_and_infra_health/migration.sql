-- DropForeignKey
ALTER TABLE "cv_upload_batches" DROP CONSTRAINT IF EXISTS "cv_upload_batches_job_id_fkey";

-- DropForeignKey (Application -> CvUploadBatch)
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_upload_batch_id_fkey";

-- AlterTable: Remove upload_batch_id column from applications
ALTER TABLE "applications" DROP COLUMN IF EXISTS "upload_batch_id";

-- DropTable
DROP TABLE IF EXISTS "cv_upload_batches";

-- DropTable
DROP TABLE IF EXISTS "infrastructure_health_records";

-- DropEnum (BatchStatus is no longer used)
DROP TYPE IF EXISTS "BatchStatus";

-- DropEnumValue: Remove BATCH_IMPORT from ResumeSource
-- PostgreSQL does not support DROP VALUE from enum directly.
-- We recreate the enum without BATCH_IMPORT.
ALTER TYPE "ResumeSource" RENAME TO "ResumeSource_old";
CREATE TYPE "ResumeSource" AS ENUM ('CANDIDATE_UPLOAD', 'HR_UPLOAD', 'SYSTEM');
ALTER TABLE "resumes" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "resumes" ALTER COLUMN "source" TYPE "ResumeSource" USING ("source"::text::"ResumeSource");
ALTER TABLE "resumes" ALTER COLUMN "source" SET DEFAULT 'CANDIDATE_UPLOAD';
DROP TYPE "ResumeSource_old";
