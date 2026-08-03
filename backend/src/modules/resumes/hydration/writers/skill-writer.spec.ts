import { SkillWriter } from './skill-writer';

describe('SkillWriter', () => {
  it('removes only EXTRACTED skills and preserves self-declared skills', async () => {
    const tx = {
      candidateSkill: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue({ source: 'SELF_DECLARED' }),
        upsert: jest.fn(),
      },
    } as any;
    const writer = new SkillWriter();

    await writer.write(tx, 'candidate', 'resume', [
      {
        skillId: 'skill',
        proficiencyLevel: 'EXPERT',
        isInferred: false,
        sourceText: 'Expert Python',
      },
    ]);

    expect(tx.candidateSkill.deleteMany).toHaveBeenCalledWith({
      where: { candidateId: 'candidate', source: 'EXTRACTED' },
    });
    expect(tx.candidateSkill.upsert).not.toHaveBeenCalled();
  });
});
