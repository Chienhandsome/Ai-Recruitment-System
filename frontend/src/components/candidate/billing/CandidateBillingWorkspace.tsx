"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Sparkles, Crown } from "lucide-react";
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
    amountVnd: number;
    status: string;
    createdAt: string;
    order: { orderCode: string; package: { name: string } };
  }>;
};

function featuresOf(pkg: ServicePackage) {
  const items = [
    "Tìm kiếm và xem việc làm",
    "Tạo CV cơ bản",
    "Ứng tuyển công việc",
  ];
  if (pkg.jdFitAnalysis) {
    items.push(`AI phân tích CV–JD (${pkg.jdFitQuota ?? 0} lượt)`);
  }
  if (pkg.cvImproveSuggestions) {
    items.push("Gợi ý cải thiện CV theo JD");
  }
  if (pkg.aiMockInterview) {
    items.push(`Mock interview AI (${pkg.mockInterviewQuota ?? 0} lượt)`);
  }
  return items;
}

export function CandidateBillingWorkspace({
  token,
  packages,
  entitlement,
  orders,
  transactions,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder),
    [packages],
  );

  const buy = async (code: "CANDIDATE_PRO" | "CANDIDATE_PREMIUM") => {
    if (!token) return;
    setBusy(code);
    setError(null);
    try {
      const order = await createPackageOrder(token, code);
      const session = await checkoutOrder(token, order.id, "/candidate/billing");
      router.push(
        `/candidate/billing/checkout?orderId=${order.id}&session=${session.providerSessionId}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được đơn.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Gói dịch vụ ứng viên
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        AI chỉ hỗ trợ phân tích và luyện phỏng vấn. Không cam kết được tuyển
        hay đậu phỏng vấn. Tìm việc và ứng tuyển cơ bản luôn miễn phí.
      </p>

      {entitlement && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Gói hiện tại
          </p>
          <h2 className="mt-1 text-xl font-semibold">{entitlement.packageName}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {entitlement.endsAt
              ? `Hết hạn ${new Date(entitlement.endsAt).toLocaleDateString("vi-VN")}`
              : "Free — không thời hạn"}
            {entitlement.jdFitAnalysis
              ? ` · JD-fit còn ${entitlement.jdFitRemaining ?? 0}`
              : ""}
            {entitlement.aiMockInterview
              ? ` · Mock còn ${entitlement.mockInterviewRemaining ?? 0}`
              : ""}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {sorted.map((pkg) => {
          const payable =
            pkg.code === "CANDIDATE_PRO" || pkg.code === "CANDIDATE_PREMIUM";
          const current = entitlement?.packageCode === pkg.code;
          return (
            <div
              key={pkg.id}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                pkg.code === "CANDIDATE_PREMIUM"
                  ? "border-slate-900"
                  : "border-slate-200"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{pkg.name}</h3>
                {pkg.code === "CANDIDATE_PREMIUM" ? (
                  <Crown className="h-5 w-5 text-amber-500" />
                ) : pkg.code === "CANDIDATE_PRO" ? (
                  <Sparkles className="h-5 w-5 text-sky-500" />
                ) : null}
              </div>
              <p className="text-2xl font-bold">
                {pkg.priceVnd === 0 ? "Miễn phí" : formatVnd(pkg.priceVnd)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {pkg.durationDays ? `${pkg.durationDays} ngày` : "Mặc định"}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {featuresOf(pkg).map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              {payable ? (
                <button
                  type="button"
                  disabled={current || busy === pkg.code}
                  onClick={() =>
                    void buy(pkg.code as "CANDIDATE_PRO" | "CANDIDATE_PREMIUM")
                  }
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {current
                    ? "Đang dùng"
                    : busy === pkg.code
                      ? "Đang tạo..."
                      : "Chọn gói"}
                </button>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 py-2.5 text-center text-sm text-slate-600">
                  Fallback mặc định
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Lịch sử đơn hàng</h3>
          <div className="mt-3 space-y-2">
            {orders.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có đơn.</p>
            )}
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex justify-between">
                  <span>{o.package.name}</span>
                  <span>{formatVnd(o.amountVnd)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {o.orderCode} · {o.status}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Lịch sử giao dịch</h3>
          <div className="mt-3 space-y-2">
            {transactions.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có giao dịch.</p>
            )}
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex justify-between">
                  <span>{tx.order.package.name}</span>
                  <span>{formatVnd(tx.amountVnd)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {tx.status} · {new Date(tx.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/candidate" className="text-blue-600 hover:underline">
          ← Về trang việc làm
        </Link>
      </p>
    </div>
  );
}
