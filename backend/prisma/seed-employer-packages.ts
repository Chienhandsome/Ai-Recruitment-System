import {
  PackageAudience,
  PrismaClient,
} from '@prisma/client';

export type EmployerPackageSeed = {
  code: string;
  name: string;
  description: string;
  priceVnd: number;
  durationDays: number | null;
  maxActiveJobs: number | null;
  monthlyJobCreateLimit: number | null;
  maxApplicantsPerJob: number | null;
  cvUnlockQuota: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  sortOrder: number;
  isActive: boolean;
};

export const EMPLOYER_PACKAGE_SEEDS: EmployerPackageSeed[] = [
  {
    code: 'HR_FREE',
    name: 'HR Free',
    description:
      'Tạo tối đa 3 tin/tháng, tối đa 100 ứng viên/tin. AI matching cơ bản và ATS cơ bản. Không cam kết tuyển được người.',
    priceVnd: 0,
    durationDays: null,
    maxActiveJobs: null,
    monthlyJobCreateLimit: 3,
    maxApplicantsPerJob: 100,
    cvUnlockQuota: 0,
    aiRanking: true,
    advancedFilters: false,
    recruitmentStats: false,
    talentPoolAccess: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    code: 'HR_TEST',
    name: 'Gói Test PayOS 10k',
    description:
      'Gói 10.000đ để thử nghiệm thanh toán VietQR thật qua PayOS. Trải nghiệm đầy đủ tính năng trong 3 ngày.',
    priceVnd: 10000,
    durationDays: 3,
    maxActiveJobs: null,
    monthlyJobCreateLimit: 5,
    maxApplicantsPerJob: 100,
    cvUnlockQuota: 10,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: true,
    talentPoolAccess: true,
    sortOrder: 2,
    isActive: true,
  },
  {
    code: 'HR_STARTER',
    name: 'HR Starter 30 ngày',
    description:
      'Tạo tối đa 8 tin/tháng, tối đa 300 ứng viên/tin. Tặng 15 lượt mở khóa CV từ Talent Pool, AI matching tiêu chuẩn và bộ lọc nâng cao.',
    priceVnd: 149000,
    durationDays: 30,
    maxActiveJobs: null,
    monthlyJobCreateLimit: 8,
    maxApplicantsPerJob: 300,
    cvUnlockQuota: 15,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: false,
    talentPoolAccess: true,
    sortOrder: 3,
    isActive: true,
  },
  {
    code: 'HR_PRO',
    name: 'HR Pro 30 ngày',
    description:
      'Không giới hạn tin và ứng viên. AI xếp hạng đầy đủ, lọc nâng cao, dashboard thống kê và kho CV công khai. HR vẫn là người quyết định tuyển dụng.',
    priceVnd: 349000,
    durationDays: 30,
    maxActiveJobs: null,
    monthlyJobCreateLimit: null,
    maxApplicantsPerJob: null,
    cvUnlockQuota: 50,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: true,
    talentPoolAccess: true,
    sortOrder: 4,
    isActive: true,
  },
  {
    code: 'HR_PREMIUM',
    name: 'HR Premium 30 ngày (ngừng bán)',
    description:
      'Đã gộp vào HR Pro. Giữ mã để tương thích đơn hàng cũ.',
    priceVnd: 599000,
    durationDays: 30,
    maxActiveJobs: null,
    monthlyJobCreateLimit: null,
    maxApplicantsPerJob: null,
    cvUnlockQuota: 50,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: true,
    talentPoolAccess: true,
    sortOrder: 99,
    isActive: false,
  },
];

export async function seedEmployerPackages(prisma: PrismaClient) {
  for (const pkg of EMPLOYER_PACKAGE_SEEDS) {
    await prisma.servicePackage.upsert({
      where: { code: pkg.code },
      update: {
        name: pkg.name,
        description: pkg.description,
        audience: PackageAudience.EMPLOYER,
        priceVnd: pkg.priceVnd,
        durationDays: pkg.durationDays,
        maxActiveJobs: pkg.maxActiveJobs,
        monthlyJobCreateLimit: pkg.monthlyJobCreateLimit,
        maxApplicantsPerJob: pkg.maxApplicantsPerJob,
        cvUnlockQuota: pkg.cvUnlockQuota,
        aiRanking: pkg.aiRanking,
        advancedFilters: pkg.advancedFilters,
        recruitmentStats: pkg.recruitmentStats,
        talentPoolAccess: pkg.talentPoolAccess,
        isActive: pkg.isActive,
        sortOrder: pkg.sortOrder,
      },
      create: {
        code: pkg.code,
        name: pkg.name,
        description: pkg.description,
        audience: PackageAudience.EMPLOYER,
        priceVnd: pkg.priceVnd,
        durationDays: pkg.durationDays,
        maxActiveJobs: pkg.maxActiveJobs,
        monthlyJobCreateLimit: pkg.monthlyJobCreateLimit,
        maxApplicantsPerJob: pkg.maxApplicantsPerJob,
        cvUnlockQuota: pkg.cvUnlockQuota,
        aiRanking: pkg.aiRanking,
        advancedFilters: pkg.advancedFilters,
        recruitmentStats: pkg.recruitmentStats,
        talentPoolAccess: pkg.talentPoolAccess,
        isActive: pkg.isActive,
        sortOrder: pkg.sortOrder,
      },
    });
  }

  return EMPLOYER_PACKAGE_SEEDS.length;
}
