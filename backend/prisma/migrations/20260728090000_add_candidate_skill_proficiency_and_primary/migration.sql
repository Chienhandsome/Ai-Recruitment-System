-- AlterTable: Add is_primary to candidate_skills (proficiency_level already exists)
ALTER TABLE "candidate_skills"
  ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "candidate_skills_skill_id_idx"
  ON "candidate_skills"("skill_id");
