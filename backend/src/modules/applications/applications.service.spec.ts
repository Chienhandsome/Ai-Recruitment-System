/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationsService } from './applications.service';

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
    },
    jobPosting: { findFirst: jest.fn().mockResolvedValue(job) },
  };
  const evaluationService = {
    dispatchNewApplication: jest.fn().mockResolvedValue(true),
    markForRetry: jest.fn().mockResolvedValue(undefined),
  };
  return { prisma, evaluationService };
}

describe('ApplicationsService', () => {
  it('creates an application from an owned parsed resume and immutable snapshot', async () => {
    const { prisma, evaluationService } = createDependencies();
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
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

  it('rejects a resume that is not owned by the current candidate', async () => {
    const { prisma, evaluationService } = createDependencies();
    prisma.resume.findFirst.mockResolvedValue(null);
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
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
    const { prisma, evaluationService } = createDependencies();
    prisma.jobPosting.findFirst.mockResolvedValue(null);
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
    );

    await expect(
      service.applyForJob(candidateProfile.userId, { jobId: job.id }, now),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique-constraint race to HTTP 409', async () => {
    const { prisma, evaluationService } = createDependencies();
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
    );

    await expect(
      service.applyForJob(candidateProfile.userId, { jobId: job.id }, now),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(evaluationService.dispatchNewApplication).not.toHaveBeenCalled();
  });

  it('returns a truthful retry status when the first publish fails', async () => {
    const { prisma, evaluationService } = createDependencies();
    evaluationService.dispatchNewApplication.mockResolvedValue(false);
    const service = new ApplicationsService(
      prisma as never,
      evaluationService as never,
      {} as never,
    );

    const result = await service.applyForJob(
      candidateProfile.userId,
      { jobId: job.id },
      now,
    );

    expect(result.evaluationStatus).toBe('RETRY_SCHEDULED');
    expect(result.message).toContain('thử lại');
  });
});
