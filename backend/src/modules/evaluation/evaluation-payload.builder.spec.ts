import { EvaluationPayloadBuilder } from './evaluation-payload.builder';

const now = new Date('2026-08-09T10:00:00.000Z');

const profile = {
  id: 'candidate-1',
  userId: '11111111-1111-4111-8111-111111111111',
  status: 'READY',
  fullName: 'Nguyen Van A',
  email: 'candidate@example.com',
  phone: '0900000000',
  address: 'HCMC',
  desiredTitle: 'Backend Engineer',
  professionalSummary: 'NestJS developer',
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  primaryResumeId: 'resume-1',
  isProfilePublic: false,
  expectedMinSalary: null,
  expectedMaxSalary: null,
  preferredModel: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-08T00:00:00.000Z'),
  workExperiences: [
    {
      id: 'exp-1',
      candidateProfileId: 'candidate-1',
      source: 'EXTRACTED',
      resumeId: 'resume-1',
      companyName: 'Acme',
      positionTitle: 'Developer',
      startDate: new Date('2024-01-01T00:00:00.000Z'),
      endDate: null,
      isCurrent: true,
      description: 'APIs',
      achievements: null,
      isInferred: false,
      sourceText: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'exp-other',
      candidateProfileId: 'candidate-1',
      source: 'EXTRACTED',
      resumeId: 'resume-other',
      companyName: 'OtherCo',
      positionTitle: 'Intern',
      startDate: new Date('2023-01-01T00:00:00.000Z'),
      endDate: new Date('2023-06-01T00:00:00.000Z'),
      isCurrent: false,
      description: 'Other CV',
      achievements: null,
      isInferred: false,
      sourceText: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
  educations: [],
  projects: [],
  certificates: [],
  candidateSkills: [
    {
      id: 'cs-1',
      candidateId: 'candidate-1',
      resumeId: 'resume-1',
      skillId: 'skill-1',
      proficiencyLevel: 'ADVANCED',
      isPrimary: true,
      source: 'EXTRACTED',
      isInferred: false,
      sourceText: null,
      createdAt: now,
      skill: {
        id: 'skill-1',
        categoryId: null,
        name: 'NestJS',
        normalizedName: 'nestjs',
        type: 'TECHNICAL',
        aliases: [],
        description: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  ],
} as never;

const resume = {
  id: 'resume-1',
  candidateId: 'candidate-1',
  source: 'CANDIDATE_UPLOAD',
  originalFileName: 'cv.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 1000,
  parsingStatus: 'PARSED',
  createdAt: now,
  parsedData: { languageData: [{ language: 'English', proficiency: 'B2' }] },
} as never;

const job = {
  id: 'job-1',
  title: 'Backend Engineer',
  employmentType: 'FULL_TIME',
  workingModel: 'HYBRID',
  minSalary: null,
  maxSalary: null,
  location: 'HCMC',
  requiredExperienceYears: 2,
  experienceLevel: 'MIDDLE',
  levelRequirementMode: 'ADVISORY',
  description: 'Build APIs',
  requirements: 'NestJS',
  benefits: null,
  status: 'PUBLISHED',
  publishedAt: now,
  createdAt: now,
  updatedAt: now,
  closedAt: null,
  skillWeight: 40,
  experienceWeight: 30,
  educationWeight: 15,
  otherWeight: 15,
  jobSkills: [
    {
      id: 'js-1',
      jobId: 'job-1',
      skillId: 'skill-1',
      requirementType: 'MANDATORY',
      minimumProficiency: 'INTERMEDIATE',
      weight: null,
      skill: {
        id: 'skill-1',
        name: 'NestJS',
        normalizedName: 'nestjs',
      },
    },
  ],
  jobCertificates: [],
} as never;

describe('EvaluationPayloadBuilder', () => {
  const builder = new EvaluationPayloadBuilder();

  it('builds EvaluationRequest-compatible payload', () => {
    const payload = builder.buildEvaluationRequest({
      applicationId: 'candidate-jd-fit:req-1',
      profile: profile as never,
      resume: resume as never,
      job: job as never,
      capturedAt: now,
    });

    expect(payload).toEqual(
      expect.objectContaining({
        application_id: 'candidate-jd-fit:req-1',
        schema_version: 2,
        evaluation_date: now.toISOString(),
        weights: {
          skills: 40,
          experience: 30,
          education: 15,
          other: 15,
        },
      }),
    );
    expect(payload.candidate_profile).toEqual(
      expect.objectContaining({
        profile: expect.objectContaining({ id: 'candidate-1' }),
        skills: expect.arrayContaining([
          expect.objectContaining({
            skill_name: 'NestJS',
            normalized_name: 'nestjs',
          }),
        ]),
        languages: [{ language: 'English', proficiency: 'B2' }],
      }),
    );
    expect(payload.job).toEqual(
      expect.objectContaining({
        id: 'job-1',
        required_skills: [
          expect.objectContaining({
            skill_name: 'NestJS',
            is_mandatory: true,
          }),
        ],
        ai_weights_config: payload.weights,
      }),
    );
  });

  it('scopes profile data to the selected resumeId', () => {
    const scoped = builder.scopeCandidateProfileToResume(
      profile as never,
      'resume-1',
    );
    expect(scoped.workExperiences).toHaveLength(1);
    expect(scoped.workExperiences[0].id).toBe('exp-1');
  });

  it('HR snapshot keeps unscoped relations (same scores path)', () => {
    const snapshot = builder.buildProfileSnapshot(
      profile as never,
      resume as never,
      job as never,
      now,
    );
    expect(snapshot.evaluationInput.candidate_profile).toEqual(
      expect.objectContaining({
        work_experiences: expect.arrayContaining([
          expect.objectContaining({ company_name: 'Acme' }),
          expect.objectContaining({ company_name: 'OtherCo' }),
        ]),
      }),
    );
  });
});
