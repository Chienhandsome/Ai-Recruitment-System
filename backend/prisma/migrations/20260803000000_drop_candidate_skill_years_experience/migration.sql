-- Drop years_experience column from candidate_skills
-- This field was unreliable: LLM extraction was inconsistent (mostly null),
-- and self-declared values from candidates were not trustworthy.
-- Proficiency level (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT) is used instead.

ALTER TABLE "candidate_skills" DROP COLUMN IF EXISTS "years_experience";
