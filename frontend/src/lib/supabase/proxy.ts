import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";

const protectedPrefixes = [
  "/candidate",
  "/recruiter",
  "/admin",
  "/update-password",
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

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const requiresAuthentication = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (requiresAuthentication && !claims) {
    logWarn(`Protected route ${pathname} — no valid session, redirecting to /login`);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (requiresAuthentication && claims) {
    const sub = (claims as Record<string, unknown>).sub;
    logDebug(`Protected route ${pathname} — authenticated (sub=${sub})`);
  }

  return response;
}
