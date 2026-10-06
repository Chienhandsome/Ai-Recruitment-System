"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Lock,
  QrCode,
  Sparkles,
  X,
  Zap,
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

type TxRow = {
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
};

type Props = {
  token: string;
  packages: ServicePackage[];
  entitlement: EntitlementStatus | null;
  orders: PackageOrder[];
  transactions: TxRow[];
};

type PaymentHistoryItem = {
  id: string;
  orderCode: string;
  packageName: string;
  amountVnd: number;
  status: string;
  statusLabel: string;
  at: string;
  provider: string | null;
};

type PurchasePreview = {
  code: string;
  packageName: string;
  amountVnd: number;
  title: string;
  explanation: string;
  canProceed: boolean;
  note?: string;
};

const PREVIEW_LIMIT = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "SUCCESS" || s === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "PENDING" || s === "CREATED") {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }
  if (s === "FAILED" || s === "CANCELLED" || s === "EXPIRED") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function statusRank(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS" || s === "PAID" || s === "COMPLETED") return 3;
  if (s === "PENDING" || s === "CREATED") return 2;
  return 1;
}

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "SUCCESS" || s === "COMPLETED") return "Đã thanh toán";
  if (s === "PENDING" || s === "CREATED") return "Chờ thanh toán";
  if (s === "FAILED") return "Thất bại";
  if (s === "CANCELLED") return "Đã hủy";
  if (s === "EXPIRED") return "Hết hạn";
  return status;
}

function remainingDays(endsAt: string | null | undefined) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
}

function buildPurchasePreview(params: {
  target: ServicePackage;
  entitlement: EntitlementStatus | null;
  starterPrice: number;
  proPrice: number;
  starterDays: number;
  proDays: number;
}): PurchasePreview {
  const {
    target,
    entitlement,
    starterPrice,
    proPrice,
    starterDays,
    proDays,
  } = params;
  const code = target.code;
  const current = entitlement?.packageCode ?? "HR_FREE";
  const remain = remainingDays(entitlement?.endsAt);

  if (code === "HR_TEST") {
    return {
      code,
      packageName: target.name,
      amountVnd: target.priceVnd,
      title: "Đăng ký Gói Test PayOS 10k",
      explanation: `Thanh toán ${formatVnd(target.priceVnd)} để trải nghiệm thanh toán VietQR thật và dùng thử tính năng gói HR trong ${target.durationDays ?? 3} ngày.`,
      canProceed: true,
      note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
    };
  }

  if (code === "HR_PRO") {
    if (current === "HR_STARTER" && remain != null && remain > 0) {
      const residual = Math.round((starterPrice * remain) / starterDays);
      const amount = Math.max(0, proPrice - residual);
      return {
        code,
        packageName: target.name,
        amountVnd: amount,
        title: "Nâng cấp Starter → Pro",
        explanation: `Starter còn khoảng ${remain}/${starterDays} ngày (ước tính giá trị còn lại ${formatVnd(residual)}). Bạn chỉ thanh toán phần chênh lệch ${formatVnd(proPrice)} − ${formatVnd(residual)} = ${formatVnd(amount)}. Sau khi thanh toán, Pro có hiệu lực ngay ${proDays} ngày mới kèm hạn mức đầy đủ.`,
        canProceed: true,
        note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
      };
    }
    return {
      code,
      packageName: target.name,
      amountVnd: proPrice,
      title: "Mua gói HR Pro",
      explanation: `Thanh toán ${formatVnd(proPrice)} cho chu kỳ ${proDays} ngày HR Pro (không giới hạn tin & ứng viên, AI ranking, dashboard, talent pool).`,
      canProceed: true,
      note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
    };
  }

  // Buying Starter
  if (code === "HR_STARTER") {
    if (
      (current === "HR_PRO" || current === "HR_PREMIUM") &&
      remain != null &&
      remain > 0
    ) {
      return {
        code,
        packageName: target.name,
        amountVnd: 0,
        title: "Chưa thể hạ xuống Starter ngay",
        explanation: `Bạn đang dùng ${current === "HR_PREMIUM" ? "Premium" : "Pro"} (còn khoảng ${remain} ngày). Hệ thống không hạ gói ngay và không hoàn tiền. Tiếp tục dùng gói hiện tại đến hết hạn, giữ nguyên hạn mức; sau đó mới mua Starter ${formatVnd(starterPrice)} / ${starterDays} ngày.`,
        canProceed: false,
      };
    }
    return {
      code,
      packageName: target.name,
      amountVnd: starterPrice,
      title: "Mua gói HR Starter",
      explanation: `Thanh toán ${formatVnd(starterPrice)} cho chu kỳ ${starterDays} ngày HR Starter (hạn mức tin/tháng, AI matching, talent pool cơ bản).`,
      canProceed: true,
      note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
    };
  }

  return {
    code,
    packageName: target.name,
    amountVnd: target.priceVnd,
    title: `Mua ${target.name}`,
    explanation: `Thanh toán ${formatVnd(target.priceVnd)} cho ${target.durationDays ?? 30} ngày sử dụng.`,
    canProceed: true,
    note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
  };
}

