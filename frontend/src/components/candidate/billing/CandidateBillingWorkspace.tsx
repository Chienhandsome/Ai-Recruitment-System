"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Info,
  Loader2,
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
  amountVnd: number;
  status: string;
  createdAt: string;
  order: { orderCode: string; package: { name: string } };
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
  code: "CANDIDATE_TEST" | "CANDIDATE_PRO" | "CANDIDATE_PREMIUM";
  packageName: string;
  amountVnd: number;
  title: string;
  explanation: string;
  canProceed: boolean;
  note?: string;
};

const PREVIEW_LIMIT = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  code: "CANDIDATE_TEST" | "CANDIDATE_PRO" | "CANDIDATE_PREMIUM";
  target: ServicePackage;
  entitlement: EntitlementStatus | null;
  proPrice: number;
  premiumPrice: number;
  proDays: number;
  premiumDays: number;
}): PurchasePreview {
  const {
    code,
    target,
    entitlement,
    proPrice,
    premiumPrice,
    proDays,
    premiumDays,
  } = params;
  const current = entitlement?.packageCode ?? "CANDIDATE_FREE";
  const remain = remainingDays(entitlement?.endsAt);

  if (code === "CANDIDATE_TEST") {
    return {
      code,
      packageName: target.name,
      amountVnd: target.priceVnd,
      title: "Đăng ký Gói Test PayOS 10k",
      explanation: `Thanh toán ${formatVnd(target.priceVnd)} để trải nghiệm thanh toán VietQR thật và dùng thử tính năng AI Phân tích CV–JD (${target.jdFitQuota ?? 3} lượt) & Mock interview AI (${target.mockInterviewQuota ?? 2} lượt) trong ${target.durationDays ?? 3} ngày.`,
      canProceed: true,
      note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
    };
  }

  if (code === "CANDIDATE_PREMIUM") {
    if (current === "CANDIDATE_PRO" && remain != null && remain > 0) {
      const residual = Math.round((proPrice * remain) / proDays);
      const amount = Math.max(0, premiumPrice - residual);
      return {
        code,
        packageName: target.name,
        amountVnd: amount,
        title: "Nâng cấp Pro → Premium",
        explanation: `Pro còn khoảng ${remain}/${proDays} ngày (ước tính giá trị còn lại ${formatVnd(residual)}). Bạn chỉ thanh toán phần chênh lệch ${formatVnd(premiumPrice)} − ${formatVnd(residual)} = ${formatVnd(amount)}. Sau khi thanh toán, Premium có hiệu lực ngay ${premiumDays} ngày mới kèm quota đầy đủ.`,
        canProceed: true,
        note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
      };
    }
    return {
      code,
      packageName: target.name,
      amountVnd: premiumPrice,
      title: "Mua gói Premium",
      explanation: `Thanh toán ${formatVnd(premiumPrice)} cho chu kỳ ${premiumDays} ngày Premium (gồm quyền Pro + mock interview AI).`,
      canProceed: true,
      note: "Quét mã VietQR chuyển khoản ngân hàng qua cổng PayOS an toàn & tự động kích hoạt.",
    };
  }

  // Buying Pro
  if (current === "CANDIDATE_PREMIUM" && remain != null && remain > 0) {
    return {
      code,
      packageName: target.name,
      amountVnd: 0,
      title: "Chưa thể hạ xuống Pro ngay",
      explanation: `Bạn đang dùng Premium (còn khoảng ${remain} ngày). Hệ thống không hạ gói ngay và không hoàn tiền. Tiếp tục dùng Premium đến hết hạn, giữ nguyên quota; sau đó mới mua Pro ${formatVnd(proPrice)} / ${proDays} ngày.`,
      canProceed: false,
    };
  }

  return {
    code,
    packageName: target.name,
    amountVnd: proPrice,
    title: "Mua gói Pro",
    explanation: `Thanh toán ${formatVnd(proPrice)} cho chu kỳ ${proDays} ngày Pro (AI phân tích CV–JD theo quota gói).`,
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
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 px-5 py-3">{footer}</div>
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

function CandidateBillingWorkspaceContent({
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncingOrder, setSyncingOrder] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [purchase, setPurchase] = useState<PurchasePreview | null>(null);

  const sorted = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder),
    [packages],
  );

  const history = useMemo(
    () => buildPaymentHistory(orders, transactions),
    [orders, transactions],
  );
  const preview = history.slice(0, PREVIEW_LIMIT);

  const proPkg = sorted.find((p) => p.code === "CANDIDATE_PRO");
  const premiumPkg = sorted.find((p) => p.code === "CANDIDATE_PREMIUM");
  const proPrice = proPkg?.priceVnd ?? 69_000;
  const premiumPrice = premiumPkg?.priceVnd ?? 129_000;
  const proDays = proPkg?.durationDays ?? 30;
  const premiumDays = premiumPkg?.durationDays ?? 30;
  const midRemainDays = Math.round(proDays * (2 / 3));
  const usedDays = proDays - midRemainDays;
  const residualValue = Math.round((proPrice * midRemainDays) / proDays);
  const upgradeMid = premiumPrice - residualValue;
  const upgradeImmediate = premiumPrice - proPrice;

  // PayOS automatic return handler: When redirected back from PayOS VietQR with ?orderCode=...
  useEffect(() => {
    const orderCodeParam = searchParams.get("orderCode");

    if (orderCodeParam && token) {
      setSyncingOrder(true);
      checkOrderStatus(token, orderCodeParam)
        .then((res) => {
          if (res.isPaid) {
            setSuccessMessage(
              `Thanh toán đơn hàng #${orderCodeParam} thành công! Gói ${res.entitlement.packageName} đã được kích hoạt.`,
            );
            router.replace("/candidate/billing");
          }
        })
        .catch((err) => {
          console.error("Failed to sync candidate order status on return:", err);
        })
        .finally(() => {
          setSyncingOrder(false);
        });
    }
  }, [searchParams, token, router]);

  const openPurchase = (
    code: "CANDIDATE_TEST" | "CANDIDATE_PRO" | "CANDIDATE_PREMIUM",
  ) => {
    const target = sorted.find((p) => p.code === code);
    if (!target) return;
    setError(null);
    setPurchase(
      buildPurchasePreview({
        code,
        target,
        entitlement,
        proPrice,
        premiumPrice,
        proDays,
        premiumDays,
      }),
    );
  };

  const confirmPurchase = async () => {
    if (!token || !purchase?.canProceed) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createPackageOrder(token, purchase.code);
      const session = await checkoutOrder(token, order.id, "/candidate/billing");
      setPurchase(null);

      if (
        session.checkoutUrl &&
        (session.checkoutUrl.startsWith("https://") ||
          session.checkoutUrl.startsWith("http://")) &&
        !session.checkoutUrl.includes("/candidate/billing/checkout")
      ) {
        // Redirect to real PayOS VietQR portal
        window.location.href = session.checkoutUrl;
      } else {
        router.push(
          `/candidate/billing/checkout?orderId=${order.id}&session=${session.providerSessionId}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được đơn.");
      setPurchase(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Gói dịch vụ ứng viên
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            AI chỉ hỗ trợ phân tích và luyện phỏng vấn. Không cam kết được tuyển
            hay đậu phỏng vấn. Tìm việc và ứng tuyển cơ bản luôn miễn phí.
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

      {syncingOrder && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600 shrink-0" />
          <p className="text-sm font-medium">
            Đang đồng bộ trạng thái thanh toán từ PayOS, vui lòng chờ trong giây lát...
          </p>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Đóng
          </button>
        </div>
      )}

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
              ? ` · Mock interview còn ${entitlement.mockInterviewRemaining ?? 0}`
              : ""}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((pkg) => {
          const payable = pkg.code !== "CANDIDATE_FREE";
          const current = entitlement?.packageCode === pkg.code;
          return (
            <div
              key={pkg.id}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                pkg.code === "CANDIDATE_PREMIUM"
                  ? "border-[#1F2937] ring-1 ring-[#1F2937]"
                  : pkg.code === "CANDIDATE_TEST"
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-slate-200"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                {pkg.code === "CANDIDATE_PREMIUM" ? (
                  <Crown className="h-5 w-5 text-amber-500" />
                ) : pkg.code === "CANDIDATE_PRO" ? (
                  <Sparkles className="h-5 w-5 text-sky-500" />
                ) : pkg.code === "CANDIDATE_TEST" ? (
                  <Zap className="h-5 w-5 text-amber-500" />
                ) : null}
              </div>

              {pkg.code === "CANDIDATE_TEST" && (
                <div className="mb-2">
                  <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    Thử nghiệm 10k VietQR
                  </span>
                </div>
              )}
              {pkg.code === "CANDIDATE_PRO" && (
                <div className="mb-2">
                  <span className="inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                    Phổ biến
                  </span>
                </div>
              )}
              {pkg.code === "CANDIDATE_PREMIUM" && (
                <div className="mb-2">
                  <span className="inline-block rounded-full bg-[#1F2937] px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    Đầy đủ AI Mock
                  </span>
                </div>
              )}

              <p className="text-2xl font-bold text-slate-900">
                {pkg.priceVnd === 0 ? "Miễn phí" : formatVnd(pkg.priceVnd)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {pkg.durationDays ? `${pkg.durationDays} ngày` : "Mặc định"}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {featuresOf(pkg).map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {payable ? (
                <button
                  type="button"
                  disabled={current || busy}
                  onClick={() =>
                    openPurchase(
                      pkg.code as
                        | "CANDIDATE_TEST"
                        | "CANDIDATE_PRO"
                        | "CANDIDATE_PREMIUM",
                    )
                  }
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    pkg.code === "CANDIDATE_TEST"
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {current ? "Đang dùng" : "Chọn gói & thanh toán"}
                </button>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 py-2.5 text-center text-sm font-medium text-slate-500">
                  Mặc định
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
        footer={
          <div className="text-right">
            <button
              type="button"
              onClick={() => setPolicyOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm text-slate-700">
          {/* <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Thông tin tham khảo trên UI. Thanh toán đang sandbox — backend chưa
            trừ chênh lệch tự động.
          </p> */}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                <ArrowUpRight className="size-3.5" />
                Pro → Premium
              </p>
              <p className="mt-2 leading-relaxed">
                Nâng cấp ngay. Chỉ trả phần chênh lệch theo thời gian Pro còn
                lại, rồi nhận chu kỳ Premium mới ({premiumDays} ngày) kèm quota
                đầy đủ.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-800">
                <ArrowDownRight className="size-3.5" />
                Premium → Pro
              </p>
              <p className="mt-2 leading-relaxed">
                Không hạ ngay và không hoàn tiền. Premium dùng đến hết hạn, giữ
                nguyên quota. Hết hạn mới mua Pro cho chu kỳ tiếp theo.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Ví dụ tính phí
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Pro {formatVnd(proPrice)} / {proDays} ngày · Premium{" "}
              {formatVnd(premiumPrice)} / {premiumDays} ngày
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-4 leading-relaxed">
              <li>
                Dùng Pro {usedDays} ngày, còn {midRemainDays} ngày → giá trị còn
                lại {formatVnd(residualValue)}; phí nâng ={" "}
                <strong>{formatVnd(upgradeMid)}</strong>.
              </li>
              <li>
                Mua Pro rồi nâng Premium ngay → phí nâng ={" "}
                <strong>{formatVnd(upgradeImmediate)}</strong>.
              </li>
              <li>
                Đang Premium muốn xuống Pro → dùng đến hết hạn, không hoàn tiền;
                sau đó mua Pro {formatVnd(proPrice)}.
              </li>
            </ul>
          </div>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <CreditCard className="size-4" />
                {busy
                  ? "Đang tạo đơn..."
                  : `Thanh toán ${formatVnd(purchase.amountVnd)}`}
              </button>
            ) : null}
          </div>
        }
      >
        {purchase && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Số tiền cần thanh toán
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {purchase.canProceed
                  ? formatVnd(purchase.amountVnd)
                  : "Không phát sinh"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{purchase.packageName}</p>
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

      <p className="mt-6 text-center text-sm">
        <Link href="/candidate" className="text-blue-600 hover:underline">
          ← Về trang việc làm
        </Link>
      </p>
    </div>
  );
}

export function CandidateBillingWorkspace(props: Props) {
  return (
    <Suspense fallback={null}>
      <CandidateBillingWorkspaceContent {...props} />
    </Suspense>
  );
}
