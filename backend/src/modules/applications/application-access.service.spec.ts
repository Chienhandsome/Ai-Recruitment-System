import { NotFoundException } from '@nestjs/common';
import { ApplicationAccessService } from './application-access.service';

describe('ApplicationAccessService', () => {
  it('scopes a company recruiter to jobs in the same company', async () => {
    const prisma = {
      recruiterProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'recruiter-1',
          companyId: 'company-1',
        }),
      },
    };
    const service = new ApplicationAccessService(prisma as never);

    await expect(
      service.recruiterApplicationWhere('recruiter-user-1'),
    ).resolves.toEqual({
      job: { recruiter: { companyId: 'company-1' } },
    });
  });

  it('scopes a standalone recruiter to their own jobs', async () => {
    const prisma = {
      recruiterProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'recruiter-1',
          companyId: null,
        }),
      },
    };
    const service = new ApplicationAccessService(prisma as never);

    await expect(
      service.recruiterApplicationWhere('recruiter-user-1'),
    ).resolves.toEqual({ job: { recruiterId: 'recruiter-1' } });
  });

  it('rejects users without the required profile', async () => {
    const prisma = {
      recruiterProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      candidateProfile: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new ApplicationAccessService(prisma as never);

    await expect(
      service.recruiterApplicationWhere('unknown-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.candidateProfileId('unknown-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
