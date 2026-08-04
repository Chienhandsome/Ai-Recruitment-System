import { CandidatesService } from './candidates.service';
import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import type { UpdateCandidateSkillsDto } from './dto/update-candidate-skills.dto';

describe('CandidatesService profile provenance', () => {
  it('preserves unchanged extracted records and saves edited records as manual', async () => {
    const workExperience = {
      findMany: jest.fn().mockResolvedValue([{ id: 'extracted-keep' }]),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const tx = {
      candidateProfile: {
        update: jest.fn().mockResolvedValue({ id: 'candidate' }),
      },
      workExperience,
    };
    const prisma = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'candidate' }),
      },
      user: { update: jest.fn() },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new CandidatesService(prisma as unknown as PrismaService);

    await service.updateProfile('user', {
      workExperiences: [
        {
          id: 'extracted-keep',
          source: 'EXTRACTED',
          companyName: 'Keep Co',
          positionTitle: 'Engineer',
        },
        {
          id: 'extracted-edited',
          source: 'MANUAL',
          companyName: 'Edited Co',
          positionTitle: 'Senior Engineer',
        },
      ],
    });

    expect(workExperience.findMany).toHaveBeenCalledWith({
      where: {
        candidateProfileId: 'candidate',
        source: 'EXTRACTED',
        id: { in: ['extracted-keep'] },
      },
      select: { id: true },
    });
    expect(workExperience.deleteMany).toHaveBeenCalledWith({
      where: {
        candidateProfileId: 'candidate',
        OR: [
          { source: 'MANUAL' },
          { source: 'EXTRACTED', id: { notIn: ['extracted-keep'] } },
        ],
      },
    });
    expect(workExperience.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          candidateProfileId: 'candidate',
          source: 'MANUAL',
          resumeId: null,
          companyName: 'Edited Co',
        }),
      ],
    });
  });
});

describe('CandidatesService unified skill editing', () => {
  it('preserves untouched AI skills and promotes only candidate changes', async () => {
    const candidateSkill = {
      findMany: jest.fn().mockResolvedValue([
        {
          skillId: 'ai-unchanged',
          proficiencyLevel: 'INTERMEDIATE',
          isPrimary: false,
          source: 'EXTRACTED',
        },
        {
          skillId: 'ai-edited',
          proficiencyLevel: 'BEGINNER',
          isPrimary: false,
          source: 'EXTRACTED',
        },
        {
          skillId: 'ai-removed',
          proficiencyLevel: 'ADVANCED',
          isPrimary: false,
          source: 'EXTRACTED',
        },
        {
          skillId: 'manual-kept',
          proficiencyLevel: 'ADVANCED',
          isPrimary: true,
          source: 'SELF_DECLARED',
        },
        {
          skillId: 'verified',
          proficiencyLevel: 'EXPERT',
          isPrimary: true,
          source: 'VERIFIED',
        },
      ]),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      upsert: jest.fn().mockResolvedValue({}),
    };
    const tx = { candidateSkill };
    const prisma = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'candidate' }),
      },
      candidateSkill: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new CandidatesService(prisma as unknown as PrismaService);

    await service.updateCandidateSkills('candidate', {
      skills: [
        {
          skillId: 'ai-unchanged',
          proficiencyLevel: 'INTERMEDIATE',
          isPrimary: false,
        },
        {
          skillId: 'ai-edited',
          proficiencyLevel: 'ADVANCED',
          isPrimary: true,
        },
        {
          skillId: 'manual-kept',
          proficiencyLevel: 'ADVANCED',
          isPrimary: true,
        },
        {
          skillId: 'new-skill',
          proficiencyLevel: 'BEGINNER',
          isPrimary: false,
        },
        {
          skillId: 'verified',
          proficiencyLevel: 'BEGINNER',
          isPrimary: false,
        },
      ],
    } as unknown as UpdateCandidateSkillsDto);

    expect(candidateSkill.deleteMany).toHaveBeenCalledWith({
      where: {
        candidateId: 'candidate',
        source: { in: ['EXTRACTED', 'SELF_DECLARED'] },
        skillId: {
          notIn: [
            'ai-unchanged',
            'ai-edited',
            'manual-kept',
            'new-skill',
            'verified',
          ],
        },
      },
    });
    expect(candidateSkill.upsert).toHaveBeenCalledTimes(3);
    expect(candidateSkill.upsert).toHaveBeenNthCalledWith(1, {
      where: {
        candidateId_skillId: {
          candidateId: 'candidate',
          skillId: 'ai-edited',
        },
      },
      update: {
        proficiencyLevel: 'ADVANCED',
        isPrimary: true,
        source: 'SELF_DECLARED',
        resumeId: null,
        isInferred: false,
        sourceText: null,
      },
      create: {
        candidateId: 'candidate',
        skillId: 'ai-edited',
        proficiencyLevel: 'ADVANCED',
        isPrimary: true,
        source: 'SELF_DECLARED',
      },
    });
    expect(candidateSkill.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          candidateId_skillId: {
            candidateId: 'candidate',
            skillId: 'manual-kept',
          },
        },
      }),
    );
    expect(candidateSkill.upsert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          candidateId_skillId: {
            candidateId: 'candidate',
            skillId: 'new-skill',
          },
        },
      }),
    );
  });

  it('allows removing an AI skill but protects a verified skill', async () => {
    const candidateSkill = {
      findUnique: jest
        .fn()
        .mockResolvedValueOnce({ source: 'EXTRACTED' })
        .mockResolvedValueOnce({ source: 'VERIFIED' }),
      delete: jest.fn().mockResolvedValue({}),
    };
    const service = new CandidatesService({
      candidateSkill,
    } as unknown as PrismaService);

    await service.removeCandidateSkill('candidate', 'ai-skill');
    expect(candidateSkill.delete).toHaveBeenCalledWith({
      where: {
        candidateId_skillId: {
          candidateId: 'candidate',
          skillId: 'ai-skill',
        },
      },
    });

    await expect(
      service.removeCandidateSkill('candidate', 'verified-skill'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
