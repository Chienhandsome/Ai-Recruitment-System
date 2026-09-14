CREATE TYPE "AiInterviewStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED', 'EXPIRED');

CREATE TABLE "ai_interview_sessions" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "interview_service_id" TEXT NOT NULL,
    "status" "AiInterviewStatus" NOT NULL DEFAULT 'CREATED',
    "launch_url" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "termination_reason" TEXT,
    "config" JSONB NOT NULL,
    "transcript" JSONB,
    "videos" JSONB,
    "security_events" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_interview_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_interview_callback_events" (
    "id" UUID NOT NULL,
    "ai_interview_session_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_interview_callback_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_interview_sessions_interview_service_id_key"
ON "ai_interview_sessions"("interview_service_id");

CREATE INDEX "ai_interview_sessions_application_id_created_at_idx"
ON "ai_interview_sessions"("application_id", "created_at");

CREATE INDEX "ai_interview_sessions_status_expires_at_idx"
ON "ai_interview_sessions"("status", "expires_at");

CREATE INDEX "ai_interview_callback_events_ai_interview_session_id_received_at_idx"
ON "ai_interview_callback_events"("ai_interview_session_id", "received_at");

ALTER TABLE "ai_interview_sessions"
ADD CONSTRAINT "ai_interview_sessions_application_id_fkey"
FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_interview_callback_events"
ADD CONSTRAINT "ai_interview_callback_events_ai_interview_session_id_fkey"
FOREIGN KEY ("ai_interview_session_id") REFERENCES "ai_interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
