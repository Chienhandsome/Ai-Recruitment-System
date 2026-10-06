import {
  PackageAudience,
  PrismaClient,
} from '@prisma/client';

export async function seedCandidatePackages(prisma: PrismaClient) {
  const packages = [
    {
      code: 'CANDIDATE_FREE',
      name: 'Candidate Free',
      description:
        'Tìm việc, tạo CV cơ bản và ứng tuyển miễn phí. Không cam kết được tuyển.',
      priceVnd: 0,
      durationDays: null as number | null,
      maxActiveJobs: null as number | null,
      cvUnlockQuota: 0,
      aiRanking: false,
      advancedFilters: false,
      recruitmentStats: false,
      talentPoolAccess: false,
      jdFitAnalysis: false,
      cvImproveSuggestions: false,
      jdFitQuota: 0,
      aiMockInterview: false,
      mockInterviewQuota: 0,
      sortOrder: 1,
    },
    {
      code: 'CANDIDATE_TEST',
      name: 'Gói Test PayOS 10k',
      description:
        'Gói 10.000đ để thử nghiệm thanh toán VietQR thật qua PayOS cho ứng viên. Trải nghiệm tính năng trong 3 ngày.',
      priceVnd: 10000,
      durationDays: 3,
      maxActiveJobs: null,
      cvUnlockQuota: 0,
      aiRanking: false,
      advancedFilters: false,
      recruitmentStats: false,
      talentPoolAccess: false,
      jdFitAnalysis: true,
      cvImproveSuggestions: true,
      jdFitQuota: 3,
      aiMockInterview: true,
      mockInterviewQuota: 2,
      sortOrder: 2,
    },
    {
      code: 'CANDIDATE_PRO',
      name: 'Candidate Pro 30 ngày',
      description:
        'AI phân tích mức phù hợp CV–JD và gợi ý cải thiện CV (10 lượt/chu kỳ). AI chỉ hỗ trợ; bạn tự quyết định.',
      priceVnd: 69000,
      durationDays: 30,
      maxActiveJobs: null,
      cvUnlockQuota: 0,
      aiRanking: false,
      advancedFilters: false,
      recruitmentStats: false,
      talentPoolAccess: false,
      jdFitAnalysis: true,
      cvImproveSuggestions: true,
      jdFitQuota: 10,
      aiMockInterview: false,
      mockInterviewQuota: 0,
      sortOrder: 3,
    },
    {
      code: 'CANDIDATE_PREMIUM',
      name: 'Candidate Premium 30 ngày',
      description:
        'Bao gồm Pro và mô phỏng phỏng vấn AI theo JD (5 lượt), kèm đánh giá câu trả lời. Không cam kết đậu phỏng vấn.',
      priceVnd: 129000,
      durationDays: 30,
      maxActiveJobs: null,
      cvUnlockQuota: 0,
      aiRanking: false,
      advancedFilters: false,
      recruitmentStats: false,
      talentPoolAccess: false,
      jdFitAnalysis: true,
      cvImproveSuggestions: true,
      jdFitQuota: 10,
      aiMockInterview: true,
      mockInterviewQuota: 5,
      sortOrder: 4,
    },
  ];

  for (const pkg of packages) {
    await prisma.servicePackage.upsert({
      where: { code: pkg.code },
      update: {
        name: pkg.name,
        description: pkg.description,
        audience: PackageAudience.CANDIDATE,
        priceVnd: pkg.priceVnd,
        durationDays: pkg.durationDays,
        maxActiveJobs: pkg.maxActiveJobs,
        cvUnlockQuota: pkg.cvUnlockQuota,
        aiRanking: pkg.aiRanking,
        advancedFilters: pkg.advancedFilters,
        recruitmentStats: pkg.recruitmentStats,
        talentPoolAccess: pkg.talentPoolAccess,
        jdFitAnalysis: pkg.jdFitAnalysis,
        cvImproveSuggestions: pkg.cvImproveSuggestions,
        jdFitQuota: pkg.jdFitQuota,
        aiMockInterview: pkg.aiMockInterview,
        mockInterviewQuota: pkg.mockInterviewQuota,
        isActive: true,
        sortOrder: pkg.sortOrder,
      },
      create: {
        ...pkg,
        audience: PackageAudience.CANDIDATE,
        isActive: true,
      },
    });
  }

  return packages.length;
}
