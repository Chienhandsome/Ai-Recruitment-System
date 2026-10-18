import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CandidateJobSeekingService } from './candidate-job-seeking.service';
import { CandidatesService } from './candidates.service';
import { UpdateJobSeekingDto } from './dto/update-job-seeking.dto';
import { validate } from 'class-validator';

describe('CandidateJobSeekingService', () => {
  let prisma: any;
  let entitlements: any;
  let service: CandidateJobSeekingService;
  const until = new Date('2026-11-18T00:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-18T00:00:00Z'));
    prisma = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'candidate',
          userId: 'user',
          status: 'READY',
          desiredTitle: 'Engineer',
          professionalSummary: 'Backend engineer',
          jobSeekingEnabled: false,
          jobSeekingConfirmedAt: null,
          jobSeekingUntil: null,
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    entitlements = {
      getEffectiveEntitlement: jest.fn().mockResolvedValue({
        jobSeekingAccess: true,
        entitlementId: 'paid-entitlement',
        endsAt: until,
        packageName: 'Candidate Pro',
      }),
    };
    service = new CandidateJobSeekingService(prisma, entitlements);
  });
  afterEach(() => jest.useRealTimers());

  it('rejects direct activation on Free without publishing the profile', async () => {
    entitlements.getEffectiveEntitlement.mockResolvedValue({
      jobSeekingAccess: false,
      entitlementId: null,
      endsAt: null,
    });
    await expect(
      service.update('user', { enabled: true, consent: true }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.candidateProfile.update).not.toHaveBeenCalled();
  });

  it('requires explicit consent even when the candidate has paid', async () => {
    await expect(service.update('user', { enabled: true })).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.candidateProfile.update).not.toHaveBeenCalled();
  });

  it('rejects incomplete profiles and already expired paid plans', async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue({
      id: 'candidate',
      status: 'READY',
      desiredTitle: ' ',
      professionalSummary: 'Summary',
    });
    await expect(
      service.update('user', { enabled: true, consent: true }),
    ).rejects.toThrow(BadRequestException);
    prisma.candidateProfile.findUnique.mockResolvedValue({
      id: 'candidate',
      status: 'READY',
      desiredTitle: 'Engineer',
      professionalSummary: 'Summary',
    });
    entitlements.getEffectiveEntitlement.mockResolvedValue({
      jobSeekingAccess: true,
      entitlementId: 'old',
      endsAt: new Date(),
    });
    await expect(
      service.update('user', { enabled: true, consent: true }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.candidateProfile.update).not.toHaveBeenCalled();
  });

  it('binds explicit visibility to the paid entitlement and its expiry', async () => {
    await service.update('user', { enabled: true, consent: true });
    expect(prisma.candidateProfile.update).toHaveBeenCalledWith({
      where: { id: 'candidate' },
      data: {
        isProfilePublic: true,
        jobSeekingEnabled: true,
        jobSeekingConfirmedAt: new Date(),
        jobSeekingUntil: until,
        jobSeekingEntitlementId: 'paid-entitlement',
      },
    });
  });

  it('allows withdrawal after expiry and clears the visibility grant', async () => {
    entitlements.getEffectiveEntitlement.mockResolvedValue({
      jobSeekingAccess: false,
      entitlementId: null,
      endsAt: null,
    });
    await service.update('user', { enabled: false });
    expect(prisma.candidateProfile.update).toHaveBeenCalledWith({
      where: { id: 'candidate' },
      data: {
        isProfilePublic: false,
        jobSeekingEnabled: false,
        jobSeekingUntil: null,
        jobSeekingEntitlementId: null,
      },
    });
  });

  it('does not republish after purchase or renewal when checking status', async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue({
      id: 'candidate',
      status: 'READY',
      desiredTitle: 'Engineer',
      professionalSummary: 'Summary',
      jobSeekingEnabled: true,
      jobSeekingUntil: new Date('2026-10-17'),
    });
    const result = await service.getStatus('user');
    expect(result.canEnable).toBe(true);
    expect(result.visible).toBe(false);
    expect(prisma.candidateProfile.update).not.toHaveBeenCalled();
  });

  it('blocks the legacy profile-public toggle before any profile write', async () => {
    const profiles = new CandidatesService(prisma);
    await expect(
      profiles.updateProfile('user', { isProfilePublic: true }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.candidateProfile.findUnique).not.toHaveBeenCalled();
    expect(prisma.candidateProfile.update).not.toHaveBeenCalled();
  });

  it('validates the toggle as a required boolean rather than coercing strings', async () => {
    const missing = new UpdateJobSeekingDto();
    expect(await validate(missing)).not.toHaveLength(0);
    const invalid = Object.assign(new UpdateJobSeekingDto(), {
      enabled: 'false',
      consent: 'true',
    });
    expect(await validate(invalid)).toHaveLength(2);
  });
});
