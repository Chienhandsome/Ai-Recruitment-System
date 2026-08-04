import { CandidatesService } from './candidates.service';

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
      $transaction: jest.fn(async (callback) => callback(tx)),
    } as any;
    const service = new CandidatesService(prisma);

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
