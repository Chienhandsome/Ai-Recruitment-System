import { ApplicationsService } from './applications.service';

describe('Candidate application deep link', () => {
  it('filters the linked application within the current candidate scope', async () => {
    const prisma = {
      application: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new ApplicationsService(
      prisma as never,
      {} as never,
      {
        candidateProfileId: jest.fn().mockResolvedValue('own-candidate'),
      } as never,
      {} as never,
      {} as never,
    );
    const result = await service.findMine('user-1', {
      applicationId: 'other-application',
      page: 1,
      limit: 20,
    });
    expect(result.data).toEqual([]);
    expect(prisma.application.count).toHaveBeenCalledWith({
      where: { candidateId: 'own-candidate', id: 'other-application' },
    });
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { candidateId: 'own-candidate', id: 'other-application' },
      }),
    );
  });
});
