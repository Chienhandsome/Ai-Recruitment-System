import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TalentResumeService } from './talent-resume.service';
import { talentPoolVisibilityWhere } from './talent-pool-visibility';

const resume = {
  id: 'resume-1',
  candidateId: 'candidate-1',
  parsingStatus: 'PARSED',
  originalFileName: 'CV gốc.pdf',
  objectPath: 'candidates/candidate-1/resumes/resume-1/cv.pdf',
  storageBucket: 'legacy-resumes',
  mimeType: 'application/pdf',
};
function setup() {
  const prisma = {
    candidateProfile: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: 'candidate-1', primaryResume: { ...resume } }),
    },
    cvUnlock: { findUnique: jest.fn().mockResolvedValue({ id: 'unlock-1' }) },
  };
  const entitlements = { assertTalentPool: jest.fn().mockResolvedValue({}) };
  const storage = {
    createSignedDownloadUrl: jest.fn().mockResolvedValue({
      signedUrl: 'https://storage.example/signed',
      expiresIn: 60,
    }),
  };
  const service = new TalentResumeService(
    prisma as never,
    entitlements as never,
    storage as never,
  );
  return { prisma, entitlements, storage, service };
}

describe('TalentResumeService', () => {
  beforeEach(() =>
    jest.useFakeTimers().setSystemTime(new Date('2026-10-27T10:00:00Z')),
  );
  afterEach(() => jest.useRealTimers());
  it('returns a 60-second preview of the current CV from its recorded bucket without consuming credits', async () => {
    const { service, prisma, storage } = setup();
    const result = await service.access('hr-1', 'candidate-1', 'preview');
    expect(result).toMatchObject({
      url: 'https://storage.example/signed',
      fileName: resume.originalFileName,
      mimeType: resume.mimeType,
    });
    expect(Date.parse(result.expiresAt) - Date.now()).toBeGreaterThan(59000);
    expect(storage.createSignedDownloadUrl).toHaveBeenCalledWith(
      resume.objectPath,
      60,
      { bucket: resume.storageBucket },
    );
    expect(prisma.candidateProfile.findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 'candidate-1', ...talentPoolVisibilityWhere() },
      }),
    );
    expect(prisma.candidateProfile.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          id: 'candidate-1',
          primaryResumeId: resume.id,
          ...talentPoolVisibilityWhere(),
        },
      }),
    );
    expect(JSON.stringify(result)).not.toContain(resume.objectPath);
  });

  it('scopes unlock to the requesting HR and candidate', async () => {
    const { service, prisma, storage } = setup();
    prisma.cvUnlock.findUnique.mockResolvedValue(null);
    await expect(
      service.access('other-hr', 'candidate-1', 'download'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.cvUnlock.findUnique).toHaveBeenCalledWith({
      where: {
        unlockedByUserId_candidateProfileId: {
          unlockedByUserId: 'other-hr',
          candidateProfileId: 'candidate-1',
        },
      },
      select: { id: true },
    });
    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('blocks expired HR access before any profile or file lookup', async () => {
    const { service, entitlements, prisma, storage } = setup();
    entitlements.assertTalentPool.mockRejectedValue(new ForbiddenException());
    await expect(
      service.access('hr-1', 'candidate-1', 'preview'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.candidateProfile.findFirst).not.toHaveBeenCalled();
    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('blocks hidden, expired or unavailable profiles even after unlock', async () => {
    const { service, prisma, storage } = setup();
    prisma.candidateProfile.findFirst.mockResolvedValue(null);
    await expect(
      service.access('hr-1', 'candidate-1', 'download'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it.each(['PENDING', 'PROCESSING', 'FAILED'])(
    'does not serve a %s primary CV or fall back to an older one',
    async (parsingStatus) => {
      const { service, prisma, storage } = setup();
      prisma.candidateProfile.findFirst.mockResolvedValue({
        primaryResume: { ...resume, parsingStatus },
      });
      await expect(
        service.access('hr-1', 'candidate-1', 'download'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
    },
  );

  it.each([
    null,
    { ...resume, candidateId: 'another-candidate' },
    { ...resume, objectPath: '' },
  ])(
    'rejects an absent, mismatched or unuploaded CV',
    async (primaryResume) => {
      const { service, prisma, storage } = setup();
      prisma.candidateProfile.findFirst.mockResolvedValue({ primaryResume });
      await expect(
        service.access('hr-1', 'candidate-1', 'download'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.createSignedDownloadUrl).not.toHaveBeenCalled();
    },
  );

  it('downloads DOCX as original and rejects inline preview', async () => {
    const { service, prisma, storage } = setup();
    const docx = {
      ...resume,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      originalFileName: 'CV gốc.docx',
    };
    prisma.candidateProfile.findFirst.mockResolvedValue({
      primaryResume: docx,
    });
    await expect(
      service.access('hr-1', 'candidate-1', 'preview'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.access('hr-1', 'candidate-1', 'download'),
    ).resolves.toMatchObject({ fileName: docx.originalFileName });
    expect(storage.createSignedDownloadUrl).toHaveBeenCalledWith(
      resume.objectPath,
      60,
      { bucket: resume.storageBucket, download: docx.originalFileName },
    );
  });

  it('does not return a URL if consent or primary CV changes during storage I/O', async () => {
    const { service, prisma } = setup();
    prisma.candidateProfile.findFirst
      .mockResolvedValueOnce({ primaryResume: resume })
      .mockResolvedValueOnce(null);
    await expect(
      service.access('hr-1', 'candidate-1', 'preview'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates a missing storage file as an error rather than returning a broken URL', async () => {
    const { service, storage } = setup();
    storage.createSignedDownloadUrl.mockRejectedValue(
      new BadRequestException('File not found'),
    );
    await expect(
      service.access('hr-1', 'candidate-1', 'download'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
