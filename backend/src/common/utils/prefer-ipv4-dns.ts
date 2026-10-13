import * as dns from 'dns';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

/**
 * Custom fetch that resolves hostnames via A records (IPv4) first.
 * Needed on Windows where getaddrinfo may return broken IPv6-only for
 * Cloudflare hosts (e.g. api-merchant.payos.vn), causing ConnectionError.
 */
export function createIpv4PreferringFetch(): typeof fetch {
  return async (input, init = {}) => {
    const request =
      typeof Request !== 'undefined' && input instanceof Request
        ? input
        : null;
    const url = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : request
            ? request.url
            : String(input),
    );

    const method =
      init.method ?? request?.method ?? 'GET';
    const headers = new Headers(init.headers ?? request?.headers);
    if (!headers.has('host')) {
      headers.set('host', url.hostname);
    }

    let body = init.body ?? undefined;
    if (body === undefined && request && method !== 'GET' && method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const port = url.port
      ? Number(url.port)
      : isHttps
        ? 443
        : 80;

    const headerRecord: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerRecord[key] = value;
    });

    const ipv4 = await new Promise<string | null>((resolve) => {
      dns.resolve4(url.hostname, (err, addresses) => {
        if (err || !addresses?.length) resolve(null);
        else resolve(addresses[0]);
      });
    });

    return new Promise<Response>((resolve, reject) => {
      const req = lib.request(
        {
          hostname: ipv4 ?? url.hostname,
          servername: url.hostname,
          port,
          path: `${url.pathname}${url.search}`,
          method,
          headers: headerRecord,
          family: 4,
          lookup: (hostname, options, callback) => {
            const target =
              hostname === ipv4 || hostname === url.hostname
                ? url.hostname
                : hostname;
            dns.resolve4(target, (err, addresses) => {
              if (!err && addresses?.length) {
                (callback as (
                  err: NodeJS.ErrnoException | null,
                  address: string,
                  family: number,
                ) => void)(null, addresses[0], 4);
                return;
              }
              dns.lookup(hostname, options as dns.LookupOptions, callback as never);
            });
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            const responseHeaders = new Headers();
            for (const [key, value] of Object.entries(res.headers)) {
              if (value === undefined) continue;
              if (Array.isArray(value)) {
                for (const item of value) responseHeaders.append(key, item);
              } else {
                responseHeaders.set(key, value);
              }
            }
            resolve(
              new Response(buf, {
                status: res.statusCode ?? 0,
                statusText: res.statusMessage,
                headers: responseHeaders,
              }),
            );
          });
        },
      );

      req.on('error', reject);

      if (body != null && method !== 'GET' && method !== 'HEAD') {
        if (typeof body === 'string' || Buffer.isBuffer(body)) {
          req.write(body);
        } else if (body instanceof ArrayBuffer) {
          req.write(Buffer.from(body));
        } else if (ArrayBuffer.isView(body)) {
          req.write(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
        } else {
          reject(
            new Error(
              'ipv4PreferringFetch: unsupported body type (stream/FormData).',
            ),
          );
          return;
        }
      }

      req.end();
    });
  };
}
