-- AlterTable contracts
ALTER TABLE "contracts"
ADD COLUMN IF NOT EXISTS "pdf_sha256_hash" TEXT,
ADD COLUMN IF NOT EXISTS "candidate_signer_ip" TEXT,
ADD COLUMN IF NOT EXISTS "candidate_signer_user_agent" TEXT,
ADD COLUMN IF NOT EXISTS "candidate_otp_verified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "employer_signer_ip" TEXT,
ADD COLUMN IF NOT EXISTS "employer_signer_user_agent" TEXT,
ADD COLUMN IF NOT EXISTS "employer_otp_verified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "audit_certificate" JSONB;

-- CreateTable contract_signing_otps
CREATE TABLE IF NOT EXISTS "contract_signing_otps" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signing_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contract_signing_otps_contract_id_user_id_is_used_idx" ON "contract_signing_otps"("contract_id", "user_id", "is_used");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'contract_signing_otps_contract_id_fkey'
    ) THEN
        ALTER TABLE "contract_signing_otps"
        ADD CONSTRAINT "contract_signing_otps_contract_id_fkey"
        FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'contract_signing_otps_user_id_fkey'
    ) THEN
        ALTER TABLE "contract_signing_otps"
        ADD CONSTRAINT "contract_signing_otps_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
