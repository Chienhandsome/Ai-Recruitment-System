import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";

const protectedPrefixes = [
  "/candidate/applications",
  "/candidate/profile",
  "/recruiter",
  "/admin/",
  "/update-password",
];

/**
 * Public routes where we should NOT attempt to refresh the session.
 * This prevents "Refresh Token Not Found" errors when stale cookies exist
 * during signup/login flows.
 */
const publicAuthPrefixes = [
  "/login",
  "/register",
  "/verify-email",
  "/auth/callback",
  "/forgot-password",
];

// Middleware runs on Edge — use console directly
const isDev = process.env.NODE_ENV === "development";

function logDebug(message: string) {
  if (isDev) console.log(`[middleware] ${message}`);
}

function logWarn(message: string) {
  console.warn(`[middleware] ${message}`);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  logDebug(`→ ${request.method} ${pathname}`);

  const config = getSupabasePublicConfig();
  if (!config.url || !config.publishableKey) {
    logWarn("Supabase not configured — skipping auth check");
    return NextResponse.next({ request });
  }

  // Skip session refresh for public auth routes to avoid
  // "Invalid Refresh Token" errors from stale cookies during signup/login.
  const isPublicAuthRoute =
    pathname === "/admin" ||
    publicAuthPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublicAuthRoute) {
    logDebug(`Public auth route ${pathname} — skipping session refresh`);
    return NextResponse.next({ request });
  }

  // Fast-path: If visiting a non-protected route and user has no Supabase cookies, skip network call
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const hasSupabaseCookies = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!isProtectedRoute && !hasSupabaseCookies) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let data: any = null;
  let error: any = null;
  try {
    const claimsPromise = supabase.auth.getClaims();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth timeout")), 1500)
    );
    const res: any = await Promise.race([claimsPromise, timeoutPromise]);
    data = res.data;
    error = res.error;
  } catch (err: any) {
    logWarn(`Supabase auth check timed out or failed: ${err.message}`);
    // Fallback: If not a protected route, let the user load the page immediately
    if (!isProtectedRoute) {
      return NextResponse.next({ request });
    }
  }

  // If refresh token is invalid/not found, clear the stale session cookies
  // and let the request proceed (user will be treated as unauthenticated).
  if (error && "code" in error && error.code === "refresh_token_not_found") {
    logWarn(`Stale refresh token detected — clearing session cookies`);
    const clearResponse = NextResponse.next({ request });
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-")) {
        clearResponse.cookies.delete(name);
      }
    });
    const requiresAuthentication = protectedPrefixes.some((prefix) =>
      pathname.startsWith(prefix),
    );
    if (requiresAuthentication) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = pathname.startsWith("/admin") ? "/admin" : "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return clearResponse;
  }

  const claims = data?.claims;

  const requiresAuthentication = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (requiresAuthentication && !claims) {
    const targetLogin = pathname.startsWith("/admin") ? "/admin" : "/login";
    logWarn(`Protected route ${pathname} — no valid session, redirecting to ${targetLogin}`);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = targetLogin;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (requiresAuthentication && claims) {
    const sub = (claims as Record<string, unknown>).sub;
    logDebug(`Protected route ${pathname} — authenticated (sub=${sub})`);
  }

  return response;
}
