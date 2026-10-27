/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matchers */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TalentInvitationStatus } from '@prisma/client';
import { TalentInvitationsService } from './talent-invitations.service';

const now = new Date('2026-10-20T10:00:00Z');
const pending = {
  id: 'invite-1',
  recruiterUserId: 'hr-1',
  candidateId: 'candidate-1',
  jobId: 'job-1',
  status: TalentInvitationStatus.PENDING,
  expiresAt: new Date('2026-10-27T10:00:00Z'),
  applicationId: null,
  candidate: {
    id: 'candidate-1',
    userId: 'candidate-user-1',
    fullName: 'Candidate',
  },
  job: { id: 'job-1', title: 'Backend Developer' },
};

function setup() {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    candidateProfile: {
      findFirst: jest.fn().mockResolvedValue(pending.candidate),
    },
    cvUnlock: { findUnique: jest.fn().mockResolvedValue({ id: 'unlock-1' }) },
    jobPosting: {
      findFirst: jest.fn().mockResolvedValue({
        ...pending.job,
        autoCloseOnQuota: false,
        targetHires: 1,
        status: 'PUBLISHED',
        expiryDate: null,
      }),
    },
    application: {
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
    talentInvitation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            ...pending,
            ...data,
          }),
        ),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    application: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
    talentInvitation: {
      findFirst: jest.fn().mockResolvedValue(pending),
      findMany: jest.fn().mockResolvedValue([pending]),
      count: jest.fn().mockResolvedValue(1),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    resume: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const applications = {
    applyForJob: jest
      .fn()
      .mockResolvedValue({ applicationId: 'application-1' }),
  };
  const entitlements = {
    assertTalentPool: jest.fn().mockResolvedValue({}),
    getApplicantCapForJobOwner: jest.fn().mockResolvedValue(null),
  };
  const notifications = {
    createNotificationOnce: jest.fn().mockResolvedValue({ count: 1 }),
  };
  const service = new TalentInvitationsService(
    prisma as never,
    applications as never,
    entitlements as never,
    notifications as never,
  );
  return { service, prisma, tx, applications, entitlements, notifications };
}

