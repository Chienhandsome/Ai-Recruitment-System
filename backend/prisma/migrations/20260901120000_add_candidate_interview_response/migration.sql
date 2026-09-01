-- CreateEnum
CREATE TYPE "CandidateResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'RESCHEDULE_REQUESTED', 'DECLINED');

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN "candidate_response" "CandidateResponseStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "interviews" ADD COLUMN "candidate_notes" TEXT;
ALTER TABLE "interviews" ADD COLUMN "proposed_slots" JSONB;
