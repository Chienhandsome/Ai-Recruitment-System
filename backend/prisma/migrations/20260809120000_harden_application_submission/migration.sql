-- Persist AI-evaluation delivery state so failed or stuck application jobs can
-- be retried safely across process restarts and multiple backend instances.
ALTER TABLE "applications"
  ADD COLUMN "evaluation_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "next_evaluation_retry_at" TIMESTAMP(3),
  ADD COLUMN "evaluation_error" TEXT;

CREATE INDEX "applications_processing_status_next_evaluation_retry_at_idx"
  ON "applications"("processing_status", "next_evaluation_retry_at");
