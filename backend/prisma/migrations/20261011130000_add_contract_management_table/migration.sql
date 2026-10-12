-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'SIGNED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PROBATION', 'FIXED_TERM', 'INDEFINITE');

-- CreateEnum
CREATE TYPE "ContractSigningMethod" AS ENUM ('MANUAL', 'ELECTRONIC');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contract_type" "ContractType" NOT NULL DEFAULT 'FIXED_TERM',
    "signing_method" "ContractSigningMethod" NOT NULL DEFAULT 'MANUAL',
    "job_title" TEXT NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "salary_period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "work_type" TEXT,
    "work_location" TEXT,
    "working_hours" TEXT,
    "probation_period_months" INTEGER,
    "probation_salary_rate" INTEGER DEFAULT 85,
    "benefits" TEXT,
    "custom_terms" TEXT,
    "contract_pdf_url" TEXT,
    "signed_pdf_url" TEXT,
    "candidate_signature_url" TEXT,
    "candidate_signed_at" TIMESTAMPTZ,
    "employer_signature_url" TEXT,
    "employer_signed_at" TIMESTAMPTZ,
    "latest_revision_note" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_histories" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by_user_id" UUID,
    "note" TEXT,
    "snapshot" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_application_id_key" ON "contracts"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_offer_id_key" ON "contracts"("offer_id");

-- CreateIndex
CREATE INDEX "contracts_application_id_idx" ON "contracts"("application_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contract_histories_contract_id_created_at_idx" ON "contract_histories"("contract_id", "created_at");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_histories" ADD CONSTRAINT "contract_histories_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
