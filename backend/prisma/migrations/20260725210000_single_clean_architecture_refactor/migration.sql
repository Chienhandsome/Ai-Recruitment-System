-- =============================================================================
-- REFACTORING MIGRATION: SINGLE CLEAN ARCHITECTURE CONVERGENCE
-- Database: PostgreSQL 14+ (Supabase)
-- Project: AI Recruitment System
-- =============================================================================

BEGIN;

-- 1. TARGET ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('HR', 'CAND', 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('REGISTERED', 'ACTIVE', 'SUSPENDED', 'LOCKED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkMode') THEN
    CREATE TYPE "WorkMode" AS ENUM ('ON_SITE', 'HYBRID', 'REMOTE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationStatus') THEN
    CREATE TYPE "ApplicationStatus" AS ENUM (
      'SUBMITTED', 'INTERVIEW_CONFIRMED', 'SCREENING', 'SHORTLISTED',
      'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AIProcessingStatus') THEN
    CREATE TYPE "AIProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Degree') THEN
    CREATE TYPE "Degree" AS ENUM ('BACHELOR', 'MASTER', 'DOCTORATE', 'ASSOCIATE', 'DIPLOMA', 'OTHER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SkillType') THEN
    CREATE TYPE "SkillType" AS ENUM ('HARD', 'SOFT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProficiencyLevel') THEN
    CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MatchLevel') THEN
    CREATE TYPE "MatchLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

-- 2. NEW ARCHITECTURE TABLES
CREATE TABLE IF NOT EXISTS "hr_profiles" (
  "hr_user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "company_name" TEXT,
  "company_logo_url" TEXT,
  "company_address" TEXT,
  "company_website" TEXT,
  "company_description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "work_experiences" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "candidate_profile_id" TEXT NOT NULL REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  "company_name" TEXT NOT NULL,
  "position_title" TEXT NOT NULL,
  "employment_type" "EmploymentType" DEFAULT 'FULL_TIME',
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "is_current" BOOLEAN DEFAULT FALSE,
  "description" TEXT,
  "achievements" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "educations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "candidate_profile_id" TEXT NOT NULL REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  "school_name" TEXT NOT NULL,
  "major" TEXT,
  "degree" "Degree",
  "gpa" DECIMAL(3,2),
  "start_date" DATE,
  "end_date" DATE,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "candidate_profile_id" TEXT NOT NULL REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  "project_name" TEXT NOT NULL,
  "project_role" TEXT,
  "description" TEXT,
  "technologies" JSONB,
  "project_url" TEXT,
  "start_date" DATE,
  "end_date" DATE,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "certificates" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "candidate_profile_id" TEXT NOT NULL REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  "certificate_name" TEXT NOT NULL,
  "issuing_organization" TEXT NOT NULL,
  "issue_date" DATE,
  "expiry_date" DATE,
  "credential_url" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ai_evaluations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "application_id" TEXT NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
  "overall_score" DECIMAL(5,2) NOT NULL,
  "match_level" "MatchLevel" NOT NULL DEFAULT 'LOW',
  "skills_score" DECIMAL(5,2),
  "experience_score" DECIMAL(5,2),
  "education_score" DECIMAL(5,2),
  "project_score" DECIMAL(5,2),
  "strengths" JSONB,
  "gaps" JSONB,
  "missing_required_skills" JSONB,
  "ai_summary" TEXT,
  "weights_snapshot" JSONB,
  "embedding_model" TEXT,
  "confidence_score" DECIMAL(5,2),
  "processing_time_ms" INTEGER,
  "model_version" TEXT,
  "processed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. PREPARE NEW COLUMNS
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" "Role" DEFAULT 'CAND',
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "user_status" "UserStatus" DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "birth_day" DATE;

ALTER TABLE "candidate_profiles"
  ADD COLUMN IF NOT EXISTS "candidate_user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "desired_title" TEXT,
  ADD COLUMN IF NOT EXISTS "professional_summary" TEXT,
  ADD COLUMN IF NOT EXISTS "github_url" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedin_url" TEXT,
  ADD COLUMN IF NOT EXISTS "portfolio_url" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT;

ALTER TABLE "job_postings"
  ADD COLUMN IF NOT EXISTS "hr_user_id" UUID REFERENCES "hr_profiles"("hr_user_id") ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS "salary_min" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "salary_max" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "ai_weights_config" JSONB,
  ADD COLUMN IF NOT EXISTS "work_mode" "WorkMode" DEFAULT 'HYBRID';

ALTER TABLE "job_postings"
  ALTER COLUMN "required_experience_years" TYPE DECIMAL(4,1) USING "required_experience_years"::DECIMAL(4,1);

ALTER TABLE "job_skills"
  ADD COLUMN IF NOT EXISTS "minimum_level" "ProficiencyLevel",
  ADD COLUMN IF NOT EXISTS "minimum_years" DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS "is_mandatory" BOOLEAN DEFAULT TRUE;

ALTER TABLE "skill_aliases"
  ADD COLUMN IF NOT EXISTS "alias" TEXT;

ALTER TABLE "candidate_skills"
  ADD COLUMN IF NOT EXISTS "candidate_profile_id" TEXT REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "years_of_experience" DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS "proficiency_level" "ProficiencyLevel" DEFAULT 'BEGINNER',
  ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN DEFAULT FALSE;

ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "candidate_profile_id" TEXT REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "profile_snapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "application_status" "ApplicationStatus" DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS "ai_processing_status" "AIProcessingStatus" DEFAULT 'PENDING';

ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "notification_type" "NotificationType" DEFAULT 'APPLICATION_STATUS_CHANGED',
  ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT FALSE;

-- 4. DATA MIGRATION
UPDATE "users"
SET "user_status" = CASE
    WHEN "status"::text = 'ACTIVE' THEN 'ACTIVE'::"UserStatus"
    WHEN "status"::text = 'SUSPENDED' THEN 'SUSPENDED'::"UserStatus"
    WHEN "status"::text = 'LOCKED' THEN 'LOCKED'::"UserStatus"
    ELSE 'ACTIVE'::"UserStatus"
  END
WHERE "user_status" IS NULL AND "status" IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recruiter_profiles') THEN
    INSERT INTO "hr_profiles" ("hr_user_id", "company_name", "company_logo_url", "company_address", "company_website", "company_description", "created_at", "updated_at")
    SELECT rp."user_id", c."name", c."logo_url", c."address", c."website", c."description", rp."created_at", rp."updated_at"
    FROM "recruiter_profiles" rp
    LEFT JOIN "companies" c ON rp."company_id" = c."id"
    ON CONFLICT ("hr_user_id") DO UPDATE SET
      "company_name" = EXCLUDED."company_name",
      "company_logo_url" = EXCLUDED."company_logo_url",
      "company_address" = EXCLUDED."company_address",
      "company_website" = EXCLUDED."company_website",
      "company_description" = EXCLUDED."company_description";
  END IF;
END $$;

UPDATE "candidate_profiles"
SET "candidate_user_id" = "user_id"
WHERE "candidate_user_id" IS NULL AND "user_id" IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'recruiter_id') THEN
    UPDATE "job_postings" jp
    SET "hr_user_id" = rp."user_id"
    FROM "recruiter_profiles" rp
    WHERE jp."recruiter_id" = rp."id" AND jp."hr_user_id" IS NULL;
  END IF;
END $$;

UPDATE "job_postings"
SET
  "salary_min" = COALESCE("salary_min", "min_salary"),
  "salary_max" = COALESCE("salary_max", "max_salary"),
  "ai_weights_config" = COALESCE("ai_weights_config", "scoring_weights");

UPDATE "job_skills"
SET
  "minimum_level" = COALESCE("minimum_level", "minimum_proficiency"),
  "minimum_years" = COALESCE("minimum_years", "min_years_experience"::DECIMAL(4,1)),
  "is_mandatory" = CASE WHEN "requirement_type"::text = 'MANDATORY' THEN TRUE ELSE FALSE END;

UPDATE "skill_aliases"
SET "alias" = "alias_name"
WHERE "alias" IS NULL AND "alias_name" IS NOT NULL;

UPDATE "candidate_skills"
SET
  "candidate_profile_id" = COALESCE("candidate_profile_id", "candidate_id"),
  "years_of_experience" = COALESCE("years_of_experience", "years_experience");

UPDATE "applications"
SET
  "candidate_profile_id" = COALESCE("candidate_profile_id", "candidate_id"),
  "application_status" = CASE
    WHEN "current_stage"::text = 'RECEIVED' THEN 'SUBMITTED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'INTERVIEW_SCHEDULED' THEN 'INTERVIEW_CONFIRMED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'SCREENING' THEN 'SCREENING'::"ApplicationStatus"
    WHEN "current_stage"::text = 'SHORTLISTED' THEN 'SHORTLISTED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'INTERVIEWED' THEN 'INTERVIEWED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'OFFERED' THEN 'OFFERED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'HIRED' THEN 'HIRED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'REJECTED' THEN 'REJECTED'::"ApplicationStatus"
    WHEN "current_stage"::text = 'WITHDRAWN' THEN 'WITHDRAWN'::"ApplicationStatus"
    ELSE 'SUBMITTED'::"ApplicationStatus"
  END,
  "ai_processing_status" = CASE
    WHEN "processing_status"::text = 'COMPLETED' THEN 'COMPLETED'::"AIProcessingStatus"
    WHEN "processing_status"::text = 'FAILED' THEN 'FAILED'::"AIProcessingStatus"
    WHEN "processing_status"::text = 'QUEUED' OR "processing_status"::text = 'PARSING' THEN 'PROCESSING'::"AIProcessingStatus"
    ELSE 'PENDING'::"AIProcessingStatus"
  END;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_matching_results') THEN
    INSERT INTO "ai_evaluations" (
      "application_id", "overall_score", "match_level", "skills_score", "experience_score",
      "education_score", "project_score", "strengths", "gaps", "missing_required_skills",
      "ai_summary", "weights_snapshot", "model_version", "processed_at", "created_at", "updated_at"
    )
    SELECT
      "application_id", "overall_score", "match_level", "skill_score", "experience_score",
      "education_score", "project_score", "strengths", "gaps", "missing_required_skills",
      "reasoning_summary", "input_snapshot", "model_version", "created_at", "created_at", "updated_at"
    FROM "ai_matching_results"
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

UPDATE "notifications"
SET
  "user_id" = COALESCE("user_id", "recipient_user_id"),
  "notification_type" = COALESCE("notification_type", "type"),
  "is_read" = CASE WHEN "status"::text = 'READ' THEN TRUE ELSE FALSE END;

-- 5. DROP OBSOLETE CONSTRAINTS & KEYS
ALTER TABLE "job_postings" DROP CONSTRAINT IF EXISTS "job_postings_recruiter_id_fkey";
ALTER TABLE "candidate_profiles" DROP CONSTRAINT IF EXISTS "candidate_profiles_user_id_fkey";
ALTER TABLE "candidate_skills" DROP CONSTRAINT IF EXISTS "candidate_skills_candidate_id_fkey";
ALTER TABLE "candidate_skills" DROP CONSTRAINT IF EXISTS "candidate_skills_resume_id_fkey";
ALTER TABLE "candidate_skills" DROP CONSTRAINT IF EXISTS "candidate_skills_pkey";
ALTER TABLE "job_skills" DROP CONSTRAINT IF EXISTS "job_skills_pkey";
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_candidate_id_fkey";
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_resume_id_fkey";
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_upload_batch_id_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_recipient_user_id_fkey";
ALTER TABLE "skill_aliases" DROP CONSTRAINT IF EXISTS "skill_aliases_alias_name_key";

-- 6. CLEAN CONSTRAINTS & COMPOSITE PRIMARY KEYS
ALTER TABLE "candidate_skills"
  ALTER COLUMN "candidate_profile_id" SET NOT NULL,
  ALTER COLUMN "skill_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidate_skills_pkey') THEN
    ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("candidate_profile_id", "skill_id");
  END IF;
END $$;

ALTER TABLE "job_skills"
  ALTER COLUMN "job_id" SET NOT NULL,
  ALTER COLUMN "skill_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_skills_pkey') THEN
    ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_pkey" PRIMARY KEY ("job_id", "skill_id");
  END IF;
END $$;

ALTER TABLE "skill_aliases"
  ALTER COLUMN "alias" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'skill_aliases_alias_key') AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'skill_aliases_alias_key') THEN
    ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_alias_key" UNIQUE ("alias");
  END IF;
