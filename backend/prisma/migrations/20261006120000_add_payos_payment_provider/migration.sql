-- PayOS was in Prisma schema but missing from PostgreSQL enum.
-- Without this, writing provider=PAYOS after payment confirmation fails.
DO $$ BEGIN
  ALTER TYPE "PaymentProvider" ADD VALUE 'PAYOS';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
