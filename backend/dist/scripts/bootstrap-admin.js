"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const supabase_admin_client_1 = require("../src/infrastructure/supabase/supabase-admin-client");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminUserId = process.env.ADMIN_USER_ID?.trim();
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim() ??
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!adminUserId) {
        throw new Error('ADMIN_USER_ID is required. Create the user in Supabase Auth first.');
    }
    if (!supabaseUrl || !supabaseSecretKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required to verify the Auth user.');
    }
    const supabase = (0, supabase_admin_client_1.createSupabaseAdminClient)(supabaseUrl, supabaseSecretKey);
    const { data, error } = await supabase.auth.admin.getUserById(adminUserId);
    if (error || !data.user?.email) {
        throw new Error(`Cannot load Supabase Auth user ${adminUserId}: ${error?.message ?? 'email is missing'}`);
    }
    const adminEmail = data.user.email;
    const metadata = data.user.user_metadata;
    const fullName = (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
        (typeof metadata.name === 'string' && metadata.name.trim()) ||
        adminEmail.split('@')[0];
    const avatarUrl = (typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()) ||
        (typeof metadata.picture === 'string' && metadata.picture.trim()) ||
        undefined;
    await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.upsert({
            where: { id: data.user.id },
            update: {
                email: adminEmail.toLowerCase(),
                fullName,
                userStatus: 'ACTIVE',
                role: 'ADMIN',
            },
            create: {
                id: data.user.id,
                email: adminEmail.toLowerCase(),
                fullName,
                userStatus: 'ACTIVE',
                role: 'ADMIN',
            },
        });
        console.log(`✓ Successfully bootstrapped ADMIN role for ${user.email} (${user.id})`);
    });
}
main()
    .catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
    console.error(message);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=bootstrap-admin.js.map