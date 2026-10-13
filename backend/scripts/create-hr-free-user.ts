import 'dotenv/config';
import { PrismaClient, AccountStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  }

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = 'hr.free.test@gmail.com';
  const password = 'Password123@';
  const fullName = 'HR Test Free';

  console.log(`Checking Supabase Auth for ${email}...`);

  // 1. Check or create in Supabase Auth
  let authUserId: string | null = null;
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list Supabase users: ${listError.message}`);
  }

  const existingAuthUser = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existingAuthUser) {
    console.log(`User already exists in Supabase Auth (id: ${existingAuthUser.id}). Updating password...`);
    authUserId = existingAuthUser.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (updateError) {
      console.warn(`Could not update password in Supabase: ${updateError.message}`);
    }
  } else {
    console.log(`Creating user in Supabase Auth...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !createData.user) {
      throw new Error(`Failed to create Supabase user: ${createError?.message}`);
    }
    authUserId = createData.user.id;
    console.log(`Created Supabase Auth user id: ${authUserId}`);
  }

  // 2. Ensure Role RECRUITER exists in Prisma
  const recruiterRole = await prisma.role.upsert({
    where: { code: 'RECRUITER' },
    update: { name: 'Recruiter', description: 'Nhà tuyển dụng / HR' },
    create: { code: 'RECRUITER', name: 'Recruiter', description: 'Nhà tuyển dụng / HR' },
  });

  // 3. Ensure Company and Department exist
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'TechVanguard Vietnam',
        code: 'TECHVANGUARD',
        address: 'Hà Nội, Việt Nam',
        description: 'Doanh nghiệp công nghệ phát triển phần mềm và tuyển dụng.',
      },
    });
  }

  let department = await prisma.department.findFirst({
    where: { companyId: company.id },
  });
  if (!department) {
    department = await prisma.department.create({
      data: {
        companyId: company.id,
        name: 'Phòng Nhân Sự',
        code: `HR-${Date.now()}`,
      },
    });
  }

  // 4. Upsert User in Prisma
  const user = await prisma.user.upsert({
    where: { id: authUserId },
    update: {
      email,
      fullName,
      status: AccountStatus.ACTIVE,
    },
    create: {
      id: authUserId,
      email,
      fullName,
      status: AccountStatus.ACTIVE,
    },
  });

  // 5. Connect UserRole
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: recruiterRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: recruiterRole.id,
    },
  });

  // 6. Upsert RecruiterProfile
  await prisma.recruiterProfile.upsert({
    where: { userId: user.id },
    update: {
      companyId: company.id,
      departmentId: department.id,
      title: 'Talent Acquisition Specialist',
    },
    create: {
      userId: user.id,
      companyId: company.id,
      departmentId: department.id,
      title: 'Talent Acquisition Specialist',
    },
  });

  // 7. Ensure no paid package entitlement exists (clean Free state)
  const deletedEntitlements = await prisma.packageEntitlement.deleteMany({
    where: { userId: user.id },
  });
  console.log(`Cleaned up ${deletedEntitlements.count} old entitlements to guarantee pure Free tier.`);

  console.log('\n=========================================');
  console.log('🎉 TÀI KHOẢN HR FREE ĐÃ ĐƯỢC TẠO THÀNH CÔNG:');
  console.log(`- Email:    ${email}`);
  console.log(`- Mật khẩu: ${password}`);
  console.log(`- Vai trò:  RECRUITER (Nhà tuyển dụng)`);
  console.log(`- Công ty:  ${company.name}`);
  console.log(`- Gói cước: HR Free (3 tin/tháng, 100 ứng viên/tin, 0 lượt mở CV)`);
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error('Lỗi tạo tài khoản HR Free:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
