BEGIN;

ALTER TABLE "service_packages"
ADD COLUMN "job_seeking_access" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "package_entitlements"
ADD COLUMN "job_seeking_access" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "candidate_profiles"
ADD COLUMN "job_seeking_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "job_seeking_confirmed_at" TIMESTAMP(3),
ADD COLUMN "job_seeking_until" TIMESTAMP(3),
ADD COLUMN "job_seeking_entitlement_id" TEXT;

ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_job_seeking_entitlement_id_fkey"
FOREIGN KEY ("job_seeking_entitlement_id") REFERENCES "package_entitlements"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "candidate_profiles_job_seeking_enabled_job_seeking_until_idx"
ON "candidate_profiles"("job_seeking_enabled", "job_seeking_until");

-- Add the benefit to paid candidate packages, including the short test plan.
UPDATE "service_packages" SET "job_seeking_access" = true
WHERE "audience" = 'CANDIDATE'
AND "code" IN ('CANDIDATE_TEST', 'CANDIDATE_PRO', 'CANDIDATE_PREMIUM');

UPDATE "package_entitlements" e SET "job_seeking_access" = true
FROM "service_packages" p
WHERE e."package_id" = p."id" AND p."job_seeking_access" = true
AND e."status" = 'ACTIVE' AND (e."ends_at" IS NULL OR e."ends_at" > CURRENT_TIMESTAMP);

-- Pending pre-release orders receive the new benefit without changing price or duration.
UPDATE "package_orders" o
SET "features_snapshot" = o."features_snapshot" || '{"jobSeekingAccess":true}'::jsonb
FROM "service_packages" p
WHERE o."package_id" = p."id" AND p."job_seeking_access" = true AND o."status" = 'PENDING';

-- Existing profiles stay hidden until the candidate explicitly opts in.
COMMIT;
