CREATE TYPE "LevelRequirementMode" AS ENUM ('ADVISORY', 'REQUIRED');

ALTER TABLE "job_postings"
ADD COLUMN "level_requirement_mode" "LevelRequirementMode" NOT NULL DEFAULT 'ADVISORY';

ALTER TABLE "ai_matching_results"
ADD COLUMN "candidate_experience_level" "ExperienceLevel",
ADD COLUMN "required_experience_level" "ExperienceLevel",
ADD COLUMN "total_experience_years" DECIMAL(5, 2),
ADD COLUMN "level_fit_score" DECIMAL(5, 2),
ADD COLUMN "level_gap" INTEGER,
ADD COLUMN "level_eligible" BOOLEAN,
ADD COLUMN "level_confidence" DECIMAL(3, 2),
ADD COLUMN "level_evidence" JSONB;
