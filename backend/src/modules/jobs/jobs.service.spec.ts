/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';

const publishedJob = {
  id: 'job-1',
  jobCode: 'JOB-2608-1001',
  title: 'Backend Engineer',
  recruiterId: 'recruiter-1',
  departmentId: 'department-1',
  description: 'Build reliable APIs.',
  requirements: 'NestJS experience',
  benefits: 'Flexible working',
  employmentType: 'FULL_TIME',
  experienceLevel: 'MIDDLE',
  status: 'PUBLISHED',
  minSalary: 20_000_000,
  maxSalary: 30_000_000,
  currency: 'VND',
  location: 'Ho Chi Minh City',
  requiredExperienceYears: 3,
  autoShortlistThreshold: 80,
  autoRejectThreshold: 40,
  rejectOnMissingMandatory: true,
  skillWeight: 40,
  experienceWeight: 30,
  educationWeight: 15,
  otherWeight: 15,
  expiryDate: new Date('2026-09-01T00:00:00.000Z'),
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  closedAt: null,
  createdAt: new Date('2026-07-31T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  categoryId: 'category-1',
  workingModel: 'HYBRID',
  requiresProofOfWork: false,
  proofOfWorkType: null,
  recruiter: {
    company: { id: 'company-1', name: 'Công ty Công nghệ Việt', logoUrl: null },
  },
  department: { id: 'department-1', name: 'Engineering' },
  category: {
    id: 'category-1',
    name: 'Công nghệ thông tin',
    slug: 'it-software',
  },
  jobSkills: [
    {
      requirementType: 'MANDATORY',
      skill: { id: 'skill-1', name: 'NestJS' },
    },
  ],
  jobCertificates: [
    {
      id: 'certificate-1',
      certificateName: 'AWS Certified Developer',
      requirementType: 'PREFERRED',
    },
  ],
};

describe('JobsService candidate browsing', () => {
  it('only queries active published jobs and returns a safe paginated contract', async () => {
    const prisma = {
      jobPosting: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([publishedJob]),
      },
    } as any;
    const service = new JobsService(prisma);

    const result = await service.findCandidateJobs({
      search: 'NestJS',
      page: 1,
      limit: 12,
    });

    expect(prisma.jobPosting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PUBLISHED',
          OR: [{ expiryDate: null }, { expiryDate: { gt: expect.any(Date) } }],
          AND: expect.any(Array),
        }),
        skip: 0,
        take: 12,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    );
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 12,
      totalPages: 1,
    });
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: 'job-1',
        minSalary: 20_000_000,
        maxSalary: 30_000_000,
        company: expect.objectContaining({ name: 'Công ty Công nghệ Việt' }),
        skills: [
          { id: 'skill-1', name: 'NestJS', requirementType: 'MANDATORY' },
        ],
      }),
    );
    expect(result.data[0]).not.toHaveProperty('autoRejectThreshold');
    expect(result.data[0]).not.toHaveProperty('skillWeight');
    expect(result.data[0]).not.toHaveProperty('recruiterId');
  });

  it('returns candidate-safe details for an available job', async () => {
    const prisma = {
      jobPosting: { findFirst: jest.fn().mockResolvedValue(publishedJob) },
      candidateProfile: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const service = new JobsService(prisma);

    const result = await service.findCandidateJobById('job-1', 'user-1');

    expect(prisma.jobPosting.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'job-1',
          status: 'PUBLISHED',
          OR: [{ expiryDate: null }, { expiryDate: { gt: expect.any(Date) } }],
        },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        description: 'Build reliable APIs.',
        requirements: 'NestJS experience',
        certificates: [
          {
            id: 'certificate-1',
            name: 'AWS Certified Developer',
            requirementType: 'PREFERRED',
          },
        ],
      }),
    );
    expect(result).not.toHaveProperty('autoShortlistThreshold');
  });

  it('hides draft, closed, and expired jobs behind a not-found response', async () => {
    const prisma = {
      jobPosting: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any;
    const service = new JobsService(prisma);

    await expect(
      service.findCandidateJobById('unavailable-job', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
