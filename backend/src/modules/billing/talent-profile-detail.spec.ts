import { TalentPoolService } from './talent-pool.service';

const profile = {
  id: 'candidate-1',
  fullName: 'Nguyễn Minh An',
  email: 'an@example.invalid',
  phone: '0901234567',
  address: '123 Road, District 1, HCM',
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  desiredTitle: 'Backend Engineer',
  professionalSummary: 'Node.js, 5 năm kinh nghiệm',
  preferredModel: 'REMOTE',
  expectedMinSalary: 20000000,
  expectedMaxSalary: 30000000,
  projects: [
    {
      projectName: 'Project an@example.invalid',
      projectRole: 'Developer',
      description: 'Liên hệ 0901234567',
      technologies: ['Node.js', 'an@example.invalid'],
      projectUrl: 'https://example.invalid/an',
    },
  ],
  certificates: [
    {
      certificateName: 'Cloud',
      issuingOrganization: 'Nguyễn Minh An an@example.invalid',
      credentialUrl: 'https://example.invalid/cert',
    },
  ],
  primaryResume: {
    id: 'resume-1',
    candidateId: 'candidate-1',
    originalFileName: 'Nguyen-Minh-An.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1024,
    parsingStatus: 'PARSED',
    updatedAt: new Date('2026-10-01'),
  },
};
function setup(unlocked: boolean) {
  const prisma = {
    candidateProfile: { findFirst: jest.fn().mockResolvedValue(profile) },
    cvUnlock: {
      findUnique: jest
        .fn()
        .mockResolvedValue(unlocked ? { id: 'unlock-1' } : null),
    },
  };
  const service = new TalentPoolService(
    prisma as never,
    { assertTalentPool: jest.fn().mockResolvedValue({}) } as never,
  );
  return { service, prisma };
}
describe('Full talent profile serialization', () => {
  it('redacts every added text section, withholds links and CV metadata while locked', async () => {
    const { service } = setup(false);
    const response = await service.getCandidate('hr-1', profile.id);
    expect(response.resume).toBeNull();
    expect(response.projects).toEqual([
      expect.objectContaining({ projectUrl: null }),
    ]);
    expect(response.certificates).toEqual([
      expect.objectContaining({ credentialUrl: null }),
    ]);
    const serialized = JSON.stringify(response);
    for (const value of [
      'an@example.invalid',
      '0901234567',
      'Nguyễn Minh An',
      profile.primaryResume.originalFileName,
      'resume-1',
    ])
      expect(serialized).not.toContain(value);
    expect(serialized).toContain('Node.js');
  });
  it('returns original professional data and CV metadata after unlock, without any storage locator or signed URL', async () => {
    const { service } = setup(true);
    const response = await service.getCandidate('hr-1', profile.id);
    expect(response.projects).toEqual(profile.projects);
    expect(response.certificates).toEqual(profile.certificates);
    expect(response.resume).toMatchObject({
      id: 'resume-1',
      fileName: profile.primaryResume.originalFileName,
      status: 'PARSED',
    });
    expect(response.contact).toMatchObject({ email: profile.email });
    expect(JSON.stringify(response)).not.toMatch(
      /objectPath|storageBucket|signedUrl/,
    );
  });
  it('does not expose CV metadata from a mismatched candidate', async () => {
    const { service, prisma } = setup(true);
    prisma.candidateProfile.findFirst.mockResolvedValue({
      ...profile,
      primaryResume: {
        ...profile.primaryResume,
        candidateId: 'another-candidate',
      },
    });
    expect((await service.getCandidate('hr-1', profile.id)).resume).toBeNull();
  });
});
