"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatVnd,
  getMyEntitlement,
  getOrder,
  type EntitlementStatus,
  type PackageOrder,
} from "@/lib/billing-api";

function ResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const [order, setOrder] = useState<PackageOrder | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Vui lòng đăng nhập lại.");
        return;
      }
      try {
        const [orderData, entitlementData] = await Promise.all([
          getOrder(session.access_token, orderId),
          getMyEntitlement(session.access_token, "CANDIDATE"),
        ]);
        setOrder(orderData);
        setEntitlement(entitlementData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được kết quả.");
      }
    };
    void load();
  }, [orderId]);

  const success = status === "success" || order?.status === "PAID";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        {success ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
        )}
        <h1 className="mt-4 text-2xl font-semibold">
          {success ? "Thanh toán thành công" : "Thanh toán chưa hoàn tất"}
        </h1>
        {order && (
          <p className="mt-2 text-sm text-slate-600">
            {order.package.name} · {formatVnd(order.amountVnd)}
          </p>
        )}
        {entitlement && success && (
          <p className="mt-3 text-sm">
            Gói hiện tại: <strong>{entitlement.packageName}</strong>
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/candidate/billing"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Xem trạng thái gói
          </Link>
          <Link
            href="/candidate"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            Về việc làm
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CandidateBillingResultPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Suspense fallback={<div className="p-10 text-center text-sm">Đang tải...</div>}>
        <ResultContent />
      </Suspense>
    </div>
  );
}
