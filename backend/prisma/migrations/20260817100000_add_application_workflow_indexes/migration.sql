CREATE INDEX "applications_job_id_current_stage_applied_at_idx"
ON "applications"("job_id", "current_stage", "applied_at");

CREATE INDEX "applications_candidate_id_applied_at_idx"
ON "applications"("candidate_id", "applied_at");

CREATE INDEX "application_status_histories_application_id_created_at_idx"
ON "application_status_histories"("application_id", "created_at");
