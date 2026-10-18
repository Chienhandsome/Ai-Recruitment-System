import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Standard Next.js Edge Proxy / Middleware.
 * Automatically intercepts requests to protected routes (/recruiter, /admin, /candidate/*)
 * and verifies Supabase auth sessions before server-side rendering occurs.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

export default proxy;
