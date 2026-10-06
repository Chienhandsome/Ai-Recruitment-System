-- AlterEnum
ALTER TYPE "JobCloseReason" ADD VALUE 'APPLICANT_CAP_REACHED';

-- AlterTable
ALTER TABLE "service_packages"
ADD COLUMN "monthly_job_create_limit" INTEGER,
ADD COLUMN "max_applicants_per_job" INTEGER;

-- AlterTable
ALTER TABLE "package_entitlements"
ADD COLUMN "monthly_job_create_limit" INTEGER,
ADD COLUMN "max_applicants_per_job" INTEGER;
