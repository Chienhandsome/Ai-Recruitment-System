"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatVnd,
  getOrder,
  mockPayOrder,
  type PackageOrder,
} from "@/lib/billing-api";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [token, setToken] = useState("");
  const [order, setOrder] = useState<PackageOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!orderId) {
        setError("Thiếu mã đơn hàng.");
        return;
      }
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Vui lòng đăng nhập lại.");
        return;
      }
      setToken(session.access_token);
      try {
        setOrder(await getOrder(session.access_token, orderId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được đơn.");
      }
    };
    void load();
  }, [orderId]);

  const confirmPay = async () => {
    if (!token || !orderId) return;
    setPaying(true);
    setError(null);
    try {
      await mockPayOrder(token, orderId);
      router.push(
        `/candidate/billing/result?orderId=${orderId}&status=success`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toán thất bại.");
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Thanh toán sandbox (MOCK)
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Xác nhận thanh toán</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chỉ hoạt động ở development/test. Production tắt mock-pay.
        </p>
        {order && (
          <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Gói</span>
              <span className="font-medium">{order.package.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Số tiền</span>
              <span className="font-semibold">{formatVnd(order.amountVnd)}</span>
            </div>
            <div className="flex justify-between">
              <span>Trạng thái</span>
              <span>{order.status}</span>
            </div>
          </div>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={!order || paying || order?.status === "PAID"}
            onClick={() => void confirmPay()}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {paying ? "Đang xác nhận..." : "Thanh toán thành công (sandbox)"}
          </button>
          <Link
            href="/candidate/billing"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm"
          >
            Hủy
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CandidateBillingCheckoutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Suspense fallback={<div className="p-10 text-center text-sm">Đang tải...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
