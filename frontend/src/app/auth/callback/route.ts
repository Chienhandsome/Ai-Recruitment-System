import { NextResponse, type NextRequest } from "next/server";
import {
  AuthApiError,
  bootstrapProfile,
  dashboardPathForRoles,
} from "@/lib/auth-api";
import { createServerClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "@/lib/supabase/config";
import type { PublicSignupRole } from "@/types/auth";

function parseRole(value: string | null): PublicSignupRole | undefined {
  return value === "CANDIDATE" || value === "RECRUITER" ? value : undefined;
}

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

  try {
    // Use a response-aware Supabase client so cookies are written into the
    // redirect response (not just the incoming request's cookie store).
    const { url, publishableKey } = requireSupabasePublicConfig();
    let redirectResponse = NextResponse.redirect(new URL("/", request.url));

    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
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
      redirectResponse = NextResponse.redirect(new URL("/update-password", request.url));
      // Re-apply cookies to the new response
      supabase.auth.getSession(); // no-op: cookies already set above
      return redirectResponse;
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

    // Create final redirect and carry over the session cookies
    const finalResponse = NextResponse.redirect(new URL(destination, request.url));
    redirectResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      finalResponse.cookies.set(name, value, options);
    });
    return finalResponse;
  } catch (error) {
    if (error instanceof AuthApiError && error.code === "ROLE_REQUIRED") {
      console.log("[auth/callback] Role required — redirecting to /register?complete=1");
      return NextResponse.redirect(new URL("/register?complete=1", request.url));
    }

    const message = error instanceof Error ? error.message : "OAuth callback thất bại.";
    console.error("[auth/callback] Unhandled error:", message);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }
}
