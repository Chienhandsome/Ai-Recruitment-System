-- Align the application schema with the recruitment domain diagram while
-- preserving the production-oriented structures already in place.

-- Domain enums.
CREATE TYPE "SkillType" AS ENUM ('HARD', 'SOFT');
CREATE TYPE "ProficiencyLevel" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT'
);
CREATE TYPE "MatchLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- OPEN represents the same lifecycle state called PUBLISHED in the domain
-- diagram and API language.
ALTER TYPE "JobStatus" RENAME VALUE 'OPEN' TO 'PUBLISHED';

-- Users and organizations.
ALTER TABLE "users"
  ADD COLUMN "birth_day" DATE;

ALTER TABLE "companies"
  ADD COLUMN "address" TEXT;

ALTER TABLE "recruiter_profiles"
  ADD COLUMN "company_id" TEXT;

UPDATE "recruiter_profiles" AS recruiter
SET "company_id" = department."company_id"
FROM "departments" AS department
WHERE recruiter."department_id" = department."id";

ALTER TABLE "recruiter_profiles"
  ADD CONSTRAINT "recruiter_profiles_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "recruiter_profiles_company_id_idx"
  ON "recruiter_profiles"("company_id");

CREATE INDEX "recruiter_profiles_department_id_idx"
  ON "recruiter_profiles"("department_id");

-- Candidate is an application profile. Keep imported candidates possible by
-- retaining nullable user_id and the denormalized contact snapshot.
ALTER TABLE "candidates" RENAME TO "candidate_profiles";
ALTER TABLE "candidate_profiles"
  RENAME CONSTRAINT "candidates_pkey" TO "candidate_profiles_pkey";
ALTER TABLE "candidate_profiles"
  RENAME CONSTRAINT "candidates_user_id_fkey"
  TO "candidate_profiles_user_id_fkey";
ALTER INDEX "candidates_user_id_key"
  RENAME TO "candidate_profiles_user_id_key";
ALTER INDEX "candidates_email_idx"
  RENAME TO "candidate_profiles_email_idx";
ALTER INDEX "candidates_phone_idx"
  RENAME TO "candidate_profiles_phone_idx";

ALTER TABLE "candidate_profiles"
  ADD COLUMN "portfolio_url" TEXT;

-- Normalize skill categories and add the domain skill dimensions.
CREATE TABLE "skill_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "skill_categories_name_key"
  ON "skill_categories"("name");

INSERT INTO "skill_categories" (
  "id",
  "name",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  normalized_category.name,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT
    CASE
      WHEN "category" = 'Backend/AI' THEN 'AI & Data'
      WHEN "category" = 'Language' THEN 'Programming Language'
      ELSE COALESCE("category", 'Uncategorized')
    END AS name
  FROM "skills"
) AS normalized_category;

ALTER TABLE "skills"
  ADD COLUMN "category_id" TEXT,
  ADD COLUMN "type" "SkillType" NOT NULL DEFAULT 'HARD';

UPDATE "skills" AS skill
SET
  "category_id" = category."id",
  "type" = CASE
    WHEN category."name" = 'Soft Skill' THEN 'SOFT'::"SkillType"
    ELSE 'HARD'::"SkillType"
  END
FROM "skill_categories" AS category
WHERE category."name" = CASE
  WHEN skill."category" = 'Backend/AI' THEN 'AI & Data'
  WHEN skill."category" = 'Language' THEN 'Programming Language'
  ELSE COALESCE(skill."category", 'Uncategorized')
END;

ALTER TABLE "skills"
  ALTER COLUMN "category_id" SET NOT NULL,
  DROP COLUMN "category";

ALTER TABLE "skills"
  ADD CONSTRAINT "skills_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "skills_category_id_idx" ON "skills"("category_id");

ALTER TABLE "job_skills"
  ADD COLUMN "minimum_proficiency" "ProficiencyLevel";

ALTER TABLE "candidate_skills"
  DROP CONSTRAINT "candidate_skills_resume_id_fkey",
  ALTER COLUMN "resume_id" DROP NOT NULL,
  ADD COLUMN "proficiency_level" "ProficiencyLevel"
    NOT NULL DEFAULT 'BEGINNER';

DROP INDEX "candidate_skills_resume_id_skill_id_key";

ALTER TABLE "candidate_skills"
  ADD CONSTRAINT "candidate_skills_resume_id_fkey"
  FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "candidate_skills_candidate_id_skill_id_key"
  ON "candidate_skills"("candidate_id", "skill_id");

CREATE INDEX "candidate_skills_resume_id_idx"
  ON "candidate_skills"("resume_id");

-- Jobs are owned by a recruiter profile, with department remaining optional.
ALTER TABLE "job_postings"
  DROP CONSTRAINT "job_postings_department_id_fkey",
  ALTER COLUMN "department_id" DROP NOT NULL,
  ADD COLUMN "recruiter_id" TEXT,
  ADD COLUMN "required_experience_years" INTEGER,
  ADD COLUMN "scoring_weights" JSONB,
  ADD COLUMN "published_at" TIMESTAMP(3),
  ADD COLUMN "closed_at" TIMESTAMP(3);

ALTER TABLE "job_postings"
  ALTER COLUMN "recruiter_id" SET NOT NULL,
  ADD CONSTRAINT "job_postings_recruiter_id_fkey"
  FOREIGN KEY ("recruiter_id") REFERENCES "recruiter_profiles"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "job_postings_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "job_postings_recruiter_id_idx"
  ON "job_postings"("recruiter_id");

-- Applications keep the detailed workflow states while adding the immutable
-- profile snapshot shown in the domain diagram.
ALTER TABLE "applications"
  ADD COLUMN "profile_snapshot" JSONB;

CREATE UNIQUE INDEX "applications_job_id_candidate_id_key"
  ON "applications"("job_id", "candidate_id");

-- AI evaluation details.
ALTER TABLE "ai_matching_results"
  ADD COLUMN "match_level" "MatchLevel" NOT NULL DEFAULT 'LOW',
  ADD COLUMN "project_score" DECIMAL(5,2),
  ADD COLUMN "missing_required_skills" JSONB,
  ADD COLUMN "gaps" JSONB,
  ADD COLUMN "model_version" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make notification recipients a proper relation while allowing system-level
-- notifications to remain recipient-less.
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "notifications_recipient_user_id_status_idx"
  ON "notifications"("recipient_user_id", "status");

-- New tables should follow the same API-isolation policy as the rest of the
-- application schema.
ALTER TABLE "skill_categories" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE "skill_categories" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE "skill_categories" FROM authenticated;
