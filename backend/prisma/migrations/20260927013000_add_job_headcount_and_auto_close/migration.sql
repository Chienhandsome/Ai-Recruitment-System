-- CreateEnum
CREATE TYPE "JobCloseReason" AS ENUM ('QUOTA_REACHED', 'EXPIRED', 'MANUAL_HR');

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN "target_hires" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "auto_close_on_quota" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "close_reason" "JobCloseReason";
