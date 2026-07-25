-- Rename table hr_profiles to recruiter_profiles
ALTER TABLE "hr_profiles" RENAME TO "recruiter_profiles";

-- Rename column hr_user_id to recruiter_user_id in recruiter_profiles
ALTER TABLE "recruiter_profiles" RENAME COLUMN "hr_user_id" TO "recruiter_user_id";

-- Rename column hr_user_id to recruiter_user_id in job_postings
ALTER TABLE "job_postings" RENAME COLUMN "hr_user_id" TO "recruiter_user_id";

-- Rename index idx_job_postings_hr_user_id to idx_job_postings_recruiter_user_id
ALTER INDEX "idx_job_postings_hr_user_id" RENAME TO "idx_job_postings_recruiter_user_id";

-- Rename Enum value 'HR' to 'RECRUITER'
ALTER TYPE "Role" RENAME VALUE 'HR' TO 'RECRUITER';
