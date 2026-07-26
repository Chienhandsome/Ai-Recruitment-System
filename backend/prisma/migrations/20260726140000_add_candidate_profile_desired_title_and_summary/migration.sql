-- AlterTable: Add desired_title and professional_summary columns to candidate_profiles
ALTER TABLE "candidate_profiles" ADD COLUMN "desired_title" TEXT;
ALTER TABLE "candidate_profiles" ADD COLUMN "professional_summary" TEXT;
