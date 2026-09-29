"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Crown,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  checkoutOrder,
  createPackageOrder,
  formatVnd,
  type EntitlementStatus,
  type PackageOrder,
  type ServicePackage,
} from "@/lib/billing-api";

type Props = {
  token: string;
  packages: ServicePackage[];
  entitlement: EntitlementStatus | null;
  orders: PackageOrder[];
  transactions: Array<{
    id: string;
    provider: string;
    providerTxnId: string | null;
    amountVnd: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
    order: {
      id: string;
      orderCode: string;
      status: string;
      package: { code: string; name: string };
    };
  }>;
};

function featureList(pkg: ServicePackage) {
  const items = [
    pkg.maxActiveJobs === null
      ? "Đăng nhiều tin tuyển dụng đang hoạt động"
      : `Tối đa ${pkg.maxActiveJobs} tin đang hoạt động`,
    "Xem danh sách CV ứng tuyển",
  ];
  if (pkg.aiRanking) items.push("AI xếp hạng CV theo JD (HR quyết định)");
  if (pkg.advancedFilters) items.push("Bộ lọc ứng viên nâng cao");
  if (pkg.recruitmentStats) items.push("Dashboard thống kê tuyển dụng");
  if (pkg.talentPoolAccess)
    items.push(`Kho CV công khai + ${pkg.cvUnlockQuota} lượt mở khóa`);
  return items;
}

export function BillingWorkspace({
  token,
  packages,
  entitlement,
  orders,
  transactions,
}: Props) {
  const router = useRouter();
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder),
    [packages],
  );

  const startCheckout = async (packageCode: "HR_PRO" | "HR_PREMIUM") => {
    if (!token) return;
    setBusyCode(packageCode);
    setError(null);
    try {
      const order = await createPackageOrder(token, packageCode);
      const session = await checkoutOrder(token, order.id);
      router.push(
        `/recruiter/billing/checkout?orderId=${order.id}&session=${session.providerSessionId}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo đơn hàng.");
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/recruiter/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" /> Về workspace HR
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">
              Gói dịch vụ nhà tuyển dụng
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              AI chỉ hỗ trợ xếp hạng và giải thích mức phù hợp. Quyết định tuyển
              dụng thuộc về bạn. Hệ thống không cam kết tuyển được người.
            </p>
          </div>
          <Link
            href="/recruiter/talent-pool"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Crown className="h-4 w-4" /> Kho CV Premium
          </Link>
        </div>

        {entitlement && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Gói hiện tại
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {entitlement.packageName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tin đang hoạt động: {entitlement.activeJobCount}
                  {entitlement.maxActiveJobs !== null
                    ? ` / ${entitlement.maxActiveJobs}`
                    : " (không giới hạn)"}
                  {entitlement.endsAt
                    ? ` · Hết hạn ${new Date(entitlement.endsAt).toLocaleDateString("vi-VN")}`
                    : " · Không thời hạn"}
                </p>
                {entitlement.talentPoolAccess && (
                  <p className="mt-1 text-sm text-slate-600">
                    Lượt mở khóa CV còn lại: {entitlement.cvUnlockRemaining}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {entitlement.aiRanking && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    AI ranking
                  </span>
                )}
                {entitlement.advancedFilters && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                    Lọc nâng cao
                  </span>
                )}
                {entitlement.recruitmentStats && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                    Dashboard
                  </span>
                )}
                {entitlement.talentPoolAccess && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    Talent pool
                  </span>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{entitlement.disclaimer}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {sorted.map((pkg) => {
            const isCurrent = entitlement?.packageCode === pkg.code;
            const payable = pkg.code === "HR_PRO" || pkg.code === "HR_PREMIUM";
            return (
              <div
                key={pkg.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                  pkg.code === "HR_PREMIUM"
                    ? "border-slate-900"
                    : "border-slate-200"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{pkg.name}</h3>
                  {pkg.code === "HR_PREMIUM" ? (
                    <Crown className="h-5 w-5 text-amber-500" />
                  ) : pkg.code === "HR_PRO" ? (
                    <Sparkles className="h-5 w-5 text-sky-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight">
                  {pkg.priceVnd === 0 ? "Miễn phí" : formatVnd(pkg.priceVnd)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {pkg.durationDays
                    ? `${pkg.durationDays} ngày`
                    : "Luôn sẵn sàng"}
                </p>
                <p className="mt-3 text-sm text-slate-600">{pkg.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {featureList(pkg).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                {payable ? (
                  <button
                    type="button"
                    disabled={isCurrent || busyCode === pkg.code}
                    onClick={() =>
                      startCheckout(pkg.code as "HR_PRO" | "HR_PREMIUM")
                    }
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CreditCard className="h-4 w-4" />
                    {isCurrent
                      ? "Đang dùng"
                      : busyCode === pkg.code
                        ? "Đang tạo đơn..."
                        : "Chọn gói & thanh toán"}
                  </button>
                ) : (
                  <div className="mt-5 rounded-xl bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-slate-600">
                    {isCurrent ? "Gói mặc định đang dùng" : "Kích hoạt tự động"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Lịch sử đơn hàng</h3>
            <div className="mt-4 space-y-3">
              {orders.length === 0 && (
                <p className="text-sm text-slate-500">Chưa có đơn hàng.</p>
              )}
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-slate-100 px-3 py-3 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{order.package.name}</span>
                    <span>{formatVnd(order.amountVnd)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.orderCode} · {order.status} ·{" "}
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Lịch sử giao dịch</h3>
            <div className="mt-4 space-y-3">
              {transactions.length === 0 && (
                <p className="text-sm text-slate-500">Chưa có giao dịch.</p>
              )}
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-100 px-3 py-3 text-sm"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {tx.order.package.name} ({tx.provider})
                    </span>
                    <span>{formatVnd(tx.amountVnd)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {tx.status}
                    {tx.providerTxnId ? ` · ${tx.providerTxnId}` : ""} ·{" "}
                    {new Date(tx.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
