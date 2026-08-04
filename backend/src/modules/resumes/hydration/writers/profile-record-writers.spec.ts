import { CertificateWriter } from './certificate-writer';
import { EducationWriter } from './education-writer';
import { ExperienceWriter } from './experience-writer';
import { ProjectWriter } from './project-writer';

describe('Extracted profile record writers', () => {
  it('replaces every old extracted record while preserving manual records', async () => {
    const cases = [
      [new ExperienceWriter(), 'workExperience'],
      [new EducationWriter(), 'education'],
      [new ProjectWriter(), 'project'],
      [new CertificateWriter(), 'certificate'],
    ] as const;

    for (const [writer, repository] of cases) {
      const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      const tx = {
        [repository]: {
          deleteMany,
          createMany: jest.fn(),
        },
      } as any;

      await writer.write(tx, 'candidate', 'current-resume', []);

      expect(deleteMany).toHaveBeenCalledWith({
        where: { candidateProfileId: 'candidate', source: 'EXTRACTED' },
      });
    }
  });
});
