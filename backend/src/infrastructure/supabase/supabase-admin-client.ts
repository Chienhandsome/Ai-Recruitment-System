import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function createAdminFetch(
  supabaseUrl: string,
  secretKey: string,
): typeof fetch {
  const authApiUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/`;
  const secretBearer = `Bearer ${secretKey}`;

  return async (input, init) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const headers = new Headers(init?.headers);

    // New sb_secret_* keys are opaque API keys, not JWTs. Supabase Auth Admin
    // accepts them through the apikey header, but attempting to parse the same
    // value as a Bearer token produces "invalid JWT".
    if (
      secretKey.startsWith('sb_secret_') &&
      requestUrl.startsWith(authApiUrl) &&
      headers.get('authorization') === secretBearer
    ) {
      headers.delete('authorization');
    }

    const send = () =>
      fetch(requestUrl, {
        ...init,
        headers,
      });
    const response = await send();

    // A newly created/rotated secret key can briefly reach an edge node before
    // its internal service-role JWT mapping has propagated. Retry this one
    // transient signature error once; all other authorization failures pass
    // through unchanged.
    if (
      secretKey.startsWith('sb_secret_') &&
      requestUrl.startsWith(authApiUrl) &&
      (response.status === 401 || response.status === 403)
    ) {
      const responseBody = await response.clone().text();
      if (responseBody.includes('invalid JWT')) {
        return send();
      }
    }

    return response;
  };
}

export function createSupabaseAdminClient(
  supabaseUrl: string,
  secretKey: string,
): SupabaseClient {
  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      fetch: createAdminFetch(supabaseUrl, secretKey),
    },
  });
}
