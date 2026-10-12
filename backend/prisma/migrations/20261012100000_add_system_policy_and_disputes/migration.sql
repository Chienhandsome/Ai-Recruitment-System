-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DisputeCategory" AS ENUM ('SALARY_MISMATCH', 'UNAUTHORIZED_FEE', 'UNFAIR_REVOCATION', 'CONTRACT_VIOLATION', 'HARASSMENT_OR_FRAUD', 'OTHER');

-- CreateTable
CREATE TABLE "system_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "dispute_number" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "reported_by_user_id" UUID NOT NULL,
    "category" "DisputeCategory" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" JSONB,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "admin_resolution" TEXT,
    "resolved_by_user_id" UUID,
    "resolved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_policies_code_key" ON "system_policies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_dispute_number_key" ON "disputes"("dispute_number");

-- CreateIndex
CREATE INDEX "disputes_application_id_idx" ON "disputes"("application_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_reported_by_user_id_idx" ON "disputes"("reported_by_user_id");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
