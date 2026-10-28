-- AlterTable: Add reliability and sanction tracking to candidate_profiles
ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "reliability_score" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "strike_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "suspended_until" TIMESTAMPTZ;
ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "is_talent_pool_banned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add candidate penalty actions to disputes
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "candidate_penalty_action" TEXT;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "candidate_penalty_notes" TEXT;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "candidate_reliability_deduction" INTEGER;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "candidate_suspension_days" INTEGER;
