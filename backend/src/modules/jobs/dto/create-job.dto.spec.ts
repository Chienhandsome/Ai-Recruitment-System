import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LevelRequirementMode } from '@prisma/client';
import { CreateJobDto } from './create-job.dto';

describe('CreateJobDto experience-level requirement', () => {
  const basePayload = {
    title: 'Backend Developer',
    description: 'Build backend services',
  };

  it('accepts both supported requirement modes', async () => {
    for (const mode of [
      LevelRequirementMode.ADVISORY,
      LevelRequirementMode.REQUIRED,
    ]) {
      const dto = plainToInstance(CreateJobDto, {
        ...basePayload,
        levelRequirementMode: mode,
      });

      expect(await validate(dto)).toHaveLength(0);
    }
  });

  it('rejects an unknown requirement mode and negative experience years', async () => {
    const dto = plainToInstance(CreateJobDto, {
      ...basePayload,
      levelRequirementMode: 'BLOCKING',
      requiredExperienceYears: -1,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'levelRequirementMode',
        'requiredExperienceYears',
      ]),
    );
  });
});
