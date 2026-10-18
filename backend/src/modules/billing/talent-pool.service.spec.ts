import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TalentPoolService } from './talent-pool.service';
import { talentPoolVisibilityWhere } from './talent-pool-visibility';

describe('TalentPoolService paid visibility and contact privacy', () => {
  let prisma: any;
  let entitlements: any;
  let service: TalentPoolService;
  const profile = {
    id: 'candidate',
    fullName: 'Nguyen Van A',
    desiredTitle: 'Engineer',
    professionalSummary: 'Summary',
    address: '123 Street, District 1, HCM',
    email: 'private@example.com',
    phone: '0900000000',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    candidateSkills: [],
  };
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-18T00:00:00Z'));
    prisma = {
      candidateProfile: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([profile]),
        findFirst: jest.fn().mockResolvedValue(profile),
      },
      cvUnlock: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      packageEntitlement: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction = jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
    entitlements = {
      assertTalentPool: jest
        .fn()
        .mockResolvedValue({ entitlementId: 'hr-ent', cvUnlockRemaining: 2 }),
    };
    service = new TalentPoolService(prisma, entitlements);
  });
  afterEach(() => jest.useRealTimers());

  it('blocks HR without talent-pool access before reading any candidate data', async () => {
    entitlements.assertTalentPool.mockRejectedValue(new ForbiddenException());
    await expect(service.search('hr', { page: 1, limit: 20 })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.getCandidate('hr', 'candidate')).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.unlock('hr', 'candidate')).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.candidateProfile.findFirst).not.toHaveBeenCalled();
    expect(prisma.candidateProfile.findMany).not.toHaveBeenCalled();
  });

  it('filters consent and live candidate entitlement in SQL before counting and pagination', async () => {
    const result = await service.search('hr', {
      page: 2,
      limit: 20,
      skill: 'Java',
    });
    const eligibility = talentPoolVisibilityWhere(new Date());
    expect(prisma.candidateProfile.count.mock.calls[0][0].where).toMatchObject(
      eligibility,
    );
    expect(prisma.candidateProfile.findMany.mock.calls[0][0]).toMatchObject({
      where: eligibility,
      skip: 20,
      take: 20,
    });
    expect(eligibility.jobSeekingEntitlement).toMatchObject({
      is: {
        status: 'ACTIVE',
        jobSeekingAccess: true,
        endsAt: { gt: new Date() },
        package: { audience: 'CANDIDATE' },
      },
    });
    expect(result.data[0].contact).toBeNull();
    expect(JSON.stringify(result.data)).not.toContain('private@example.com');
    expect(result.data[0].displayName).not.toBe(profile.fullName);
  });

  it('rejects hidden or expired profiles on detail and unlock, including old links', async () => {
    prisma.candidateProfile.findFirst.mockResolvedValue(null);
    await expect(service.getCandidate('hr', 'candidate')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.unlock('hr', 'candidate')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.candidateProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'candidate', ...talentPoolVisibilityWhere(new Date()) },
      }),
    );
    expect(prisma.packageEntitlement.updateMany).not.toHaveBeenCalled();
  });

  it('does not debit quota if the candidate withdraws before the unlock transaction', async () => {
    prisma.candidateProfile.findFirst
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(null);
    await expect(service.unlock('hr', 'candidate')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.packageEntitlement.updateMany).not.toHaveBeenCalled();
  });

  it('does not charge twice for a previously unlocked profile', async () => {
    prisma.cvUnlock.findUnique.mockResolvedValue({ id: 'existing' });
    const result = await service.unlock('hr', 'candidate');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.contact?.email).toBe(profile.email);
  });

  it('checks HR expiry and debits quota atomically before exposing contact', async () => {
    prisma.cvUnlock.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'unlock' });
    const result = await service.unlock('hr', 'candidate');
    expect(prisma.packageEntitlement.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'hr-ent',
        status: 'ACTIVE',
        startsAt: { lte: new Date() },
        endsAt: { gt: new Date() },
        talentPoolAccess: true,
        cvUnlockRemaining: { gt: 0 },
      },
      data: { cvUnlockRemaining: { decrement: 1 } },
    });
    expect(prisma.cvUnlock.create).toHaveBeenCalledTimes(1);
    expect(result.contact?.phone).toBe(profile.phone);
  });

  it('keeps contact hidden and creates no unlock when quota is exhausted concurrently', async () => {
    prisma.packageEntitlement.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.unlock('hr', 'candidate')).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.cvUnlock.create).not.toHaveBeenCalled();
  });

  it('returns the contact read inside the transaction without a fallible post-commit read', async () => {
    const tx = {
      candidateProfile: { findFirst: jest.fn().mockResolvedValue(profile) },
      packageEntitlement: prisma.packageEntitlement,
      cvUnlock: {
        create: jest.fn().mockResolvedValue({ id: 'unlock' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'unlock' }),
      },
    };
    // The candidate withdraws as the transaction commits. The authorized
    // response must already exist; a new read would return 404 after charging.
    prisma.candidateProfile.findFirst
      .mockResolvedValueOnce(profile)
      .mockResolvedValue(null);
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => unknown) => fn(tx),
    );

    const result = await service.unlock('hr', 'candidate');

    expect(result.contact?.email).toBe(profile.email);
    expect(prisma.candidateProfile.findFirst).toHaveBeenCalledTimes(1);
    expect(tx.cvUnlock.create).toHaveBeenCalledTimes(1);
    expect(entitlements.assertTalentPool).toHaveBeenCalledTimes(1);
  });

  it.each(['withdrawn', 'read failure'])(
    'aborts the quota transaction if the final contact read fails: %s',
    async (failure) => {
      const tx = {
        candidateProfile: {
          findFirst: jest.fn().mockResolvedValueOnce(profile),
        },
        packageEntitlement: prisma.packageEntitlement,
        cvUnlock: prisma.cvUnlock,
      };
      const error = new Error('Contact read unavailable');
      if (failure === 'withdrawn')
        tx.candidateProfile.findFirst.mockResolvedValueOnce(null);
      else tx.candidateProfile.findFirst.mockRejectedValueOnce(error);
      let committed = false;
      prisma.$transaction.mockImplementation(
        async (fn: (client: typeof tx) => unknown) => {
          const response = await fn(tx);
          committed = true;
          return response;
        },
      );

      await expect(service.unlock('hr', 'candidate')).rejects.toThrow(
        failure === 'withdrawn' ? NotFoundException : error,
      );
      expect(committed).toBe(false);
      expect(prisma.packageEntitlement.updateMany).toHaveBeenCalledTimes(1);
    },
  );
});