END $$;

ALTER TABLE "applications"
  ALTER COLUMN "job_id" SET NOT NULL,
  ALTER COLUMN "candidate_profile_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_job_id_candidate_profile_id_key') AND NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'applications_job_id_candidate_profile_id_key') THEN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_candidate_profile_id_key" UNIQUE ("job_id", "candidate_profile_id");
  END IF;
END $$;

-- 7. DROP DUPLICATED / OBSOLETE COLUMNS
ALTER TABLE "users"
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "avatar_url",
  DROP COLUMN IF EXISTS "last_login_at";

ALTER TABLE "candidate_profiles"
  DROP COLUMN IF EXISTS "user_id";

ALTER TABLE "job_postings"
  DROP COLUMN IF EXISTS "recruiter_id",
  DROP COLUMN IF EXISTS "min_salary",
  DROP COLUMN IF EXISTS "max_salary",
  DROP COLUMN IF EXISTS "scoring_weights",
  DROP COLUMN IF EXISTS "experience_level";

ALTER TABLE "job_skills"
  DROP COLUMN IF EXISTS "id",
  DROP COLUMN IF EXISTS "requirement_type",
  DROP COLUMN IF EXISTS "minimum_proficiency",
  DROP COLUMN IF EXISTS "min_years_experience";

ALTER TABLE "candidate_skills"
  DROP COLUMN IF EXISTS "id",
  DROP COLUMN IF EXISTS "candidate_id",
  DROP COLUMN IF EXISTS "resume_id",
  DROP COLUMN IF EXISTS "years_experience",
  DROP COLUMN IF EXISTS "source";

