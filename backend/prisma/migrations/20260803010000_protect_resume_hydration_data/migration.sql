-- Add the terminal state used when a newer CV supersedes an in-flight parse.
ALTER TYPE "ResumeParsingStatus" ADD VALUE 'SUPERSEDED';

-- Track provenance so automated hydration never removes user-entered data.
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'EXTRACTED');

ALTER TABLE "work_experiences"
  ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "resume_id" TEXT;

ALTER TABLE "educations"
  ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "resume_id" TEXT;

ALTER TABLE "projects"
  ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "resume_id" TEXT;

ALTER TABLE "certificates"
  ADD COLUMN "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "resume_id" TEXT;

CREATE INDEX "work_experiences_resume_id_idx" ON "work_experiences"("resume_id");
CREATE INDEX "educations_resume_id_idx" ON "educations"("resume_id");
CREATE INDEX "projects_resume_id_idx" ON "projects"("resume_id");
CREATE INDEX "certificates_resume_id_idx" ON "certificates"("resume_id");

ALTER TABLE "work_experiences"
  ADD CONSTRAINT "work_experiences_resume_id_fkey"
  FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "educations"
  ADD CONSTRAINT "educations_resume_id_fkey"
  FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_resume_id_fkey"
  FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_resume_id_fkey"
  FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
