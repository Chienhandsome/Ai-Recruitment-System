import { ForbiddenException } from '@nestjs/common';
import { EntitlementStatus, PackageAudience } from '@prisma/client';
import { EntitlementsService } from './entitlements.service';
import { PACKAGE_CODES, USAGE_FEATURES } from './billing.types';

describe('EntitlementsService (candidate + shared core)', () => {
  let service: EntitlementsService;
  let prisma: any;

  const freeCandidate = {
    id: 'pkg-c-free',
    code: PACKAGE_CODES.CANDIDATE_FREE,
    name: 'Candidate Free',
    audience: PackageAudience.CANDIDATE,
    maxActiveJobs: null,
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
    durationDays: null,
    priceVnd: 0,
  };

  const proCandidate = {
    ...freeCandidate,
    id: 'pkg-c-pro',
    code: PACKAGE_CODES.CANDIDATE_PRO,
    name: 'Candidate Pro',
    priceVnd: 69000,
    durationDays: 30,
    jdFitAnalysis: true,
    cvImproveSuggestions: true,
    jdFitQuota: 10,
  };

  const premiumCandidate = {
    ...proCandidate,
    id: 'pkg-c-premium',
    code: PACKAGE_CODES.CANDIDATE_PREMIUM,
    name: 'Candidate Premium',
    priceVnd: 129000,
    aiMockInterview: true,
    mockInterviewQuota: 5,
  };

  beforeEach(() => {
    prisma = {
      servicePackage: {
        findUnique: jest.fn().mockResolvedValue(freeCandidate),
        findFirst: jest.fn(),
      },
      packageEntitlement: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        create: jest.fn(),
      },
      packageUsageLog: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      jobPosting: { count: jest.fn().mockResolvedValue(0) },
      recruiterProfile: { findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
        fn(prisma),
      ),
    };
    service = new EntitlementsService(prisma);
  });

  it('returns virtual Free without creating DB entitlement', async () => {
    const result = await service.getEffectiveEntitlement(
      'user-1',
      PackageAudience.CANDIDATE,
    );
    expect(result.isVirtualFree).toBe(true);
    expect(result.packageCode).toBe(PACKAGE_CODES.CANDIDATE_FREE);
    expect(result.entitlementId).toBeNull();
    expect(prisma.packageEntitlement.create).not.toHaveBeenCalled();
  });

  it('blocks JD-fit on Free', async () => {
    await expect(service.assertCandidateJdFit('user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows JD-fit on Pro and consumes quota idempotently', async () => {
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-pro',
        maxActiveJobs: null,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        jdFitAnalysis: true,
        cvImproveSuggestions: true,
        jdFitRemaining: 10,
        aiMockInterview: false,
        mockInterviewRemaining: 0,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
        package: proCandidate,
      },
    ]);
    prisma.packageUsageLog.create.mockResolvedValue({
      id: 'usage-1',
      requestId: 'req-1',
      status: 'CONSUMED',
    });

    const first = await service.consumeQuotaAtomically({
      userId: 'user-1',
      audience: PackageAudience.CANDIDATE,
      featureCode: USAGE_FEATURES.JD_FIT_ANALYSIS,
      requestId: 'req-1',
      quotaField: 'jdFitRemaining',
    });
    expect(first.reused).toBe(false);
    expect(prisma.packageEntitlement.updateMany).toHaveBeenCalled();

    prisma.packageUsageLog.findUnique.mockResolvedValue({
      id: 'usage-1',
      requestId: 'req-1',
      status: 'CONSUMED',
    });
    const second = await service.consumeQuotaAtomically({
      userId: 'user-1',
      audience: PackageAudience.CANDIDATE,
      featureCode: USAGE_FEATURES.JD_FIT_ANALYSIS,
      requestId: 'req-1',
      quotaField: 'jdFitRemaining',
    });
    expect(second.reused).toBe(true);
  });

  it('refunds quota on AI failure path', async () => {
    prisma.packageUsageLog.findUnique.mockResolvedValue({
      id: 'usage-1',
      entitlementId: 'ent-pro',
      status: 'CONSUMED',
    });
    await service.refundQuotaForRequest({
      userId: 'user-1',
      requestId: 'req-fail',
      quotaField: 'jdFitRemaining',
    });
    expect(prisma.packageEntitlement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { jdFitRemaining: { increment: 1 } },
      }),
    );
    expect(prisma.packageUsageLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'REFUNDED' },
      }),
    );
  });

  it('rejects concurrent consume when quota is zero', async () => {
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-pro',
        maxActiveJobs: null,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        jdFitAnalysis: true,
        cvImproveSuggestions: true,
        jdFitRemaining: 0,
        aiMockInterview: false,
        mockInterviewRemaining: 0,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
        package: proCandidate,
      },
    ]);
    prisma.packageEntitlement.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.consumeQuotaAtomically({
        userId: 'user-1',
        audience: PackageAudience.CANDIDATE,
        featureCode: USAGE_FEATURES.JD_FIT_ANALYSIS,
        requestId: 'req-empty',
        quotaField: 'jdFitRemaining',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('upgrades Pro to Premium by expiring prior paid entitlement', async () => {
    prisma.servicePackage.findFirst.mockResolvedValue(premiumCandidate);
    prisma.packageEntitlement.create.mockResolvedValue({
      id: 'ent-premium',
      package: premiumCandidate,
    });

    await service.activateFromPaidOrder({
      userId: 'user-1',
      packageId: premiumCandidate.id,
      orderId: 'order-premium',
      audience: PackageAudience.CANDIDATE,
    });

    expect(prisma.packageEntitlement.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: EntitlementStatus.EXPIRED },
      }),
    );
    expect(prisma.packageEntitlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-premium',
          aiMockInterview: true,
          mockInterviewRemaining: 5,
          jdFitRemaining: 10,
        }),
      }),
    );
  });

  it('requires Premium for mock interview', async () => {
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-pro',
        maxActiveJobs: null,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        jdFitAnalysis: true,
        cvImproveSuggestions: true,
        jdFitRemaining: 5,
        aiMockInterview: false,
        mockInterviewRemaining: 0,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
        package: proCandidate,
      },
    ]);
    await expect(
      service.assertCandidateMockInterview('user-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
