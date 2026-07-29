import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createSupabaseAdminClient } from '../src/infrastructure/supabase/supabase-admin-client';

const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  }

  const supabase = createSupabaseAdminClient(supabaseUrl, supabaseSecretKey);

  const adminEmail = 'admin@admin.com';
  const adminPassword = 'admin 123';

  console.log(`Checking/Creating Supabase Auth user: ${adminEmail}...`);

  // Check if user exists in Supabase
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  let authUser = usersData.users.find(u => u.email?.toLowerCase() === adminEmail);

  if (!authUser) {
    console.log(`User ${adminEmail} not found in Supabase Auth. Creating new user...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
      },
    });

    if (createError || !createData.user) {
      throw new Error(`Failed to create admin user in Supabase Auth: ${createError?.message}`);
    }

    authUser = createData.user;
    console.log(`Successfully created Supabase Auth user: ${authUser.id}`);
  } else {
    console.log(`User ${adminEmail} already exists in Supabase Auth (${authUser.id}). Updating password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator',
      },
    });

    if (updateError) {
      throw new Error(`Failed to update admin password: ${updateError.message}`);
    }
    console.log(`Password updated for ${adminEmail}.`);
  }

  // Sync to database and assign ADMIN role
  console.log(`Assigning ADMIN role in Prisma Database...`);
  await prisma.$transaction(async (transaction) => {
    const adminRole = await transaction.role.upsert({
      where: { code: 'ADMIN' },
      update: {
        name: 'Administrator',
        description: 'System Administrator',
      },
      create: {
        code: 'ADMIN',
        name: 'Administrator',
        description: 'System Administrator',
      },
    });

    const user = await transaction.user.upsert({
      where: { id: authUser!.id },
      update: {
        email: adminEmail,
        fullName: 'System Administrator',
        status: 'ACTIVE',
      },
      create: {
        id: authUser!.id,
        email: adminEmail,
        fullName: 'System Administrator',
        status: 'ACTIVE',
      },
    });

    await transaction.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    console.log(`ADMIN role successfully linked to user in DB.`);
  });

  console.log(`\n===================================`);
  console.log(`DEFAULT ADMIN ACCOUNT READY:`);
  console.log(`Email/Username: ${adminEmail} (or 'admin')`);
  console.log(`Password: ${adminPassword}`);
  console.log(`===================================\n`);
}

main()
  .catch((err) => {
    console.error('Error seeding admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
