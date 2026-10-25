/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { EvaluationPayloadBuilder } from '../evaluation/evaluation-payload.builder';

const now = new Date('2026-08-09T10:00:00.000Z');

const candidateProfile = {
  id: 'candidate-1',
  userId: '11111111-1111-4111-8111-111111111111',
  status: 'READY',
  fullName: 'Nguyen Van A',
  email: 'candidate@example.com',
  phone: '0900000000',
  address: 'Ho Chi Minh City',
  desiredTitle: 'Backend Engineer',
  professionalSummary: 'NestJS developer',
  linkedinUrl: null,
  githubUrl: 'https://github.com/candidate',
  portfolioUrl: null,
  primaryResumeId: 'resume-1',
  expectedMinSalary: null,
  expectedMaxSalary: null,
  preferredModel: 'HYBRID',
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-08T00:00:00.000Z'),
  workExperiences: [
    {
      id: 'experience-1',
      candidateProfileId: 'candidate-1',
      source: 'MANUAL',
      resumeId: null,
      companyName: 'Acme',
      positionTitle: 'Developer',
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: null,
      isCurrent: true,
      description: 'Built APIs',
      achievements: 'Improved latency',
      isInferred: false,
      sourceText: null,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    },
  ],
  educations: [],
  projects: [],
  certificates: [],
  candidateSkills: [
    {
      id: 'candidate-skill-1',
      candidateId: 'candidate-1',
      resumeId: 'resume-1',
      skillId: 'skill-1',
      proficiencyLevel: 'ADVANCED',
      isPrimary: true,
      source: 'EXTRACTED',
      isInferred: false,
      sourceText: null,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      skill: {
        id: 'skill-1',
        categoryId: 'category-1',
        name: 'NestJS',
        normalizedName: 'nestjs',
        type: 'TECHNICAL',
        aliases: [],
        description: null,
        isActive: true,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
        updatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    },
  ],
};

const resume = {
  id: 'resume-1',
  candidateId: 'candidate-1',
  source: 'CANDIDATE_UPLOAD',
  originalFileName: 'resume.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 1234,
  parsingStatus: 'PARSED',
  createdAt: new Date('2026-08-02T00:00:00.000Z'),
};

const job = {
  id: 'job-1',
  jobCode: 'JOB-1',
  title: 'Backend Engineer',
  recruiterId: 'recruiter-1',
  departmentId: null,
  description: 'Build APIs',
  requirements: 'NestJS',
  benefits: 'Remote work',
  employmentType: 'FULL_TIME',
  experienceLevel: 'MIDDLE',
  status: 'PUBLISHED',
  minSalary: null,
  maxSalary: null,
  currency: 'VND',
  location: 'Ho Chi Minh City',
  workingModel: 'HYBRID',
  requiresProofOfWork: false,
  proofOfWorkType: null,
  requiredExperienceYears: 2,
  levelRequirementMode: 'ADVISORY',
  autoShortlistThreshold: null,
  autoRejectThreshold: null,
  rejectOnMissingMandatory: false,
  skillWeight: 40,
  experienceWeight: 30,
  educationWeight: 15,
  otherWeight: 15,
  expiryDate: new Date('2026-09-01T00:00:00.000Z'),
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  closedAt: null,
  categoryId: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-08T00:00:00.000Z'),
  jobSkills: [
    {
      id: 'job-skill-1',
      jobId: 'job-1',
      skillId: 'skill-1',
      requirementType: 'MANDATORY',
      minimumProficiency: 'INTERMEDIATE',
      weight: null,
      skill: candidateProfile.candidateSkills[0].skill,
    },
  ],
  jobCertificates: [],
};

function createDependencies() {
  const prisma = {
    candidateProfile: {
      findUnique: jest.fn().mockResolvedValue(candidateProfile),
    },
    resume: { findFirst: jest.fn().mockResolvedValue(resume) },
    application: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'application-1' }),
      count: jest.fn().mockResolvedValue(0),
    },
    jobPosting: {
      findFirst: jest.fn().mockResolvedValue({
        ...job,
        recruiter: { userId: 'recruiter-user-1' },
      }),
    },
  };
  const evaluationService = {
    dispatchNewApplication: jest.fn().mockResolvedValue(true),
    markForRetry: jest.fn().mockResolvedValue(undefined),
  };
  const entitlements = {
    getEffectiveEntitlement: jest.fn().mockResolvedValue({
      packageCode: 'HR_PRO',
      aiRanking: true,
      advancedFilters: true,
    }),
    getApplicantCapForJobOwner: jest.fn().mockResolvedValue(null),
    hideJobIfApplicantCapReached: jest.fn().mockResolvedValue(null),
  };
  return { prisma, evaluationService, entitlements };
}

