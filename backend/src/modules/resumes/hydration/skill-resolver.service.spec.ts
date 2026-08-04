import { SkillNormalizerService } from '../domain/skill-normalizer.service';
import { SkillResolverService } from './skill-resolver.service';

describe('SkillResolverService', () => {
  it('uses only active official skills and preserves evidence', async () => {
    const prisma = {
      skill: {
        findFirst: jest.fn().mockResolvedValue({ id: 'python' }),
      },
      unrecognizedSkill: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;
    const resolver = new SkillResolverService(
      prisma,
      new SkillNormalizerService(),
    );

    const result = await resolver.resolveAll([
      {
        name: 'Python',
        proficiency_level: 'ADVANCED',
        category_hint: 'IT',
        is_inferred: false,
        source_text: 'Python (Advanced)',
      },
    ]);

    expect(prisma.skill.findFirst).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
        OR: [
          { normalizedName: 'python' },
          { name: { equals: 'Python', mode: 'insensitive' } },
          {
            skillAliases: {
              some: {
                aliasName: { equals: 'Python', mode: 'insensitive' },
              },
            },
          },
        ],
      },
    });
    expect(result).toEqual([
      {
        skillId: 'python',
        proficiencyLevel: 'ADVANCED',
        isInferred: false,
        sourceText: 'Python (Advanced)',
      },
    ]);
    expect(prisma.unrecognizedSkill.create).not.toHaveBeenCalled();
  });

  it('queues an unknown skill for review instead of creating an active skill', async () => {
    const prisma = {
      skill: { findFirst: jest.fn().mockResolvedValue(null) },
      unrecognizedSkill: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'queued' }),
        update: jest.fn(),
      },
    } as any;
    const resolver = new SkillResolverService(
      prisma,
      new SkillNormalizerService(),
    );

    await expect(
      resolver.resolveAll([
        {
          name: 'Stakeholder Management',
          proficiency_level: 'INTERMEDIATE',
          category_hint: 'Business',
        },
      ]),
    ).resolves.toEqual([]);

    expect(prisma.unrecognizedSkill.create).toHaveBeenCalledWith({
      data: {
        rawSkillName: 'Stakeholder Management',
        normalizedName: 'stakeholder-management',
        categoryHint: 'Business',
        status: 'PENDING',
      },
    });
  });

  it('increments the canonical normalized review item', async () => {
    const prisma = {
      skill: { findFirst: jest.fn().mockResolvedValue(null) },
      unrecognizedSkill: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'queued',
          normalizedName: 'c-sharp',
          categoryHint: 'IT',
        }),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as any;
    const resolver = new SkillResolverService(
      prisma,
      new SkillNormalizerService(),
    );

    await resolver.resolveAll([
      {
        name: 'C#',
        proficiency_level: 'BEGINNER',
        category_hint: 'IT',
      },
    ]);

    expect(prisma.unrecognizedSkill.findFirst).not.toHaveBeenCalled();
    expect(prisma.unrecognizedSkill.update).toHaveBeenCalledWith({
      where: { id: 'queued' },
      data: {
        normalizedName: 'c-sharp',
        categoryHint: 'IT',
        frequency: { increment: 1 },
      },
    });
  });

  it('resolves an admin-mapped alias to its active skill', async () => {
    const prisma = {
      skill: { findFirst: jest.fn().mockResolvedValue({ id: 'nodejs' }) },
      unrecognizedSkill: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;
    const resolver = new SkillResolverService(
      prisma,
      new SkillNormalizerService(),
    );

    await expect(
      resolver.resolveAll([
        {
          name: 'Node JS',
          proficiency_level: 'ADVANCED',
          category_hint: 'IT',
        },
      ]),
    ).resolves.toEqual([
      {
        skillId: 'nodejs',
        proficiencyLevel: 'ADVANCED',
        isInferred: false,
        sourceText: null,
      },
    ]);

    expect(prisma.skill.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: 'ACTIVE',
        OR: expect.arrayContaining([
          {
            skillAliases: {
              some: {
                aliasName: { equals: 'Node JS', mode: 'insensitive' },
              },
            },
          },
        ]),
      }),
    });
  });
});
