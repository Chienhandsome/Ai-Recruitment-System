-- CreateEnum
CREATE TYPE "PackageAudience" AS ENUM ('EMPLOYER', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "PackageOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'MOMO', 'VNPAY');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "candidate_profiles" ADD COLUMN "is_profile_public" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "candidate_profiles_is_profile_public_status_idx" ON "candidate_profiles"("is_profile_public", "status");

-- CreateTable
CREATE TABLE "service_packages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audience" "PackageAudience" NOT NULL DEFAULT 'EMPLOYER',
    "price_vnd" INTEGER NOT NULL,
    "duration_days" INTEGER,
    "max_active_jobs" INTEGER,
    "cv_unlock_quota" INTEGER NOT NULL DEFAULT 0,
    "ai_ranking" BOOLEAN NOT NULL DEFAULT false,
    "advanced_filters" BOOLEAN NOT NULL DEFAULT false,
    "recruitment_stats" BOOLEAN NOT NULL DEFAULT false,
    "talent_pool_access" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_orders" (
    "id" TEXT NOT NULL,
    "order_code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "package_id" TEXT NOT NULL,
    "amount_vnd" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PackageOrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_provider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
    "provider_txn_id" TEXT,
    "amount_vnd" INTEGER NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "raw_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_entitlements" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" TEXT,
    "package_id" TEXT NOT NULL,
    "order_id" TEXT,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "max_active_jobs" INTEGER,
    "cv_unlock_remaining" INTEGER NOT NULL DEFAULT 0,
    "ai_ranking" BOOLEAN NOT NULL DEFAULT false,
    "advanced_filters" BOOLEAN NOT NULL DEFAULT false,
    "recruitment_stats" BOOLEAN NOT NULL DEFAULT false,
    "talent_pool_access" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_unlocks" (
    "id" TEXT NOT NULL,
    "entitlement_id" TEXT NOT NULL,
    "unlocked_by_user_id" UUID NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_packages_code_key" ON "service_packages"("code");

-- CreateIndex
CREATE INDEX "service_packages_audience_is_active_sort_order_idx" ON "service_packages"("audience", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "package_orders_order_code_key" ON "package_orders"("order_code");

-- CreateIndex
CREATE INDEX "package_orders_user_id_created_at_idx" ON "package_orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "package_orders_status_idx" ON "package_orders"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");

-- CreateIndex
CREATE INDEX "payment_transactions_provider_provider_txn_id_idx" ON "payment_transactions"("provider", "provider_txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "package_entitlements_order_id_key" ON "package_entitlements"("order_id");

-- CreateIndex
CREATE INDEX "package_entitlements_user_id_status_ends_at_idx" ON "package_entitlements"("user_id", "status", "ends_at");

-- CreateIndex
CREATE INDEX "package_entitlements_company_id_status_idx" ON "package_entitlements"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cv_unlocks_unlocked_by_user_id_candidate_profile_id_key" ON "cv_unlocks"("unlocked_by_user_id", "candidate_profile_id");

-- CreateIndex
CREATE INDEX "cv_unlocks_entitlement_id_idx" ON "cv_unlocks"("entitlement_id");

-- CreateIndex
CREATE INDEX "cv_unlocks_candidate_profile_id_idx" ON "cv_unlocks"("candidate_profile_id");

-- AddForeignKey
ALTER TABLE "package_orders" ADD CONSTRAINT "package_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_orders" ADD CONSTRAINT "package_orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "package_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_entitlements" ADD CONSTRAINT "package_entitlements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "package_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_unlocks" ADD CONSTRAINT "cv_unlocks_entitlement_id_fkey" FOREIGN KEY ("entitlement_id") REFERENCES "package_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_unlocks" ADD CONSTRAINT "cv_unlocks_unlocked_by_user_id_fkey" FOREIGN KEY ("unlocked_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_unlocks" ADD CONSTRAINT "cv_unlocks_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