describe('ApplicationsService', () => {
  it('creates an application from an owned parsed resume and immutable snapshot', async () => {
    const { prisma, evaluationService, entitlements } = createDependencies();
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
      entitlements as never,
      new EvaluationPayloadBuilder() as never,
    );

    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id },
      now,
    );

    expect(prisma.resume.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: resume.id, candidateId: candidateProfile.id },
      }),
    );
    expect(prisma.jobPosting.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: job.id,
          status: 'PUBLISHED',
          OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
        },
      }),
    );

    const createData = prisma.application.create.mock.calls[0][0].data;
    expect(createData).toEqual(
      expect.objectContaining({
        jobId: job.id,
        candidateId: candidateProfile.id,
        resumeId: resume.id,
        processingStatus: 'QUEUED',
      }),
    );
    expect(createData.profileSnapshot).toEqual(
      expect.objectContaining({
        schemaVersion: 2,
        capturedAt: now.toISOString(),
        candidateIdentity: expect.objectContaining({
          email: candidateProfile.email,
        }),
        resume: expect.objectContaining({ id: resume.id }),
        evaluationInput: expect.objectContaining({
          candidate_profile: expect.any(Object),
          job: expect.objectContaining({
            id: job.id,
            experience_level: job.experienceLevel,
            evaluation_date: now.toISOString(),
          }),
        }),
      }),
    );
    const evaluationInput = createData.profileSnapshot.evaluationInput;
    expect(evaluationInput.candidate_profile.skills[0]).toEqual(
      expect.objectContaining({
        skill_id: 'skill-1',
        skill_name: 'NestJS',
        normalized_name: 'nestjs',
      }),
    );
    expect(evaluationInput.job.required_skills[0]).toEqual(
      expect.objectContaining({
        skill_id: 'skill-1',
        skill_name: 'NestJS',
        normalized_name: 'nestjs',
      }),
    );
    expect(evaluationService.dispatchNewApplication).toHaveBeenCalledWith(
      'application-1',
      now,
    );
    expect(result).toEqual(
      expect.objectContaining({
        applicationId: 'application-1',
        evaluationStatus: 'QUEUED',
      }),
    );
  });

  it('notifies the recruiter when a candidate applies', async () => {
    const { prisma, evaluationService, entitlements } = createDependencies();
    const notificationsService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
      entitlements as never,
      new EvaluationPayloadBuilder() as never,
      notificationsService as never,
    );

    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id },
      now,
    );

    expect(result.applicationId).toBe('application-1');
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'recruiter-user-1',
        type: 'APPLICATION_STATUS_CHANGED',
        applicationId: 'application-1',
        title: expect.stringContaining('Backend Engineer'),
        message: expect.stringContaining('Nguyen Van A'),
      }),
    );
  });

  it('rejects a resume that is not owned by the current candidate', async () => {
    const { prisma, evaluationService, entitlements } = createDependencies();
    prisma.resume.findFirst.mockResolvedValue(null);
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
      entitlements as never,
      new EvaluationPayloadBuilder() as never,
    );

    await expect(
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id, resumeId: 'another-candidate-resume' },
        now,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('rejects jobs that are not published or are expired', async () => {
    const { prisma, evaluationService, entitlements } = createDependencies();
    prisma.jobPosting.findFirst.mockResolvedValue(null);
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
      entitlements as never,
      new EvaluationPayloadBuilder() as never,
    );

    await expect(
      service.applyForJob(candidateProfile.userId, { jobId: job.id }, now),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique-constraint race to HTTP 409', async () => {
    const { prisma, evaluationService, entitlements } = createDependencies();
    prisma.application.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate application', {
        code: 'P2002',
        clientVersion: '6.4.0',
      }),
    );
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
      entitlements as never,
      new EvaluationPayloadBuilder() as never,
    );

    await expect(
      service.applyForJob(candidateProfile.userId, { jobId: job.id }, now),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(evaluationService.dispatchNewApplication).not.toHaveBeenCalled();
  });

  it('returns a truthful retry status when the first publish fails', async () => {
    const { prisma, evaluationService, entitlements } = createDependencies();
    evaluationService.dispatchNewApplication.mockResolvedValue(false);
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
      entitlements as never,
      new EvaluationPayloadBuilder() as never,
    );

    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id },
      now,
    );

    expect(result.evaluationStatus).toBe('RETRY_SCHEDULED');
    expect(result.message).toContain('thử lại');
  });

  it('permanently deletes a recruiter-scoped application and its notifications', async () => {
    const scope = { job: { recruiterId: 'recruiter-1' } };
    const transactionClient = {
      application: {
        findFirst: jest.fn().mockResolvedValue({ id: 'application-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'application-1' }),
      },
      notification: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        async (
          callback: (client: typeof transactionClient) => Promise<unknown>,
        ) => callback(transactionClient),
      ),
    };
    const accessService = {
      recruiterApplicationWhere: jest.fn().mockResolvedValue(scope),
    };
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      accessService as never,
      {
        getEffectiveEntitlement: jest.fn(),
      } as never,
      new EvaluationPayloadBuilder() as never,
    );

    await expect(
      service.removeForRecruiter('recruiter-user-1', 'application-1'),
    ).resolves.toEqual({
      message: 'Application and related data permanently deleted.',
      applicationId: 'application-1',
      deleted: true,
    });
    expect(transactionClient.application.findFirst).toHaveBeenCalledWith({
      where: { AND: [scope, { id: 'application-1' }] },
      select: { id: true },
    });
    expect(transactionClient.notification.deleteMany).toHaveBeenCalledWith({
      where: { applicationId: 'application-1' },
    });
    expect(transactionClient.application.delete).toHaveBeenCalledWith({
      where: { id: 'application-1' },
    });
  });

  it('does not delete related data when the application is outside recruiter scope', async () => {
    const transactionClient = {
      application: {
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      },
      notification: { deleteMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        async (
          callback: (client: typeof transactionClient) => Promise<unknown>,
        ) => callback(transactionClient),
      ),
    };
    const accessService = {
      recruiterApplicationWhere: jest
        .fn()
        .mockResolvedValue({ job: { recruiterId: 'recruiter-1' } }),
    };
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      accessService as never,
      {
        getEffectiveEntitlement: jest.fn(),
      } as never,
      new EvaluationPayloadBuilder() as never,
    );

    await expect(
      service.removeForRecruiter('recruiter-user-1', 'application-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionClient.notification.deleteMany).not.toHaveBeenCalled();
    expect(transactionClient.application.delete).not.toHaveBeenCalled();
  });
});

