import { ResumeHydrationService } from './resume-hydration.service';

const parsedData = {
  skills: [],
  work_experiences: [],
  educations: [],
  projects: [],
  certificates: [],
};

function createService(prismaOverrides: Record<string, unknown> = {}) {
  const prisma = {
    resume: {
      findUnique: jest.fn().mockResolvedValue({ parsingStatus: 'PROCESSING' }),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    ...prismaOverrides,
  } as any;
  const guard = { canHydrate: jest.fn().mockResolvedValue(true) } as any;
  const skillResolver = { resolveAll: jest.fn().mockResolvedValue([]) } as any;
  const writer = { write: jest.fn() } as any;
  const profileWriter = {
    write: jest.fn().mockResolvedValue(true),
  } as any;

  return {
    prisma,
    guard,
    skillResolver,
    writer,
    service: new ResumeHydrationService(
      prisma,
      guard,
      skillResolver,
      writer,
      writer,
      writer,
      writer,
      writer,
      profileWriter,
    ),
  };
}

describe('ResumeHydrationService', () => {
  it('skips a sequential duplicate result before resolving or writing', async () => {
    const { service, prisma, skillResolver, writer } = createService({
      resume: {
        findUnique: jest.fn().mockResolvedValue({ parsingStatus: 'PARSED' }),
        update: jest.fn(),
      },
    });

    await service.hydrateProfile('resume', 'candidate', parsedData);

    expect(skillResolver.resolveAll).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(writer.write).not.toHaveBeenCalled();
  });

  it('skips writers when another transaction already claimed the result', async () => {
    const tx = {
      candidateProfile: {
        findUnique: jest.fn().mockResolvedValue({ primaryResumeId: 'resume' }),
      },
      resume: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const { service, writer } = createService({
      $transaction: jest
        .fn()
        .mockImplementation(async (callback) => callback(tx)),
    });

    await service.hydrateProfile('resume', 'candidate', parsedData);

    expect(tx.resume.updateMany).toHaveBeenCalledWith({
      where: { id: 'resume', parsingStatus: { not: 'PARSED' } },
      data: { parsingStatus: 'PARSED', parsingErrorMessage: null },
    });
    expect(writer.write).not.toHaveBeenCalled();
  });

  it('does not fail the profile when a non-primary resume fails', async () => {
    const tx = {
      resume: { update: jest.fn().mockResolvedValue(undefined) },
      candidateProfile: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const { service, prisma } = createService({
      $transaction: jest
        .fn()
        .mockImplementation(async (callback) => callback(tx)),
    });

    await service.handleFailure('old-resume', 'candidate', 'parse failed');

    expect(tx.candidateProfile.updateMany).toHaveBeenCalledWith({
      where: { id: 'candidate', primaryResumeId: 'old-resume' },
      data: { status: 'FAILED' },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
