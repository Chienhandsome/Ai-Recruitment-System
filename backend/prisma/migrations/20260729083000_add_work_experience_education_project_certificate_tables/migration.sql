-- CreateTable
CREATE TABLE "work_experiences" (
    "id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "position_title" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "achievements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "major" TEXT,
    "degree" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_role" TEXT,
    "description" TEXT,
    "technologies" JSONB,
    "project_url" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "certificate_name" TEXT NOT NULL,
    "issuing_organization" TEXT NOT NULL,
    "issue_date" DATE,
    "expiry_date" DATE,
    "credential_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_experiences_candidate_profile_id_idx" ON "work_experiences"("candidate_profile_id");

-- CreateIndex
CREATE INDEX "educations_candidate_profile_id_idx" ON "educations"("candidate_profile_id");

-- CreateIndex
CREATE INDEX "projects_candidate_profile_id_idx" ON "projects"("candidate_profile_id");

-- CreateIndex
CREATE INDEX "certificates_candidate_profile_id_idx" ON "certificates"("candidate_profile_id");

-- AddForeignKey
ALTER TABLE "work_experiences" ADD CONSTRAINT "work_experiences_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
