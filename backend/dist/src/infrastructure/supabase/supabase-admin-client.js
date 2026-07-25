"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseAdminClient = createSupabaseAdminClient;
const supabase_js_1 = require("@supabase/supabase-js");
function createAdminFetch(supabaseUrl, secretKey) {
    const authApiUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/`;
    const secretBearer = `Bearer ${secretKey}`;
    return async (input, init) => {
        const requestUrl = typeof input === 'string'
            ? input
            : input instanceof URL
                ? input.toString()
                : input.url;
        const headers = new Headers(init?.headers);
        if (secretKey.startsWith('sb_secret_') &&
            requestUrl.startsWith(authApiUrl) &&
            headers.get('authorization') === secretBearer) {
            headers.delete('authorization');
        }
        const send = () => fetch(requestUrl, {
            ...init,
            headers,
        });
        const response = await send();
        if (secretKey.startsWith('sb_secret_') &&
            requestUrl.startsWith(authApiUrl) &&
            (response.status === 401 || response.status === 403)) {
            const responseBody = await response.clone().text();
            if (responseBody.includes('invalid JWT')) {
                return send();
            }
        }
        return response;
    };
}
function createSupabaseAdminClient(supabaseUrl, secretKey) {
    return (0, supabase_js_1.createClient)(supabaseUrl, secretKey, {
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
//# sourceMappingURL=supabase-admin-client.js.map