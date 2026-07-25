-- =============================================================================
-- MIGRATION SCRIPT: AI RECRUITMENT SYSTEM SUPABASE POSTGRESQL SCHEMA ALIGNMENT
-- Production-Safe, Data-Preserving, Idempotent Database Migration
-- Target OS/DB: PostgreSQL 14+ (Supabase)
-- =============================================================================

BEGIN;

-- 1. ENUMS
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

-- 2. USERS
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "role" "Role" DEFAULT 'CAND',
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "user_status" "UserStatus" DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "birth_day" DATE,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. HR_PROFILE
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

-- 4. CANDIDATE_PROFILES
ALTER TABLE "candidate_profiles"
  ADD COLUMN IF NOT EXISTS "candidate_user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "desired_title" TEXT,
  ADD COLUMN IF NOT EXISTS "professional_summary" TEXT,
  ADD COLUMN IF NOT EXISTS "github_url" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedin_url" TEXT,
  ADD COLUMN IF NOT EXISTS "portfolio_url" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 5. SKILLS & SKILL_ALIASES
ALTER TABLE "skills"
  ADD COLUMN IF NOT EXISTS "normalized_name" TEXT,
  ADD COLUMN IF NOT EXISTS "category_id" TEXT REFERENCES "skill_categories"("id") ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS "type" "SkillType" DEFAULT 'HARD';

CREATE TABLE IF NOT EXISTS "skill_aliases" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "skill_id" TEXT NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "alias_name" TEXT NOT NULL UNIQUE,
  "alias" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "skill_aliases" ADD COLUMN IF NOT EXISTS "alias" TEXT;

-- 6. CANDIDATE_SKILLS
ALTER TABLE "candidate_skills"
  ADD COLUMN IF NOT EXISTS "candidate_profile_id" TEXT REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "years_of_experience" DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS "proficiency_level" "ProficiencyLevel" DEFAULT 'BEGINNER',
  ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN DEFAULT FALSE;

-- 7. WORK_EXPERIENCES
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

-- 8. EDUCATIONS
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

-- 9. PROJECTS
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

-- 10. CERTIFICATES
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

-- 11. JOBS (JOB_POSTINGS)
ALTER TABLE "job_postings"
  ADD COLUMN IF NOT EXISTS "salary_min" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "salary_max" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "ai_weights_config" JSONB,
  ADD COLUMN IF NOT EXISTS "work_mode" "WorkMode" DEFAULT 'HYBRID';

ALTER TABLE "job_postings"
  ALTER COLUMN "required_experience_years" TYPE DECIMAL(4,1) USING "required_experience_years"::DECIMAL(4,1);

-- 12. JOB_REQUIRED_SKILLS
ALTER TABLE "job_skills"
  ADD COLUMN IF NOT EXISTS "minimum_level" "ProficiencyLevel",
  ADD COLUMN IF NOT EXISTS "minimum_years" DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS "is_mandatory" BOOLEAN DEFAULT TRUE;

-- 13. APPLICATIONS
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "candidate_profile_id" TEXT REFERENCES "candidate_profiles"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "profile_snapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "application_status" "ApplicationStatus" DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS "ai_processing_status" "AIProcessingStatus" DEFAULT 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_job_id_candidate_profile_id_key'
  ) THEN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_candidate_profile_id_key" UNIQUE ("job_id", "candidate_profile_id");
  END IF;
END $$;

-- 14. AI_EVALUATIONS (1-TO-N)
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

-- 15. NOTIFICATIONS
ALTER TABLE "notifications"
  ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "notification_type" "NotificationType" DEFAULT 'APPLICATION_STATUS_CHANGED',
  ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT FALSE;

-- 16. INDEXES
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
