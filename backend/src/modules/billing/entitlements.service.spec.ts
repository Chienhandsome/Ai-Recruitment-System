import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EntitlementStatus, PackageAudience } from '@prisma/client';
import { EntitlementsService } from './entitlements.service';
import { PACKAGE_CODES } from './billing.types';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let prisma: {
    servicePackage: { findUnique: jest.Mock; findFirst: jest.Mock };
    recruiterProfile: { findUnique: jest.Mock };
    packageEntitlement: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    jobPosting: { count: jest.Mock };
  };

  const freePackage = {
    id: 'pkg-free',
    code: PACKAGE_CODES.HR_FREE,
    name: 'HR Free',
    maxActiveJobs: 1,
    cvUnlockQuota: 0,
    aiRanking: false,
    advancedFilters: false,
    recruitmentStats: false,
    talentPoolAccess: false,
    durationDays: null,
    priceVnd: 0,
  };

  const proPackage = {
    id: 'pkg-pro',
    code: PACKAGE_CODES.HR_PRO,
    name: 'HR Pro 30 ngày',
    maxActiveJobs: null,
    cvUnlockQuota: 0,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: false,
    talentPoolAccess: false,
    durationDays: 30,
    priceVnd: 249000,
  };

  const premiumPackage = {
    id: 'pkg-premium',
    code: PACKAGE_CODES.HR_PREMIUM,
    name: 'HR Premium 30 ngày',
    maxActiveJobs: null,
    cvUnlockQuota: 50,
    aiRanking: true,
    advancedFilters: true,
    recruitmentStats: true,
    talentPoolAccess: true,
    durationDays: 30,
    priceVnd: 599000,
  };

  beforeEach(() => {
    prisma = {
      servicePackage: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      recruiterProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rec-1',
          companyId: 'company-1',
        }),
      },
      packageEntitlement: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      jobPosting: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    service = new EntitlementsService(prisma as never);
  });

  it('bootstraps HR Free entitlement when missing', async () => {
    prisma.servicePackage.findUnique.mockResolvedValue(freePackage);
    prisma.packageEntitlement.findFirst.mockResolvedValue(null);
    prisma.packageEntitlement.create.mockResolvedValue({
      id: 'ent-free',
      ...freePackage,
      package: freePackage,
      maxActiveJobs: 1,
      cvUnlockRemaining: 0,
      startsAt: new Date(),
      endsAt: null,
    });
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-free',
        maxActiveJobs: 1,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        startsAt: new Date(),
        endsAt: null,
        package: freePackage,
      },
    ]);

    const result = await service.getEffectiveEntitlement('user-1');

    expect(result.packageCode).toBe(PACKAGE_CODES.HR_FREE);
    expect(result.maxActiveJobs).toBe(1);
    expect(prisma.packageEntitlement.create).toHaveBeenCalled();
  });

  it('prefers Premium over Free when both active', async () => {
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-free',
        maxActiveJobs: 1,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        startsAt: new Date(),
        endsAt: null,
        package: freePackage,
      },
      {
        id: 'ent-premium',
        maxActiveJobs: null,
        cvUnlockRemaining: 40,
        aiRanking: true,
        advancedFilters: true,
        recruitmentStats: true,
        talentPoolAccess: true,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
        package: premiumPackage,
      },
    ]);
    prisma.servicePackage.findUnique.mockResolvedValue(freePackage);
    prisma.packageEntitlement.findFirst.mockResolvedValue({
      id: 'ent-free',
      package: freePackage,
    });

    const result = await service.getEffectiveEntitlement('user-1');

    expect(result.packageCode).toBe(PACKAGE_CODES.HR_PREMIUM);
    expect(result.talentPoolAccess).toBe(true);
  });

  it('blocks publishing when Free quota is exhausted', async () => {
    prisma.servicePackage.findUnique.mockResolvedValue(freePackage);
    prisma.packageEntitlement.findFirst.mockResolvedValue({
      id: 'ent-free',
      package: freePackage,
    });
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-free',
        maxActiveJobs: 1,
        cvUnlockRemaining: 0,
        aiRanking: false,
        advancedFilters: false,
        recruitmentStats: false,
        talentPoolAccess: false,
        startsAt: new Date(),
        endsAt: null,
        package: freePackage,
      },
    ]);
    prisma.jobPosting.count.mockResolvedValue(1);

    await expect(service.assertCanPublishJob('user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows unlimited publish for Pro', async () => {
    prisma.servicePackage.findUnique.mockResolvedValue(freePackage);
    prisma.packageEntitlement.findFirst.mockResolvedValue({
      id: 'ent-free',
      package: freePackage,
    });
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-pro',
        maxActiveJobs: null,
        cvUnlockRemaining: 0,
        aiRanking: true,
        advancedFilters: true,
        recruitmentStats: false,
        talentPoolAccess: false,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
        package: proPackage,
      },
    ]);

    await expect(service.assertCanPublishJob('user-1')).resolves.toMatchObject({
      packageCode: PACKAGE_CODES.HR_PRO,
    });
    expect(prisma.jobPosting.count).not.toHaveBeenCalled();
  });

  it('requires Premium for talent pool', async () => {
    prisma.servicePackage.findUnique.mockResolvedValue(freePackage);
    prisma.packageEntitlement.findFirst.mockResolvedValue({
      id: 'ent-pro',
      package: proPackage,
    });
    prisma.packageEntitlement.findMany.mockResolvedValue([
      {
        id: 'ent-pro',
        maxActiveJobs: null,
        cvUnlockRemaining: 0,
        aiRanking: true,
        advancedFilters: true,
        recruitmentStats: false,
        talentPoolAccess: false,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86400000),
        package: proPackage,
      },
    ]);

    await expect(service.assertTalentPool('user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('activates paid entitlement from order', async () => {
    prisma.servicePackage.findFirst.mockResolvedValue(proPackage);
    prisma.packageEntitlement.updateMany.mockResolvedValue({ count: 1 });
    prisma.packageEntitlement.create.mockResolvedValue({
      id: 'ent-new',
      package: proPackage,
    });

    await service.activateFromPaidOrder({
      userId: 'user-1',
      packageId: proPackage.id,
      orderId: 'order-1',
      companyId: 'company-1',
    });

    expect(prisma.servicePackage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          audience: PackageAudience.EMPLOYER,
        }),
      }),
    );
    expect(prisma.packageEntitlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          status: EntitlementStatus.ACTIVE,
          aiRanking: true,
        }),
      }),
    );
  });

  it('throws when free package catalog is missing', async () => {
    prisma.servicePackage.findUnique.mockResolvedValue(null);

    await expect(service.ensureFreeEntitlement('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
