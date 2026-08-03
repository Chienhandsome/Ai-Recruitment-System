import { ProfileWriter } from './profile-writer';

describe('ProfileWriter', () => {
  it('writes explicit nulls instead of retaining stale inferred fields', async () => {
    const tx = {
      candidateProfile: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;
    const writer = new ProfileWriter();

    await writer.write(tx, 'candidate', 'resume', {
      summary: null,
      desired_title: null,
      skills: [],
      work_experiences: [],
      educations: [],
      projects: [],
      certificates: [],
    });

    expect(tx.candidateProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 'candidate', primaryResumeId: 'resume' },
      data: {
        status: 'READY',
        professionalSummary: null,
        desiredTitle: null,
      },
    });
  });

  it('marks low-confidence extraction for review', async () => {
    const tx = {
      candidateProfile: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;
    const writer = new ProfileWriter();

    await writer.write(tx, 'candidate', 'resume', {
      overall_confidence: 0.59,
      skills: [],
      work_experiences: [],
      educations: [],
      projects: [],
      certificates: [],
    });

    expect(tx.candidateProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'NEEDS_REVIEW' }),
      }),
    );
  });
});
