ALTER TYPE "ApplicationSource" ADD VALUE IF NOT EXISTS 'TALENT_POOL_INVITE';
CREATE TYPE "TalentInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');
CREATE TABLE "talent_invitations" (
  "id" TEXT NOT NULL,
  "recruiter_user_id" UUID NOT NULL,
  "candidate_id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "application_id" TEXT,
  "message" TEXT,
  "status" "TalentInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "responded_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "talent_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "talent_invitations_recruiter_user_id_fkey" FOREIGN KEY ("recruiter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "talent_invitations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "talent_invitations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "talent_invitations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "talent_invitations_recruiter_user_id_created_at_idx" ON "talent_invitations"("recruiter_user_id", "created_at");
CREATE INDEX "talent_invitations_candidate_id_created_at_idx" ON "talent_invitations"("candidate_id", "created_at");
CREATE INDEX "talent_invitations_status_expires_at_idx" ON "talent_invitations"("status", "expires_at");
-- Prisma cannot express this partial unique index: only pending invitations conflict.
CREATE UNIQUE INDEX "talent_invitations_one_pending" ON "talent_invitations"("recruiter_user_id", "candidate_id", "job_id") WHERE "status" = 'PENDING';
ALTER TABLE "talent_invitations" ENABLE ROW LEVEL SECURITY;
