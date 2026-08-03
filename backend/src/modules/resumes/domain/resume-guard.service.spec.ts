import { ResumeGuardService } from './resume-guard.service';

describe('ResumeGuardService', () => {
  it('marks a stale resume as SUPERSEDED and rejects hydration', async () => {
    const prisma = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ primaryResumeId: 'new' }),
      },
      resume: { update: jest.fn().mockResolvedValue(undefined) },
    } as any;
    const guard = new ResumeGuardService(prisma);

    await expect(guard.canHydrate('old', 'candidate')).resolves.toBe(false);
    expect(prisma.resume.update).toHaveBeenCalledWith({
      where: { id: 'old' },
      data: { parsingStatus: 'SUPERSEDED' },
    });
  });
});