function invitationApplicationDependencies() {
  const dependencies = createDependencies();
  const tx = {
    ...dependencies.prisma,
    $queryRaw: jest.fn().mockResolvedValue([]),
    talentInvitation: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'invite-1',
        status: 'ACCEPTED',
        applicationId: null,
        recruiterUserId: 'recruiter-user-1',
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };
  const notifications = {
    createNotificationOnce: jest.fn().mockResolvedValue({ count: 1 }),
    createNotification: jest.fn().mockResolvedValue({}),
  };
  const service = new ApplicationsService(
    prisma as never,
    dependencies.evaluationService as never,
    {} as never,
    dependencies.entitlements as never,
    new EvaluationPayloadBuilder() as never,
    notifications as never,
  );
  return { ...dependencies, prisma, tx, notifications, service };
}

describe('ApplicationsService invitation acceptance', () => {
  it('creates a TALENT_POOL_INVITE application, links it atomically and dispatches normal evaluation', async () => {
    const { service, tx, evaluationService, notifications } =
      invitationApplicationDependencies();
    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id, resumeId: resume.id },
      now,
      'invite-1',
    );
    expect(result.applicationId).toBe('application-1');
    expect(tx.talentInvitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'invite-1',
          candidateId: candidateProfile.id,
          jobId: job.id,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
      }),
    );
    expect(tx.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'TALENT_POOL_INVITE',
          resumeId: resume.id,
        }),
      }),
    );
    expect(tx.talentInvitation.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { applicationId: 'application-1' },
    });
    expect(evaluationService.dispatchNewApplication).toHaveBeenCalledTimes(1);
    expect(notifications.createNotificationOnce).toHaveBeenCalledWith(
      tx,
      'talent-invitation:invite-1:ACCEPTED',
      expect.objectContaining({ applicationId: 'application-1' }),
    );
  });

  it('cannot accept when a withdrawal or expiry wins the conditional claim', async () => {
    const { service, tx, evaluationService } =
      invitationApplicationDependencies();
    tx.talentInvitation.updateMany.mockResolvedValue({ count: 0 });
    tx.talentInvitation.findFirst.mockResolvedValue({ status: 'WITHDRAWN' });
    await expect(
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id },
        now,
        'invite-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.application.create).not.toHaveBeenCalled();
    expect(evaluationService.dispatchNewApplication).not.toHaveBeenCalled();
  });

  it('returns the existing linked application after a concurrent repeated accept, without dispatching again', async () => {
    const { service, tx, evaluationService } =
      invitationApplicationDependencies();
    tx.talentInvitation.updateMany.mockResolvedValue({ count: 0 });
    tx.talentInvitation.findFirst.mockResolvedValue({
      status: 'ACCEPTED',
      applicationId: 'existing-application',
    });
    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id },
      now,
      'invite-1',
    );
    expect(result).toMatchObject({
      applicationId: 'existing-application',
      reused: true,
    });
    expect(tx.application.create).not.toHaveBeenCalled();
    expect(evaluationService.dispatchNewApplication).not.toHaveBeenCalled();
  });

  it('links a direct application that arrives before acceptance obtains the job lock', async () => {
    const { service, tx, evaluationService } =
      invitationApplicationDependencies();
    tx.application.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'direct-application' });
    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id },
      now,
      'invite-1',
    );
    expect(result).toMatchObject({
      applicationId: 'direct-application',
      reused: true,
    });
    expect(tx.application.create).not.toHaveBeenCalled();
    expect(tx.talentInvitation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { applicationId: 'direct-application' },
      }),
    );
    expect(evaluationService.dispatchNewApplication).not.toHaveBeenCalled();
  });

  it('rechecks publication after acquiring the job lock', async () => {
    const { service, tx } = invitationApplicationDependencies();
    tx.jobPosting.findFirst
      .mockResolvedValueOnce({
        ...job,
        recruiter: { userId: 'recruiter-user-1' },
      })
      .mockResolvedValueOnce(null);
    await expect(
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id },
        now,
        'invite-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.application.create).not.toHaveBeenCalled();
  });

  it('does not bypass applicant limits when accepting an invitation', async () => {
    const { service, tx, entitlements } = invitationApplicationDependencies();
    entitlements.getApplicantCapForJobOwner.mockResolvedValue(1);
    tx.application.count.mockResolvedValue(1);
    await expect(
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id },
        now,
        'invite-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.application.create).not.toHaveBeenCalled();
  });

  it('retains CV ownership and parsing checks for invited candidates', async () => {
    const { service, tx } = invitationApplicationDependencies();
    tx.resume.findFirst.mockResolvedValue(null);
    await expect(
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id, resumeId: 'someone-elses-cv' },
        now,
        'invite-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.talentInvitation.updateMany).not.toHaveBeenCalled();
  });

  it('creates and evaluates only once when two accepts run together', async () => {
    const { service, tx, prisma, evaluationService } =
      invitationApplicationDependencies();
    const state = {
      status: 'PENDING',
      applicationId: null as string | null,
      recruiterUserId: 'recruiter-user-1',
    };
    let applicationId: string | null = null;
    let queue = Promise.resolve();
    // Simulate the serialization provided by the job row lock in PostgreSQL.
    prisma.$transaction.mockImplementation((fn) => {
      const result = queue.then(() => fn(tx));
      queue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    });
    tx.talentInvitation.updateMany.mockImplementation(async () => {
      if (state.status !== 'PENDING') return { count: 0 };
      state.status = 'ACCEPTED';
      return { count: 1 };
    });
    tx.talentInvitation.findFirst.mockImplementation(async () => ({
      ...state,
    }));
    tx.talentInvitation.update.mockImplementation(async () => {
      state.applicationId = applicationId;
      return {};
    });
    tx.application.findUnique.mockImplementation(async () =>
      applicationId ? { id: applicationId } : null,
    );
    tx.application.create.mockImplementation(async () => {
      applicationId = 'application-1';
      return { id: applicationId };
    });
    const results = await Promise.all([
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id },
        now,
        'invite-1',
      ),
      service.applyForJob(
        candidateProfile.userId,
        { jobId: job.id },
        now,
        'invite-1',
      ),
    ]);
    expect(results.map((result) => result.applicationId)).toEqual([
      'application-1',
      'application-1',
    ]);
    expect(tx.application.create).toHaveBeenCalledTimes(1);
    expect(evaluationService.dispatchNewApplication).toHaveBeenCalledTimes(1);
  });
});
