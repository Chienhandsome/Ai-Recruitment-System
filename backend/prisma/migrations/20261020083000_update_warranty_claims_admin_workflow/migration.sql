-- AlterTable warranty_claims to support Admin approval workflow & Candidate feedback
ALTER TABLE "warranty_claims"
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ALTER COLUMN "credit_refunded" SET DEFAULT 0,
  ALTER COLUMN "days_extended" SET DEFAULT 0,
  ALTER COLUMN "resolved_at" DROP DEFAULT,
  ALTER COLUMN "resolved_at" DROP NOT NULL;

ALTER TABLE "warranty_claims"
  ADD COLUMN IF NOT EXISTS "candidate_response" TEXT,
  ADD COLUMN IF NOT EXISTS "candidate_responded_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "admin_note" TEXT,
  ADD COLUMN IF NOT EXISTS "resolved_by_user_id" UUID;
