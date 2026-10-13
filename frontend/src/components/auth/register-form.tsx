"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { registerSchema } from "@/schemas/auth.schema";
import { createClient } from "@/lib/supabase/client";
import { bootstrapProfile, dashboardPathForRoles } from "@/lib/auth-api";
import { savePendingSignup } from "@/lib/pending-signup";
import type {
  PublicSignupRole,
  RegisterFormValues,
} from "@/types/auth";

interface RegisterFormProps {
  role: PublicSignupRole;
}

export function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setFormError("");

    try {
      const supabase = createClient();
      const email = values.email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName.trim(),
            signup_intent: role,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        const profile = await bootstrapProfile(data.session.access_token, role);
        router.replace(dashboardPathForRoles(profile.roles));
        router.refresh();
        return;
      }

      savePendingSignup({ email, role });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể tạo tài khoản. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GoogleAuthButton
        role={role}
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
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            {...register("fullName")}
            className={errors.fullName ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

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
          <Label htmlFor="password">Mật khẩu</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              {...register("confirmPassword")}
              className={
                errors.confirmPassword
                  ? "border-destructive pr-10"
                  : "pr-10"
              }
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={
                showConfirmPassword
                  ? "Ẩn mật khẩu xác nhận"
                  : "Hiện mật khẩu xác nhận"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  disabled={isLoading}
                />
              )}
            />
            <Label htmlFor="acceptTerms" className="mt-0.5 leading-5">
              Tôi đồng ý với{" "}
              <Link href="/terms" target="_blank" className="text-primary hover:underline font-semibold">
                Điều khoản dịch vụ
              </Link>{" "}
              và{" "}
              <Link href="/privacy" target="_blank" className="text-primary hover:underline font-semibold">
                Chính sách bảo mật
              </Link>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-destructive">
              {errors.acceptTerms.message}
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
          Đăng ký tài khoản
        </Button>
      </form>

      <div className="text-center text-sm">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
