import type {
  AuthProfile,
  AuthRole,
  PublicSignupRole,
} from "@/types/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://ai-recruitment-system-test-deploy.onrender.com/api";

// Simple logger that only outputs in development
const log = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[auth-api]", ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn("[auth-api]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[auth-api]", ...args);
  },
};

interface ApiErrorPayload {
  code?: string;
  message?: string | string[];
  error?: string;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function authRequest(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<AuthProfile> {
  const url = `${API_URL}${path}`;
  const method = init?.method ?? "GET";

  log.debug(`${method} ${url} — sending request`);

  const startTime = Date.now();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  const duration = Date.now() - startTime;

  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // Fall back to the HTTP status below.
    }

    const rawMessage = payload.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage ?? payload.error ?? "Không thể xác thực tài khoản.";

    log.error(
      `${method} ${url} — ${response.status} in ${duration}ms — code=${payload.code ?? "none"}, message=${message}`,
    );

    throw new AuthApiError(message, response.status, payload.code);
  }

  log.debug(`${method} ${url} — ${response.status} OK in ${duration}ms`);
  return (await response.json()) as AuthProfile;
}

export function bootstrapProfile(
  accessToken: string,
  role?: PublicSignupRole,
) {
  log.debug(`bootstrapProfile: role=${role ?? "none"}`);
  return authRequest("/auth/bootstrap", accessToken, {
    method: "POST",
    body: JSON.stringify(role ? { role } : {}),
  });
}

export function getCurrentProfile(accessToken: string) {
  log.debug("getCurrentProfile: fetching /auth/me");
  return authRequest("/auth/me", accessToken);
}

export function dashboardPathForRoles(roles: AuthRole[]) {
  const path = roles.includes("ADMIN")
    ? "/admin/dashboard"
    : roles.includes("RECRUITER")
      ? "/recruiter/dashboard"
      : "/candidate/dashboard";
  log.debug(`dashboardPathForRoles: roles=[${roles.join(",")}] → ${path}`);
  return path;
}
