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
      // The PKCE verifier is stored in a cookie for the origin that starts the
      // OAuth flow. Returning to a configured canonical URL from a preview or
      // alias domain would make that cookie unavailable to the callback.
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (role) callbackUrl.searchParams.set("intent", role);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true, // get URL manually then redirect
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      console.log("[google-auth] signInWithOAuth result:", { data, error });
      if (error) throw error;
      if (!data?.url) {
        throw new Error("Supabase không trả về OAuth URL. Kiểm tra Google provider đã được bật trong Supabase Dashboard chưa.");
      }

      // Manually redirect so we can see if this step is the problem
      window.location.href = data.url;
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
