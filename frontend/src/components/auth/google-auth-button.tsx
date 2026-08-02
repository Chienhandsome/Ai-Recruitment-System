"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { PublicSignupRole } from "@/types/auth";

interface GoogleAuthButtonProps {
  role?: PublicSignupRole;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function GoogleAuthButton({
  role,
  disabled,
  onError,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    onError?.("");

    try {
      const supabase = createClient();
      // When running locally use the actual origin so the redirectTo matches
      // the localhost entry in Supabase's Allowed Redirect URLs.
      // In production NEXT_PUBLIC_SITE_URL is used for a stable, known URL.
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");
      const siteUrl = isLocal
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin);
      const callbackUrl = new URL("/auth/callback", siteUrl);
      if (role) callbackUrl.searchParams.set("intent", role);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      console.log("[google-auth] signInWithOAuth result:", { data, error });
      if (error) throw error;
      // If data.url is returned, browser will be redirected automatically.
      // If not, something is wrong with the Google provider config in Supabase.
      if (!data?.url) {
        throw new Error("Supabase không trả về OAuth URL. Kiểm tra Google provider đã được bật trong Supabase Dashboard chưa.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể bắt đầu đăng nhập Google.";
      onError?.(message);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled || isLoading}
      onClick={handleGoogleAuth}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600"
        >
          G
        </span>
      )}
      Tiếp tục với Google
    </Button>
  );
}