function buildPaymentHistory(
  orders: PackageOrder[],
  transactions: TxRow[],
): PaymentHistoryItem[] {
  const txByOrder = new Map<string, TxRow>();
  for (const tx of transactions) {
    const key = tx.order?.orderCode;
    if (!key) continue;
    const prev = txByOrder.get(key);
    if (
      !prev ||
      statusRank(tx.status) > statusRank(prev.status) ||
      (statusRank(tx.status) === statusRank(prev.status) &&
        new Date(tx.createdAt).getTime() > new Date(prev.createdAt).getTime())
    ) {
      txByOrder.set(key, tx);
    }
  }

  return [...orders]
    .map((order) => {
      const tx = txByOrder.get(order.orderCode);
      const status = tx?.status ?? order.status;
      return {
        id: order.id,
        orderCode: order.orderCode,
        packageName: order.package.name,
        amountVnd: order.amountVnd,
        status,
        statusLabel: statusLabel(status),
        at: tx?.createdAt ?? order.paidAt ?? order.createdAt,
        provider: tx?.provider ?? order.paymentProvider ?? null,
      };
    })
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function ModalShell({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const maxW =
    size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ item }: { item: PaymentHistoryItem }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {item.packageName}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {item.orderCode}
            {item.provider ? ` · ${item.provider}` : ""}
            {" · "}
            {new Date(item.at).toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-slate-900">{formatVnd(item.amountVnd)}</p>
          <span
            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTone(item.status)}`}
          >
            {item.statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function BillingWorkspaceContent({
  token,
  packages,
  entitlement,
  orders,
  transactions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEntitlement, setCurrentEntitlement] = useState(entitlement);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(
    null,
  );
  const [syncingOrder, setSyncingOrder] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [purchase, setPurchase] = useState<PurchasePreview | null>(null);

  const orderCodeParam = searchParams.get("orderCode");
  const statusParam = searchParams.get("status");

  useEffect(() => {
    if (!orderCodeParam || !token) return;
    if (statusParam === "CANCELLED") {
      setError("Giao dịch thanh toán đã bị hủy trên cổng PayOS.");
      return;
    }

    let cancelled = false;

    const syncPayment = async () => {
      setSyncingOrder(true);
      setError(null);
      try {
        const res = await checkOrderStatus(token, orderCodeParam);
        if (cancelled) return;
        if (res.isPaid) {
          setPaymentSuccessNotice(
            `Thanh toán đơn hàng #${orderCodeParam} thành công! Gói ${res.order.package.name} đã được kích hoạt.`,
          );
          setCurrentEntitlement(res.entitlement);
          router.replace("/recruiter/billing");
          router.refresh();
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to sync order status:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không đồng bộ được trạng thái thanh toán. Nếu đã trừ tiền, hãy tải lại trang.",
        );
      } finally {
        if (!cancelled) setSyncingOrder(false);
      }
    };

    void syncPayment();
    return () => {
      cancelled = true;
    };
  }, [orderCodeParam, statusParam, token, router]);

  const sorted = useMemo(
    () =>
      [...packages]
        .filter((p) => p.code !== "HR_PREMIUM")
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [packages],
  );

  const history = useMemo(
    () => buildPaymentHistory(orders, transactions),
    [orders, transactions],
  );
  const preview = history.slice(0, PREVIEW_LIMIT);

  const starterPkg = sorted.find((p) => p.code === "HR_STARTER");
  const proPkg = sorted.find((p) => p.code === "HR_PRO");
  const starterPrice = starterPkg?.priceVnd ?? 149_000;
  const proPrice = proPkg?.priceVnd ?? 349_000;
  const starterDays = starterPkg?.durationDays ?? 30;
  const proDays = proPkg?.durationDays ?? 30;
  const midRemainDays = Math.round(starterDays * (2 / 3));
  const usedDays = starterDays - midRemainDays;
  const residualValue = Math.round((starterPrice * midRemainDays) / starterDays);
  const upgradeMid = proPrice - residualValue;
  const upgradeImmediate = proPrice - starterPrice;

  const openPurchase = (pkg: ServicePackage) => {
    setError(null);
    setPurchase(
      buildPurchasePreview({
        target: pkg,
        entitlement: currentEntitlement,
        starterPrice,
        proPrice,
        starterDays,
        proDays,
      }),
    );
  };

  const confirmPurchase = async () => {
    if (!token || !purchase?.canProceed) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createPackageOrder(token, purchase.code);
      const session = await checkoutOrder(token, order.id, "/recruiter/billing");
      setPurchase(null);

      if (
        session.checkoutUrl &&
        (session.checkoutUrl.startsWith("https://") ||
          session.checkoutUrl.startsWith("http://")) &&
        !session.checkoutUrl.includes("/recruiter/billing/checkout")
      ) {
        window.location.href = session.checkoutUrl;
      } else {
        router.push(
          `/recruiter/billing/checkout?orderId=${order.id}&session=${session.providerSessionId}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo đơn hàng.");
      setPurchase(null);
    } finally {
      setBusy(false);
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#1F2937]">
                Gói dịch vụ & Hạn mức tuyển dụng
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Lựa chọn gói dịch vụ tối ưu theo nhu cầu tuyển dụng: HR Free
                (Trải nghiệm cơ bản), HR Starter (Doanh nghiệp vừa & nhỏ), HR Pro
                (Tuyển dụng không giới hạn). Thanh toán VietQR Napas 247 an toàn
                và kích hoạt tức thì.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPolicyOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 text-sm font-semibold text-[#2563EB] hover:bg-[#DBEAFE]"
            >
              <Info className="size-4" />
              Chính sách gói dịch vụ
            </button>
          </div>
        </div>

        {syncingOrder && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 shadow-sm">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-sky-600" />
            <p className="text-sm font-medium">
              Đang đồng bộ trạng thái thanh toán từ PayOS, vui lòng chờ trong
              giây lát...
            </p>
          </div>
        )}

        {paymentSuccessNotice && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold">{paymentSuccessNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessNotice(null)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Đóng
            </button>
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
                  Tin đã tạo tháng này:{" "}
                  {currentEntitlement.jobsCreatedThisMonth ?? 0}
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
                    Lượt mở khóa CV còn lại:{" "}
                    {currentEntitlement.cvUnlockRemaining}
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
            <p className="mt-4 text-xs text-slate-500">
              {currentEntitlement.disclaimer}
            </p>
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
                className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                  isPro
                    ? "border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20"
                    : isTest
                      ? "border-amber-400 bg-gradient-to-b from-amber-50/30 to-white shadow-sm hover:border-amber-500"
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
                    <Zap className="h-5 w-5 text-amber-500" />
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
                <p className="mt-3 min-h-[40px] text-sm text-slate-600">
                  {pkg.description}
                </p>
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
                    disabled={isCurrent || busy}
                    onClick={() => openPurchase(pkg)}
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      isPro
                        ? "bg-[#2563EB] hover:bg-blue-700"
                        : isTest
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    {isCurrent ? "Đang dùng" : "Chọn gói & thanh toán"}
                  </button>
                ) : (
                  <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-slate-600">
                    {isCurrent ? "Gói mặc định đang dùng" : "Kích hoạt tự động"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">Lịch sử thanh toán</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Mỗi đơn một dòng — trạng thái lấy từ giao dịch mới nhất nếu có.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {history.length} mục
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {history.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có lịch sử thanh toán.</p>
            )}
            {preview.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>

          {history.length > PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF]"
            >
              Xem chi tiết ({history.length})
            </button>
          )}
        </section>

        <ModalShell
          open={policyOpen}
          title="Chính sách gói dịch vụ"
          onClose={() => setPolicyOpen(false)}
          size="xl"
          footer={
            <div className="text-right">
              <button
                type="button"
                onClick={() => setPolicyOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-[15px] leading-relaxed text-slate-700">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-emerald-700">
                  <ArrowUpRight className="size-4" />
                  Starter → Pro
                </p>
                <p className="mt-3">
                  Nâng cấp ngay. Chỉ trả phần chênh lệch theo thời gian Starter
                  còn lại, rồi nhận chu kỳ Pro mới ({proDays} ngày) kèm hạn mức
                  đầy đủ.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                <p className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-amber-800">
                  <ArrowDownRight className="size-4" />
                  Pro → Starter
                </p>
                <p className="mt-3">
                  Không hạ ngay và không hoàn tiền. Pro dùng đến hết hạn, giữ
                  nguyên hạn mức. Hết hạn mới mua Starter cho chu kỳ tiếp theo.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
                Ví dụ tính phí
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Starter {formatVnd(starterPrice)} / {starterDays} ngày · Pro{" "}
                {formatVnd(proPrice)} / {proDays} ngày
              </p>
              <ul className="mt-4 list-disc space-y-3 pl-5">
                <li>
                  Dùng Starter {usedDays} ngày, còn {midRemainDays} ngày → giá
                  trị còn lại {formatVnd(residualValue)}; phí nâng ={" "}
                  <strong className="text-slate-900">
                    {formatVnd(upgradeMid)}
                  </strong>
                  .
                </li>
                <li>
                  Mua Starter rồi nâng Pro ngay → phí nâng ={" "}
                  <strong className="text-slate-900">
                    {formatVnd(upgradeImmediate)}
                  </strong>
                  .
                </li>
                <li>
                  Đang Pro muốn xuống Starter → dùng đến hết hạn, không hoàn
                  tiền; sau đó mua Starter {formatVnd(starterPrice)}.
                </li>
              </ul>
            </div>

            <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Free / Test mua Starter hoặc Pro luôn thanh toán đúng giá niêm
              yết. Chỉ áp dụng giảm chênh lệch khi đang còn hạn gói Starter và
              nâng lên Pro.
            </p>
          </div>
        </ModalShell>

        <ModalShell
          open={!!purchase}
          title={purchase?.title ?? "Xác nhận thanh toán"}
          onClose={() => !busy && setPurchase(null)}
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPurchase(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              {purchase?.canProceed ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirmPurchase()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <QrCode className="h-4 w-4" />
                  {busy
                    ? "Đang tạo mã QR..."
                    : `Thanh toán ${formatVnd(purchase.amountVnd)}`}
                </button>
              ) : null}
            </div>
          }
        >
          {purchase && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-[#EFF6FF] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Số tiền cần thanh toán
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[#2563EB]">
                  {purchase.canProceed
                    ? formatVnd(purchase.amountVnd)
                    : "Không phát sinh"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {purchase.packageName}
                </p>
              </div>
              <p className="leading-relaxed text-slate-700">
                {purchase.explanation}
              </p>
              {purchase.note && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {purchase.note}
                </p>
              )}
            </div>
          )}
        </ModalShell>

        <ModalShell
          open={historyOpen}
          title="Toàn bộ lịch sử thanh toán"
          onClose={() => setHistoryOpen(false)}
          size="lg"
          footer={
            <div className="text-right">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          }
        >
          <div className="space-y-2">
            {history.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>
        </ModalShell>
      </div>
    </div>
  );
}

export function BillingWorkspace(props: Props) {
  return (
    <Suspense fallback={null}>
      <BillingWorkspaceContent {...props} />
    </Suspense>
  );
}
