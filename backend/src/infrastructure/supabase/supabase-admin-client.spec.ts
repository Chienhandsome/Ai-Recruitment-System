import { createSupabaseAdminClient } from './supabase-admin-client';

describe('createSupabaseAdminClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uses an opaque secret as apikey only and retries a transient invalid JWT', async () => {
    const capturedHeaders: Headers[] = [];
    let attempts = 0;

    global.fetch = (async (_input, init) => {
      attempts += 1;
      capturedHeaders.push(new Headers(init?.headers));

      if (attempts === 1) {
        return new Response(JSON.stringify({ message: 'invalid JWT' }), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ users: [], aud: 'authenticated' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const client = createSupabaseAdminClient(
      'https://example.supabase.co',
      'sb_secret_test',
    );
    const { error } = await client.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    expect(error).toBeNull();
    expect(attempts).toBe(2);
    expect(
      capturedHeaders.every(
        (headers) =>
          headers.get('apikey') === 'sb_secret_test' &&
          !headers.has('authorization'),
      ),
    ).toBe(true);
  });

  it('removes the invalid Bearer header from the invite endpoint', async () => {
    let requestPath = '';
    let requestHeaders = new Headers();

    global.fetch = (async (input, init) => {
      requestPath = new URL(typeof input === 'string' ? input : input.url)
        .pathname;
      requestHeaders = new Headers(init?.headers);

      return new Response(
        JSON.stringify({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'admin@example.com',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    }) as typeof fetch;

    const client = createSupabaseAdminClient(
      'https://example.supabase.co',
      'sb_secret_test',
    );
    await client.auth.admin.inviteUserByEmail('admin@example.com');

    expect(requestPath).toBe('/auth/v1/invite');
    expect(requestHeaders.get('apikey')).toBe('sb_secret_test');
    expect(requestHeaders.has('authorization')).toBe(false);
  });
});
