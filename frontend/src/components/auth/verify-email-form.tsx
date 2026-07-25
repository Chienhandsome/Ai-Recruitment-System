"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  AuthApiError,
  bootstrapProfile,
  dashboardPathForRoles,
} from "@/lib/auth-api";
import {
  clearPendingSignup,
  readPendingSignup,
} from "@/lib/pending-signup";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!email) {
      setErrorMessage("Thiếu email cần xác minh. Vui lòng đăng ký lại.");
      return;
    }

    if (!new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`).test(token)) {
      setErrorMessage("OTP phải gồm từ 6 đến 8 chữ số.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) throw error;
      if (!data.session) {
        throw new Error("Không thể tạo phiên đăng nhập sau khi xác minh OTP.");
      }

      const pendingSignup = readPendingSignup();
      const role =
        pendingSignup?.email === email ? pendingSignup.role : undefined;
      const profile = await bootstrapProfile(data.session.access_token, role);

      clearPendingSignup();
      setMessage("Email đã được xác minh thành công.");
      router.replace(dashboardPathForRoles(profile.roles));
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "ROLE_REQUIRED") {
        router.replace("/register?complete=1");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "OTP không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email || cooldown > 0) return;
    setIsResending(true);
    setErrorMessage("");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;

      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("Mã OTP mới đã được gửi. Vui lòng kiểm tra hộp thư.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể gửi lại OTP.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={verifyOtp} className="space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-secondary p-4 text-primary">
          <Mail className="h-8 w-8" />
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Nhập mã OTP đã gửi đến{" "}
        <span className="font-medium text-foreground">
          {email || "email của bạn"}
        </span>
        .
      </p>

      <div className="space-y-2">
        <Label htmlFor="otp">Mã OTP</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_MAX_LENGTH}
          value={token}
          onChange={(event) =>
            setToken(
              event.target.value.replace(/\D/g, "").slice(0, OTP_MAX_LENGTH),
            )
          }
          placeholder="00000000"
          className="text-center text-2xl tracking-[0.3em] sm:tracking-[0.5em]"
          disabled={isLoading}
        />
      </div>

      {message && (
        <p className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading || !email}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Xác minh email
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={isResending || cooldown > 0 || !email}
        onClick={resendOtp}
      >
        {isResending && <Loader2 className="h-4 w-4 animate-spin" />}
        {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã OTP"}
      </Button>
    </form>
  );
}
