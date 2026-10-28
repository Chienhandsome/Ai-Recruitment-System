-- AlterEnum
ALTER TYPE "DisputeStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

-- AlterTable
ALTER TABLE "disputes"
ADD COLUMN IF NOT EXISTS "candidate_acknowledged_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "candidate_acknowledge_note" TEXT,
ADD COLUMN IF NOT EXISTS "recruiter_acknowledged_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "recruiter_acknowledge_note" TEXT,
ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "closed_by_user_id" UUID;
