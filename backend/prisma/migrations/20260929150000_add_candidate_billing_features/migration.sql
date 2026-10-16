-- AlterTable service_packages: candidate feature flags
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "jd_fit_analysis" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "cv_improve_suggestions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "jd_fit_quota" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "ai_mock_interview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "mock_interview_quota" INTEGER NOT NULL DEFAULT 0;

-- AlterTable package_orders: snapshots
ALTER TABLE "package_orders" ADD COLUMN IF NOT EXISTS "package_code_snapshot" TEXT;
ALTER TABLE "package_orders" ADD COLUMN IF NOT EXISTS "duration_days_snapshot" INTEGER;
ALTER TABLE "package_orders" ADD COLUMN IF NOT EXISTS "features_snapshot" JSONB;

UPDATE "package_orders"
SET
  "package_code_snapshot" = COALESCE("package_code_snapshot", 'UNKNOWN'),
  "features_snapshot" = COALESCE("features_snapshot", '{}'::jsonb)
WHERE "package_code_snapshot" IS NULL OR "features_snapshot" IS NULL;

ALTER TABLE "package_orders" ALTER COLUMN "package_code_snapshot" SET NOT NULL;
ALTER TABLE "package_orders" ALTER COLUMN "features_snapshot" SET NOT NULL;

-- AlterTable package_entitlements: candidate quotas
ALTER TABLE "package_entitlements" ADD COLUMN IF NOT EXISTS "jd_fit_analysis" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "package_entitlements" ADD COLUMN IF NOT EXISTS "cv_improve_suggestions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "package_entitlements" ADD COLUMN IF NOT EXISTS "jd_fit_remaining" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "package_entitlements" ADD COLUMN IF NOT EXISTS "ai_mock_interview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "package_entitlements" ADD COLUMN IF NOT EXISTS "mock_interview_remaining" INTEGER NOT NULL DEFAULT 0;

-- CreateTable package_usage_logs
CREATE TABLE IF NOT EXISTS "package_usage_logs" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "entitlement_id" TEXT NOT NULL,
    "feature_code" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONSUMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "package_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "package_usage_logs_user_id_request_id_key" ON "package_usage_logs"("user_id", "request_id");
CREATE INDEX IF NOT EXISTS "package_usage_logs_entitlement_id_feature_code_created_at_idx" ON "package_usage_logs"("entitlement_id", "feature_code", "created_at");
CREATE INDEX IF NOT EXISTS "package_usage_logs_user_id_feature_code_created_at_idx" ON "package_usage_logs"("user_id", "feature_code", "created_at");

ALTER TABLE "package_usage_logs" DROP CONSTRAINT IF EXISTS "package_usage_logs_user_id_fkey";
ALTER TABLE "package_usage_logs" ADD CONSTRAINT "package_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "package_usage_logs" DROP CONSTRAINT IF EXISTS "package_usage_logs_entitlement_id_fkey";
ALTER TABLE "package_usage_logs" ADD CONSTRAINT "package_usage_logs_entitlement_id_fkey" FOREIGN KEY ("entitlement_id") REFERENCES "package_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable candidate_jd_fit_analyses
CREATE TABLE IF NOT EXISTS "candidate_jd_fit_analyses" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "entitlement_id" TEXT,
    "job_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "overall_score" DECIMAL(5,2) NOT NULL,
    "match_level" "MatchLevel",
    "analysis" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "candidate_jd_fit_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "candidate_jd_fit_analyses_request_id_key" ON "candidate_jd_fit_analyses"("request_id");
CREATE INDEX IF NOT EXISTS "candidate_jd_fit_analyses_user_id_created_at_idx" ON "candidate_jd_fit_analyses"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "candidate_jd_fit_analyses_job_id_user_id_idx" ON "candidate_jd_fit_analyses"("job_id", "user_id");

ALTER TABLE "candidate_jd_fit_analyses" DROP CONSTRAINT IF EXISTS "candidate_jd_fit_analyses_user_id_fkey";
ALTER TABLE "candidate_jd_fit_analyses" ADD CONSTRAINT "candidate_jd_fit_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_jd_fit_analyses" DROP CONSTRAINT IF EXISTS "candidate_jd_fit_analyses_entitlement_id_fkey";
ALTER TABLE "candidate_jd_fit_analyses" ADD CONSTRAINT "candidate_jd_fit_analyses_entitlement_id_fkey" FOREIGN KEY ("entitlement_id") REFERENCES "package_entitlements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "candidate_jd_fit_analyses" DROP CONSTRAINT IF EXISTS "candidate_jd_fit_analyses_job_id_fkey";
ALTER TABLE "candidate_jd_fit_analyses" ADD CONSTRAINT "candidate_jd_fit_analyses_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_jd_fit_analyses" DROP CONSTRAINT IF EXISTS "candidate_jd_fit_analyses_resume_id_fkey";
ALTER TABLE "candidate_jd_fit_analyses" ADD CONSTRAINT "candidate_jd_fit_analyses_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
