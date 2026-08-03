ALTER TYPE "CandidateProfileStatus" ADD VALUE 'NEEDS_REVIEW';

ALTER TABLE "resume_parsed_data"
  ADD COLUMN "total_years_experience_is_calculated" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "llm_model" TEXT,
  ADD COLUMN "prompt_version" TEXT,
  ADD COLUMN "parser_version" TEXT,
  ADD COLUMN "raw_text_hash" TEXT,
  ADD COLUMN "extraction_duration_ms" INTEGER,
  ADD COLUMN "overall_confidence" DECIMAL(3, 2);

ALTER TABLE "candidate_skills"
  ADD COLUMN "is_inferred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source_text" TEXT;

ALTER TABLE "work_experiences"
  ADD COLUMN "is_inferred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source_text" TEXT;

ALTER TABLE "educations"
  ADD COLUMN "is_inferred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source_text" TEXT;

ALTER TABLE "projects"
  ADD COLUMN "is_inferred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source_text" TEXT;

ALTER TABLE "certificates"
  ADD COLUMN "is_inferred" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "source_text" TEXT;

ALTER TABLE "unrecognized_skills"
  ADD COLUMN "normalized_name" TEXT,
  ADD COLUMN "category_hint" TEXT;

CREATE UNIQUE INDEX "unrecognized_skills_normalized_name_key"
  ON "unrecognized_skills"("normalized_name");
