import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedUser } from './auth.types';

const authUser: AuthenticatedUser = {
  id: 'c4695eb4-0c4c-4a21-ad0f-8cd42dfbfdb5',
  email: 'candidate@example.com',
  fullName: 'Candidate Example',
};

describe('AuthService', () => {
  it('requires a public role when initializing a new user', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const service = new AuthService(prisma);

    await expect(service.bootstrap(authUser, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('does not change the role of an existing user', async () => {
    const existingUser = {
      id: authUser.id,
      email: authUser.email,
      fullName: authUser.fullName,
      phone: null,
      avatarUrl: null,
      userStatus: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'CANDIDATE',
      candidateProfile: {
        id: 'candidate-profile',
        userId: authUser.id,
        address: null,
        linkedinUrl: null,
        githubUrl: null,
        portfolioUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      recruiterProfile: null,
    };

    const update = jest.fn().mockResolvedValue(existingUser);
    const transaction = jest.fn();
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(existingUser),
        update,
      },
      $transaction: transaction,
    } as unknown as PrismaService;
    const service = new AuthService(prisma);

    const result = await service.bootstrap(authUser, { role: 'RECRUITER' });

    expect(result.roles).toEqual(['CANDIDATE']);
    expect(transaction).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: authUser.id },
      }),
    );
  });
});
