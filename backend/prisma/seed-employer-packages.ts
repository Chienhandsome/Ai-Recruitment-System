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
  cvUnlockQuota: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  sortOrder: number;
};

export const EMPLOYER_PACKAGE_SEEDS: EmployerPackageSeed[] = [
  {
    code: 'HR_FREE',
    name: 'HR Free',
    description:
      'Đăng tối đa 1 tin tuyển dụng đang hoạt động và xem danh sách CV ứng tuyển. Không cam kết tuyển được người.',
    priceVnd: 0,
    durationDays: null,
    maxActiveJobs: 1,
    cvUnlockQuota: 0,
    aiRanking: false,
    advancedFilters: false,
    recruitmentStats: false,
    talentPoolAccess: false,
    sortOrder: 1,
  },
  {
    code: 'HR_PRO',
    name: 'HR Pro 30 ngày',
    description:
      'Đăng nhiều tin, AI xếp hạng CV theo JD kèm lý do phù hợp, và lọc ứng viên nâng cao. HR vẫn là người quyết định tuyển dụng.',
    priceVnd: 249000,
    durationDays: 30,
    maxActiveJobs: null,
    cvUnlockQuota: 0,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: false,
    talentPoolAccess: false,
    sortOrder: 2,
  },
  {
    code: 'HR_PREMIUM',
    name: 'HR Premium 30 ngày',
    description:
      'Bao gồm Pro, thêm dashboard thống kê tuyển dụng và tìm kiếm/mở khóa CV trong kho ứng viên công khai.',
    priceVnd: 599000,
    durationDays: 30,
    maxActiveJobs: null,
    cvUnlockQuota: 50,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: true,
    talentPoolAccess: true,
    sortOrder: 3,
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
        cvUnlockQuota: pkg.cvUnlockQuota,
        aiRanking: pkg.aiRanking,
        advancedFilters: pkg.advancedFilters,
        recruitmentStats: pkg.recruitmentStats,
        talentPoolAccess: pkg.talentPoolAccess,
        isActive: true,
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
        cvUnlockQuota: pkg.cvUnlockQuota,
        aiRanking: pkg.aiRanking,
        advancedFilters: pkg.advancedFilters,
        recruitmentStats: pkg.recruitmentStats,
        talentPoolAccess: pkg.talentPoolAccess,
        isActive: true,
        sortOrder: pkg.sortOrder,
      },
    });
  }

  return EMPLOYER_PACKAGE_SEEDS.length;
}
