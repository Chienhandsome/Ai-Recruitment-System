"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { loginSchema } from "@/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";
import {
  AuthApiError,
  bootstrapProfile,
  dashboardPathForRoles,
} from "@/lib/auth-api";
import type { LoginFormValues } from "@/types/auth";

interface LoginFormProps {
  initialError?: string;
}

export function LoginForm({ initialError = "" }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState(initialError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setFormError("");

    try {
      const supabase = createClient();
      const email = values.email.trim().toLowerCase();
      console.log("[login] Attempting sign in for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) {
        console.error("[login] Supabase signIn error:", error.message);
        if (error.message.toLowerCase().includes("email not confirmed")) {
          console.log("[login] Email not confirmed — redirecting to verify");
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        throw error;
      }

      if (!data.session) {
        console.error("[login] No session returned from Supabase");
        throw new Error("Supabase không trả về phiên đăng nhập.");
      }

      console.log("[login] Session obtained, calling bootstrap...");
      const profile = await bootstrapProfile(data.session.access_token);
      const destination = dashboardPathForRoles(profile.roles);
      console.log("[login] Success — navigating to:", destination);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "ROLE_REQUIRED") {
        console.log("[login] Role required — redirecting to complete registration");
        router.push("/register?complete=1");
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Đăng nhập không thành công. Vui lòng thử lại.";
      console.error("[login] Login failed:", message);
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GoogleAuthButton
        disabled={isLoading}
        onError={setFormError}
      />

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase text-muted-foreground">
          Hoặc dùng email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={errors.password ? "border-destructive pr-10" : "pr-10"}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-md bg-red-50 p-3 text-sm text-destructive"
          >
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Đăng nhập
        </Button>
      </form>

      <div className="text-center text-sm">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
