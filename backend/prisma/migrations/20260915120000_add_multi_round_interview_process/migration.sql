CREATE TYPE "InterviewProcessStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "InterviewRoundStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'IN_PROGRESS', 'AWAITING_REVIEW', 'PASSED', 'FAILED', 'CANCELLED', 'EXPIRED', 'NO_SHOW');
CREATE TYPE "InterviewConductedBy" AS ENUM ('HUMAN', 'AI');
CREATE TYPE "InterviewMode" AS ENUM ('IN_PERSON', 'VIDEO_CALL', 'ASYNC_WEB');
CREATE TYPE "InterviewPurpose" AS ENUM ('SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'CULTURE_FIT', 'FINAL', 'CUSTOM');

CREATE TABLE "interview_processes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" "InterviewProcessStatus" NOT NULL DEFAULT 'DRAFT',
    "current_round_order" INTEGER,
    "created_by_user_id" UUID,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_processes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview_rounds" (
    "id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "conducted_by" "InterviewConductedBy" NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "purpose" "InterviewPurpose" NOT NULL DEFAULT 'CUSTOM',
    "status" "InterviewRoundStatus" NOT NULL DEFAULT 'DRAFT',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_at" TIMESTAMPTZ,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "location_or_link" TEXT,
    "evaluation_criteria" JSONB,
    "result_score" DECIMAL(5,2),
    "decision_note" TEXT,
    "decided_by_user_id" UUID,
    "decided_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_rounds_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "interviews" ADD COLUMN "round_id" TEXT;
ALTER TABLE "ai_interview_sessions" ADD COLUMN "round_id" TEXT;

CREATE UNIQUE INDEX "interview_processes_application_id_key" ON "interview_processes"("application_id");
CREATE INDEX "interview_processes_status_updated_at_idx" ON "interview_processes"("status", "updated_at");
CREATE UNIQUE INDEX "interview_rounds_process_id_order_key" ON "interview_rounds"("process_id", "order");
CREATE INDEX "interview_rounds_process_id_status_idx" ON "interview_rounds"("process_id", "status");
CREATE INDEX "interviews_round_id_idx" ON "interviews"("round_id");
CREATE INDEX "ai_interview_sessions_round_id_idx" ON "ai_interview_sessions"("round_id");

ALTER TABLE "interview_processes" ADD CONSTRAINT "interview_processes_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_process_id_fkey"
FOREIGN KEY ("process_id") REFERENCES "interview_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_round_id_fkey"
FOREIGN KEY ("round_id") REFERENCES "interview_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_interview_sessions" ADD CONSTRAINT "ai_interview_sessions_round_id_fkey"
FOREIGN KEY ("round_id") REFERENCES "interview_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