describe('TalentInvitationsService', () => {
  it('keeps closed/full jobs with an existing application selectable for this candidate', async () => {
    const { service, prisma, entitlements } = setup();
    const jobs = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'closed-job',
          jobCode: 'OLD',
          title: 'Engineer',
          location: null,
          _count: { applications: 20 },
          applications: [{ id: 'old-application' }],
        },
        {
          id: 'full-job',
          jobCode: 'FULL',
          title: 'Engineer',
          location: null,
          _count: { applications: 20 },
          applications: [],
        },
        {
          id: 'open-job',
          jobCode: 'OPEN',
          title: 'Engineer',
          location: null,
          _count: { applications: 0 },
          applications: [],
        },
      ]),
    };
    Object.assign(prisma, { jobPosting: jobs });
    entitlements.getApplicantCapForJobOwner.mockResolvedValue(5);
    const result = await service.availableJobs('hr-1', 'candidate-1');
    expect(result.data.map((job) => job.id)).toEqual([
      'closed-job',
      'open-job',
    ]);
    expect(result.data[0].existingApplicationId).toBe('old-application');
    expect(jobs.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recruiter: { userId: 'hr-1' },
          OR: expect.arrayContaining([
            { applications: { some: { candidateId: 'candidate-1' } } },
          ]),
        }),
        select: expect.objectContaining({
          applications: {
            where: { candidateId: 'candidate-1' },
            select: { id: true },
            take: 1,
          },
        }),
      }),
    );
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });
  afterEach(() => jest.useRealTimers());

  it('sends a seven-day invitation and recipient notification without consuming another credit', async () => {
    const { service, tx, notifications } = setup();
    const result = await service.create(
      'hr-1',
      { jobId: 'job-1', candidateId: 'candidate-1', message: ' Join us ' },
      now,
    );
    expect(result).toMatchObject({
      alreadyApplied: false,
      invitation: {
        expiresAt: new Date('2026-10-27T10:00:00Z'),
        message: 'Join us',
      },
    });
    expect(tx.cvUnlock.findUnique).toHaveBeenCalledWith({
      where: {
        unlockedByUserId_candidateProfileId: {
          unlockedByUserId: 'hr-1',
          candidateProfileId: 'candidate-1',
        },
      },
    });
    expect(notifications.createNotificationOnce).toHaveBeenCalledWith(
      tx,
      'talent-invitation:invite-1:created',
      expect.objectContaining({ recipientUserId: 'candidate-user-1' }),
    );
  });

  it('blocks sending without a prior unlock', async () => {
    const { service, tx } = setup();
    tx.cvUnlock.findUnique.mockResolvedValue(null);
    await expect(
      service.create(
        'hr-1',
        { jobId: 'job-1', candidateId: 'candidate-1' },
        now,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.talentInvitation.create).not.toHaveBeenCalled();
  });

  it('blocks a candidate who has withdrawn from the talent pool', async () => {
    const { service, tx } = setup();
    tx.candidateProfile.findFirst.mockResolvedValue(null);
    await expect(
      service.create(
        'hr-1',
        { jobId: 'job-1', candidateId: 'candidate-1' },
        now,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires a job owned by the sending HR', async () => {
    const { service, tx } = setup();
    tx.jobPosting.findFirst.mockResolvedValue(null);
    await expect(
      service.create(
        'hr-1',
        { jobId: 'someone-elses-job', candidateId: 'candidate-1' },
        now,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.jobPosting.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recruiter: { userId: 'hr-1' },
        }),
      }),
    );
  });

  it('opens an existing application instead of sending a new invitation', async () => {
    const { service, tx } = setup();
    tx.application.findUnique.mockResolvedValue({ id: 'application-1' });
    await expect(
      service.create(
        'hr-1',
        { jobId: 'job-1', candidateId: 'candidate-1' },
        now,
      ),
    ).resolves.toEqual({
      applicationId: 'application-1',
      alreadyApplied: true,
    });
    expect(tx.talentInvitation.create).not.toHaveBeenCalled();
  });

  it.each(['CLOSED', 'DRAFT'])(
    'opens an existing application for a %s job',
    async (status) => {
      const { service, tx, entitlements } = setup();
      tx.jobPosting.findFirst.mockResolvedValue({
        ...pending.job,
        status,
        expiryDate: new Date('2020-01-01'),
        autoCloseOnQuota: true,
        targetHires: 1,
      });
      tx.application.findUnique.mockResolvedValue({ id: 'old-application' });
      await expect(
        service.create(
          'hr-1',
          { jobId: 'job-1', candidateId: 'candidate-1' },
          now,
        ),
      ).resolves.toEqual({
        applicationId: 'old-application',
        alreadyApplied: true,
      });
      expect(entitlements.getApplicantCapForJobOwner).not.toHaveBeenCalled();
      expect(tx.talentInvitation.create).not.toHaveBeenCalled();
    },
  );

  it('still rejects new invitations to a closed job', async () => {
    const { service, tx } = setup();
    tx.jobPosting.findFirst.mockResolvedValue({
      ...pending.job,
      status: 'CLOSED',
      expiryDate: null,
      autoCloseOnQuota: false,
      targetHires: 1,
    });
    await expect(
      service.create(
        'hr-1',
        { jobId: 'job-1', candidateId: 'candidate-1' },
        now,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.talentInvitation.create).not.toHaveBeenCalled();
  });

  it.each(['WITHDRAWN', 'EXPIRED'])(
    'links a submitted application in a %s inbox item without accepting it',
    async (status) => {
      const { service, prisma, tx } = setup();
      prisma.talentInvitation.findMany.mockResolvedValue([
        { ...pending, status },
      ]);
      prisma.application.findMany.mockResolvedValue([
        {
          id: 'old-application',
          candidateId: pending.candidateId,
          jobId: pending.jobId,
        },
      ]);
      const result = await service.listForCandidate('candidate-user-1', {
        page: 1,
        limit: 12,
      });
      expect(result.data[0]).toMatchObject({
        status,
        applicationId: null,
        existingApplicationId: 'old-application',
      });
      expect(tx.talentInvitation.updateMany).not.toHaveBeenCalled();
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ candidateId: pending.candidateId, jobId: pending.jobId }],
          },
        }),
      );
    },
  );

  it('rejects an applicant-capped job', async () => {
    const { service, tx, entitlements } = setup();
    entitlements.getApplicantCapForJobOwner.mockResolvedValue(5);
    tx.application.count.mockResolvedValue(5);
    await expect(
      service.create(
        'hr-1',
        { jobId: 'job-1', candidateId: 'candidate-1' },
        now,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.talentInvitation.create).not.toHaveBeenCalled();
  });

  it('rejects another pending invitation for the same candidate and job', async () => {
    const { service, tx } = setup();
    tx.talentInvitation.findFirst.mockResolvedValue(pending);
    await expect(
      service.create(
        'hr-1',
        { jobId: 'job-1', candidateId: 'candidate-1' },
        now,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('accepts an old invitation without requiring current job-seeking visibility', async () => {
    const { service, applications, tx, prisma } = setup();
    await expect(
      service.accept('candidate-user-1', pending.id, 'resume-1'),
    ).resolves.toEqual({ applicationId: 'application-1' });
    expect(prisma.talentInvitation.findFirst).toHaveBeenCalledWith({
      where: { id: pending.id, candidate: { userId: 'candidate-user-1' } },
    });
    expect(tx.candidateProfile.findFirst).not.toHaveBeenCalled();
    expect(applications.applyForJob).toHaveBeenCalledWith(
      'candidate-user-1',
      { jobId: 'job-1', resumeId: 'resume-1' },
      now,
      'invite-1',
    );
  });

  it('never accepts an invitation addressed to another user', async () => {
    const { service, prisma, applications } = setup();
    prisma.talentInvitation.findFirst.mockResolvedValue(null);
    await expect(
      service.accept('other-user', pending.id, 'resume-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(applications.applyForJob).not.toHaveBeenCalled();
  });

  it('returns the linked application on a repeated accept', async () => {
    const { service, prisma, applications } = setup();
    prisma.talentInvitation.findFirst.mockResolvedValue({
      ...pending,
      status: TalentInvitationStatus.ACCEPTED,
      applicationId: 'application-1',
    });
    await expect(
      service.accept('candidate-user-1', pending.id, 'resume-1'),
    ).resolves.toEqual({ applicationId: 'application-1', reused: true });
    expect(applications.applyForJob).not.toHaveBeenCalled();
  });

  it.each(['DECLINED', 'WITHDRAWN', 'EXPIRED'] as const)(
    'rejects accepting a %s invitation',
    async (status) => {
      const { service, prisma, applications } = setup();
      prisma.talentInvitation.findFirst.mockResolvedValue({
        ...pending,
        status,
      });
      await expect(
        service.accept('candidate-user-1', pending.id, 'resume-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(applications.applyForJob).not.toHaveBeenCalled();
    },
  );

  it('rejects a pending invitation exactly at its expiry', async () => {
    const { service, prisma } = setup();
    prisma.talentInvitation.findFirst.mockResolvedValue({
      ...pending,
      expiresAt: now,
    });
    await expect(
      service.accept('candidate-user-1', pending.id, 'resume-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not overwrite an acceptance that wins the race with withdrawal', async () => {
    const { service, tx, notifications } = setup();
    tx.talentInvitation.findFirst.mockResolvedValue(pending);
    tx.talentInvitation.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.withdraw('hr-1', pending.id)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(notifications.createNotificationOnce).not.toHaveBeenCalled();
    expect(tx.talentInvitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PENDING',
          expiresAt: { gt: now },
        }),
      }),
    );
  });

  it('scopes candidate inboxes to the logged-in recipient, ignoring candidateId supplied by the client', async () => {
    const { service, prisma } = setup();
    await service.listForCandidate('candidate-user-1', {
      page: 1,
      limit: 12,
      candidateId: 'someone-else',
    });
    expect(prisma.talentInvitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { candidate: { userId: 'candidate-user-1' } },
      }),
    );
  });

  it('only exposes the logged-in candidates parsed CVs for acceptance', async () => {
    const { service, prisma } = setup();
    await service.availableResumes('candidate-user-1');
    expect(prisma.resume.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          candidate: { userId: 'candidate-user-1' },
          parsingStatus: 'PARSED',
        },
      }),
    );
  });

  it('returns an expired status even when a previously pending row was read', async () => {
    const { service, prisma } = setup();
    prisma.talentInvitation.findMany.mockResolvedValue([
      { ...pending, expiresAt: now },
    ]);
    const result = await service.listForCandidate('candidate-user-1', {
      page: 1,
      limit: 12,
    });
    expect(result.data[0].status).toBe('EXPIRED');
  });

  it('notifies the sender when the intended recipient declines', async () => {
    const { service, tx, notifications } = setup();
    tx.talentInvitation.findFirst.mockResolvedValue(pending);
    await expect(
      service.decline('candidate-user-1', pending.id),
    ).resolves.toEqual({ id: pending.id, status: 'DECLINED' });
    expect(tx.talentInvitation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { candidate: { userId: 'candidate-user-1' } },
            { id: pending.id },
          ],
        },
      }),
    );
    expect(notifications.createNotificationOnce).toHaveBeenCalledWith(
      tx,
      'talent-invitation:invite-1:DECLINED',
      expect.objectContaining({ recipientUserId: 'hr-1' }),
    );
  });

  it('recovers the committed application when a competing acceptance has filled the job', async () => {
    const { service, applications, prisma } = setup();
    applications.applyForJob.mockRejectedValue(
      new NotFoundException('Job no longer open'),
    );
    prisma.talentInvitation.findFirst
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce({
        ...pending,
        status: 'ACCEPTED',
        applicationId: 'application-1',
      });
    await expect(
      service.accept('candidate-user-1', pending.id, 'resume-1'),
    ).resolves.toEqual({ applicationId: 'application-1', reused: true });
  });

  it('translates the database duplicate constraint into a conflict under simultaneous sends', async () => {
    const { service, tx, notifications } = setup();
    let inserted = false;
    tx.talentInvitation.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        if (inserted)
          throw new Prisma.PrismaClientKnownRequestError(
            'unique pending invitation',
            { code: 'P2002', clientVersion: '6.4.0' },
          );
        inserted = true;
        return Promise.resolve({ ...pending, ...data });
      },
    );
    const results = await Promise.allSettled([
      service.create(
        'hr-1',
        { candidateId: 'candidate-1', jobId: 'job-1' },
        now,
      ),
      service.create(
        'hr-1',
        { candidateId: 'candidate-1', jobId: 'job-1' },
        now,
      ),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected'),
    ).toMatchObject({ reason: expect.any(ConflictException) });
    expect(notifications.createNotificationOnce).toHaveBeenCalledTimes(1);
  });
});
