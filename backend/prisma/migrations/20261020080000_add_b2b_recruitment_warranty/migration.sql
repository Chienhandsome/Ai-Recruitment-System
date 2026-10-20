-- CreateEnum
CREATE TYPE "WarrantyReason" AS ENUM ('NO_SHOW', 'EARLY_RESIGNATION');
CREATE TYPE "WarrantyCompensationType" AS ENUM ('CREDIT_REFUND', 'AI_REPLACEMENT');
CREATE TYPE "WarrantyClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable contracts
ALTER TABLE "contracts"
ADD COLUMN IF NOT EXISTS "is_warranty_claimed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable warranty_claims
CREATE TABLE IF NOT EXISTS "warranty_claims" (
    "id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "recruiter_user_id" UUID NOT NULL,
    "company_id" TEXT,
    "reason" "WarrantyReason" NOT NULL,
    "compensation_type" "WarrantyCompensationType" NOT NULL DEFAULT 'CREDIT_REFUND',
    "note" TEXT,
    "evidence_url" TEXT,
    "status" "WarrantyClaimStatus" NOT NULL DEFAULT 'APPROVED',
    "credit_refunded" INTEGER NOT NULL DEFAULT 1,
    "days_extended" INTEGER NOT NULL DEFAULT 30,
    "resolved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "warranty_claims_claim_number_key" ON "warranty_claims"("claim_number");
CREATE UNIQUE INDEX IF NOT EXISTS "warranty_claims_contract_id_key" ON "warranty_claims"("contract_id");
CREATE INDEX IF NOT EXISTS "warranty_claims_contract_id_idx" ON "warranty_claims"("contract_id");
CREATE INDEX IF NOT EXISTS "warranty_claims_recruiter_user_id_status_idx" ON "warranty_claims"("recruiter_user_id", "status");
CREATE INDEX IF NOT EXISTS "warranty_claims_company_id_idx" ON "warranty_claims"("company_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'warranty_claims_contract_id_fkey'
    ) THEN
        ALTER TABLE "warranty_claims"
        ADD CONSTRAINT "warranty_claims_contract_id_fkey"
        FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'warranty_claims_recruiter_user_id_fkey'
    ) THEN
        ALTER TABLE "warranty_claims"
        ADD CONSTRAINT "warranty_claims_recruiter_user_id_fkey"
        FOREIGN KEY ("recruiter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'warranty_claims_company_id_fkey'
    ) THEN
        ALTER TABLE "warranty_claims"
        ADD CONSTRAINT "warranty_claims_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
