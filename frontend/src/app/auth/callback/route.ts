import { NextResponse, type NextRequest } from "next/server";
import {
  AuthApiError,
  bootstrapProfile,
  dashboardPathForRoles,
} from "@/lib/auth-api";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";
import type { PublicSignupRole } from "@/types/auth";

function parseRole(value: string | null): PublicSignupRole | undefined {
  return value === "CANDIDATE" || value === "RECRUITER" ? value : undefined;
}

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const intent = parseRole(request.nextUrl.searchParams.get("intent"));
  const next = request.nextUrl.searchParams.get("next");
  const errorDescription =
    request.nextUrl.searchParams.get("error_description");

  console.log("[auth/callback] Received callback:", {
    hasCode: !!code,
    intent,
    next,
    hasError: !!errorDescription,
  });

  if (errorDescription) {
    console.error("[auth/callback] Error from provider:", errorDescription);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    console.error("[auth/callback] Missing authorization code");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "OAuth callback thiếu authorization code.");
    return NextResponse.redirect(loginUrl);
  }

  const pendingCookies: PendingCookie[] = [];
  const pendingHeaders: Record<string, string> = {};

  const redirectWithAuthState = (destination: URL) => {
    const response = NextResponse.redirect(destination);

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    Object.entries(pendingHeaders).forEach(([name, value]) => {
      response.headers.set(name, value);
    });

    return response;
  };

  try {
    // Use a response-aware Supabase client so cookies are written into the
    // redirect response (not just the incoming request's cookie store).
    const { url, publishableKey } = requireSupabasePublicConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          pendingCookies.push(...cookiesToSet);
          Object.assign(pendingHeaders, headersToSet);
        },
      },
    });

    console.log("[auth/callback] Exchanging code for session...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      throw error;
    }

    if (next === "/update-password") {
      console.log("[auth/callback] Redirecting to /update-password");
      return redirectWithAuthState(new URL("/update-password", request.url));
    }

    if (!data.session) {
      console.error("[auth/callback] No session returned from Supabase");
      throw new Error("Supabase không trả về phiên đăng nhập.");
    }

    console.log("[auth/callback] Session obtained, bootstrapping profile...");
    const profile = await bootstrapProfile(
      data.session.access_token,
      intent,
    );

    const destination = dashboardPathForRoles(profile.roles);
    console.log("[auth/callback] Success — redirecting to:", destination);

    return redirectWithAuthState(new URL(destination, request.url));
  } catch (error) {
    if (error instanceof AuthApiError && error.code === "ROLE_REQUIRED") {
      console.log("[auth/callback] Role required — redirecting to /register?complete=1");
      return redirectWithAuthState(
        new URL("/register?complete=1", request.url),
      );
    }

    const message = error instanceof Error ? error.message : "OAuth callback thất bại.";
    console.error("[auth/callback] Unhandled error:", message);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", message);
    return redirectWithAuthState(loginUrl);
  }
}
