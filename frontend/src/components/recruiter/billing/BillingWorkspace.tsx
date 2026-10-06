"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Info,
  Lock,
  Sparkles,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import {
  checkOrderStatus,
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
  const items: string[] = [];
  if (pkg.monthlyJobCreateLimit != null) {
    items.push(`Tạo tối đa ${pkg.monthlyJobCreateLimit} tin / tháng`);
  } else if (pkg.code !== "HR_FREE") {
    items.push("Tạo tin tuyển dụng không giới hạn");
  }
  if (pkg.maxApplicantsPerJob != null) {
    items.push(
      `Tối đa ${pkg.maxApplicantsPerJob} ứng viên / tin (đủ thì ẩn với ứng viên)`,
    );
  } else if (pkg.code !== "HR_FREE") {
    items.push("Không giới hạn ứng viên mỗi tin");
  }
  items.push("Xem danh sách CV ứng tuyển & ATS cơ bản");
  if (pkg.aiRanking) items.push("AI matching / xếp hạng CV theo JD");
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
  const searchParams = useSearchParams();
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [currentEntitlement, setCurrentEntitlement] = useState(entitlement);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  const orderCodeParam = searchParams.get("orderCode");
  const statusParam = searchParams.get("status");

  // Sync entitlement if returning from PayOS gateway
  useEffect(() => {
    if (orderCodeParam && token) {
      if (statusParam === "CANCELLED") {
        setError("Giao dịch thanh toán đã bị hủy trên cổng PayOS.");
        return;
      }
      checkOrderStatus(token, orderCodeParam)
        .then((res) => {
          if (res.isPaid) {
            setPaymentSuccessNotice(
              `Thanh toán đơn hàng #${orderCodeParam} thành công! Gói ${res.order.package.name} đã được kích hoạt.`,
            );
            setCurrentEntitlement(res.entitlement);
          }
        })
        .catch((err) => {
          console.error("Failed to sync order status:", err);
        });
    }
  }, [orderCodeParam, statusParam, token]);

  const sorted = useMemo(
    () =>
      [...packages]
        .filter((p) => p.code !== "HR_PREMIUM")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [packages],
  );

  const startCheckout = async () => {
    if (!token || !selectedPackage) return;
    setBusyCode(selectedPackage.code);
    setError(null);
    try {
      const order = await createPackageOrder(token, selectedPackage.code);
      const session = await checkoutOrder(token, order.id, "/recruiter/billing");
      setConfirmOpen(false);

      if (
        session.checkoutUrl &&
        (session.checkoutUrl.startsWith("https://") ||
          session.checkoutUrl.startsWith("http://")) &&
        !session.checkoutUrl.includes("/recruiter/billing/checkout")
      ) {
        // Redirect to real PayOS VietQR portal
        window.location.href = session.checkoutUrl;
      } else {
        router.push(
          `/recruiter/billing/checkout?orderId=${order.id}&session=${session.providerSessionId}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo đơn hàng.");
      setConfirmOpen(false);
    } finally {
      setBusyCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <Link
            href="/recruiter/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> Về workspace HR
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1F2937]">
            Gói dịch vụ & Hạn mức tuyển dụng
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Lựa chọn gói dịch vụ tối ưu theo nhu cầu tuyển dụng: HR Free (Trải nghiệm cơ bản), HR Starter (Doanh nghiệp vừa & nhỏ), HR Pro (Tuyển dụng không giới hạn). Thanh toán VietQR Napas 247 an toàn và kích hoạt tức thì.
          </p>
        </div>

        {paymentSuccessNotice && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold">{paymentSuccessNotice}</p>
          </div>
        )}

        {currentEntitlement && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Gói hiện tại
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#1F2937]">
                  {currentEntitlement.packageName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tin đã tạo tháng này: {currentEntitlement.jobsCreatedThisMonth ?? 0}
                  {currentEntitlement.monthlyJobCreateLimit != null
                    ? ` / ${currentEntitlement.monthlyJobCreateLimit}`
                    : " (không giới hạn)"}
                  {currentEntitlement.maxApplicantsPerJob != null
                    ? ` · Tối đa ${currentEntitlement.maxApplicantsPerJob} UV/tin`
                    : " · UV/tin không giới hạn"}
                  {currentEntitlement.endsAt
                    ? ` · Hết hạn ${new Date(currentEntitlement.endsAt).toLocaleDateString("vi-VN")}`
                    : " · Không thời hạn"}
                </p>
                {currentEntitlement.talentPoolAccess && (
                  <p className="mt-1 text-sm text-slate-600">
                    Lượt mở khóa CV còn lại: {currentEntitlement.cvUnlockRemaining}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {currentEntitlement.aiRanking && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    AI matching
                  </span>
                )}
                {currentEntitlement.advancedFilters && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                    Lọc nâng cao
                  </span>
                )}
                {currentEntitlement.recruitmentStats && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                    Dashboard
                  </span>
                )}
                {currentEntitlement.talentPoolAccess && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                    Talent pool
                  </span>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{currentEntitlement.disclaimer}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sorted.map((pkg) => {
            const isCurrent = currentEntitlement?.packageCode === pkg.code;
            const payable = pkg.priceVnd > 0;
            const isPro = pkg.code === "HR_PRO";
            const isStarter = pkg.code === "HR_STARTER";
            const isTest = pkg.code === "HR_TEST";

            return (
              <div
                key={pkg.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all relative ${
                  isPro
                    ? "border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20"
                    : isTest
                      ? "border-amber-400 shadow-sm bg-gradient-to-b from-amber-50/30 to-white hover:border-amber-500"
                      : isStarter
                        ? "border-slate-300 hover:border-slate-400"
                        : "border-slate-200"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-[#2563EB] px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                {isTest && (
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-amber-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      Thử nghiệm 10k
                    </span>
                  </div>
                )}
                {isStarter && (
                  <div className="absolute -top-3 right-4">
                    <span className="rounded-full bg-slate-800 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      Tiết kiệm
                    </span>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#1F2937]">{pkg.name}</h3>
                  {isPro ? (
                    <Sparkles className="h-5 w-5 text-[#2563EB]" />
                  ) : isTest ? (
                    <Sparkles className="h-5 w-5 text-amber-500" />
                  ) : isStarter ? (
                    <Sparkles className="h-5 w-5 text-slate-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                <p className="text-2xl font-extrabold tracking-tight text-[#1F2937]">
                  {pkg.priceVnd === 0 ? "Miễn phí" : formatVnd(pkg.priceVnd)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {pkg.durationDays
                    ? `${pkg.durationDays} ngày`
                    : "Luôn sẵn sàng"}
                </p>
                <p className="mt-3 text-sm text-slate-600 min-h-[40px]">{pkg.description}</p>
                <ul className="mt-4 flex-1 space-y-2.5">
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
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setConfirmOpen(true);
                    }}
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      isPro
                        ? "bg-[#2563EB] hover:bg-blue-700"
                        : isTest
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    {isCurrent
                      ? "Đang dùng"
                      : busyCode === pkg.code
                        ? "Đang tạo đơn..."
                        : "Chọn gói & thanh toán"}
                  </button>
                ) : (
                  <div className="mt-6 rounded-xl bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-slate-600 border border-slate-100">
                    {isCurrent ? "Gói mặc định đang dùng" : "Kích hoạt tự động"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {confirmOpen && selectedPackage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            role="presentation"
            onClick={() => !busyCode && setConfirmOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center gap-2 text-[#1F2937]">
                <Info className="h-5 w-5 text-[#2563EB]" />
                <h3 className="text-base font-extrabold">Xác nhận mua {selectedPackage.name}</h3>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#EFF6FF] px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Số tiền cần thanh toán
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#2563EB]">
                  {formatVnd(selectedPackage.priceVnd)}
                </p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Thanh toán an toàn {formatVnd(selectedPackage.priceVnd)} qua VietQR Napas 247 cho{" "}
                {selectedPackage.durationDays ?? 30} ngày sử dụng gói {selectedPackage.name}. Bạn sẽ được chuyển đến cổng thanh toán để quét mã QR bằng ứng dụng ngân hàng.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={!!busyCode}
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!!busyCode}
                  onClick={() => void startCheckout()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  <QrCode className="h-4 w-4" />
                  {busyCode ? "Đang tạo mã QR..." : "Thanh toán VietQR"}
                </button>
              </div>
            </div>
          </div>
        )}

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