ALTER TABLE "applications"
  DROP COLUMN IF EXISTS "candidate_id",
  DROP COLUMN IF EXISTS "resume_id",
  DROP COLUMN IF EXISTS "upload_batch_id",
  DROP COLUMN IF EXISTS "source",
  DROP COLUMN IF EXISTS "processing_status",
  DROP COLUMN IF EXISTS "current_stage",
  DROP COLUMN IF EXISTS "hr_decision",
  DROP COLUMN IF EXISTS "hr_notes";

ALTER TABLE "skill_aliases"
  DROP COLUMN IF EXISTS "alias_name";

ALTER TABLE "notifications"
  DROP COLUMN IF EXISTS "recipient_user_id",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "type",
  DROP COLUMN IF EXISTS "payload";

-- 8. DROP OBSOLETE TABLES
DROP TABLE IF EXISTS "recruiter_profiles" CASCADE;
DROP TABLE IF EXISTS "ai_matching_results" CASCADE;
DROP TABLE IF EXISTS "user_roles" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;

-- 9. DROP OBSOLETE ENUMS
DROP TYPE IF EXISTS "AccountStatus" CASCADE;
DROP TYPE IF EXISTS "ExperienceLevel" CASCADE;
DROP TYPE IF EXISTS "SkillRequirementType" CASCADE;
DROP TYPE IF EXISTS "SkillSource" CASCADE;
DROP TYPE IF EXISTS "ApplicationProcessingStatus" CASCADE;
DROP TYPE IF EXISTS "ApplicationStage" CASCADE;
DROP TYPE IF EXISTS "HrDecision" CASCADE;
DROP TYPE IF EXISTS "ApplicationSource" CASCADE;
DROP TYPE IF EXISTS "NotificationStatus" CASCADE;

-- 10. INDEXES
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "idx_job_postings_status" ON "job_postings" ("status");
CREATE INDEX IF NOT EXISTS "idx_job_postings_work_mode" ON "job_postings" ("work_mode");
CREATE INDEX IF NOT EXISTS "idx_candidate_profiles_user_id" ON "candidate_profiles" ("candidate_user_id");
CREATE INDEX IF NOT EXISTS "idx_applications_candidate_profile_id" ON "applications" ("candidate_profile_id");
CREATE INDEX IF NOT EXISTS "idx_applications_job_id" ON "applications" ("job_id");
CREATE INDEX IF NOT EXISTS "idx_applications_application_status" ON "applications" ("application_status");
CREATE INDEX IF NOT EXISTS "idx_applications_ai_processing_status" ON "applications" ("ai_processing_status");
CREATE INDEX IF NOT EXISTS "idx_ai_evaluations_processed_at" ON "ai_evaluations" ("processed_at");
CREATE INDEX IF NOT EXISTS "idx_skills_normalized_name" ON "skills" ("normalized_name");

COMMIT;
