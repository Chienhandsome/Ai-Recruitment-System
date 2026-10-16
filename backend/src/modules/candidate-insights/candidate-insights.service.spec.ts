import {
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  NotFoundException,
} from '@nestjs/common';
import { MatchLevel, ResumeParsingStatus } from '@prisma/client';
import { CandidateInsightsService } from './candidate-insights.service';
import { EvaluationPayloadBuilder } from '../evaluation/evaluation-payload.builder';
import { AiMatchingClientError } from '../evaluation/ai-matching.client';

const userId = '11111111-1111-4111-8111-111111111111';
const jobId = 'job-1';
const resumeId = 'resume-1';
const requestId = 'jd-fit_test_request_001';

const skill = {
  id: 'skill-1',
  categoryId: null,
  name: 'NestJS',
  normalizedName: 'nestjs',
  type: 'TECHNICAL',
  aliases: [],
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const candidateProfile = {
  id: 'candidate-1',
  userId,
  primaryResumeId: resumeId,
  fullName: 'Candidate',
  email: 'c@example.com',
  phone: null,
  address: null,
  desiredTitle: 'Backend',
  professionalSummary: 'NestJS',
  githubUrl: null,
  linkedinUrl: null,
  portfolioUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  workExperiences: [],
  educations: [],
  projects: [],
  certificates: [],
  candidateSkills: [
    {
      id: 'cs-1',
      candidateId: 'candidate-1',
      resumeId,
      skillId: skill.id,
      proficiencyLevel: 'ADVANCED',
      isPrimary: true,
      source: 'EXTRACTED',
      isInferred: false,
      sourceText: null,
      createdAt: new Date(),
      skill,
    },
  ],
};

const resume = {
  id: resumeId,
  candidateId: 'candidate-1',
  source: 'CANDIDATE_UPLOAD',
  originalFileName: 'cv.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 10,
  parsingStatus: ResumeParsingStatus.PARSED,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  parsedData: { languageData: [] },
};

const job = {
  id: jobId,
  title: 'Backend Engineer',
  employmentType: 'FULL_TIME',
  workingModel: 'HYBRID',
  minSalary: null,
  maxSalary: null,
  location: 'HCMC',
  requiredExperienceYears: 2,
  experienceLevel: 'MIDDLE',
  levelRequirementMode: 'ADVISORY',
  description: 'APIs',
  requirements: 'NestJS',
  benefits: null,
  status: 'PUBLISHED',
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  closedAt: null,
  skillWeight: 40,
  experienceWeight: 30,
  educationWeight: 15,
  otherWeight: 15,
  jobSkills: [
    {
      id: 'js-1',
      jobId,
      skillId: skill.id,
      requirementType: 'MANDATORY',
      minimumProficiency: 'INTERMEDIATE',
      weight: null,
      skill,
    },
  ],
  jobCertificates: [],
};

const aiResult = {
  overall_score: 91,
  match_level: 'HIGH',
  skills_score: 85,
  experience_score: 80,
  education_score: 70,
  other_score: 60,
  strengths: ['NestJS'],
  gaps: [],
  matched_skills: [{ name: 'NestJS', isMandatory: true }],
  missing_skills: [],
  missing_required_skills: [],
  evidence: [],
  confidence_score: 1,
  summary: 'Strong match',
  mandatory_status: 'PASS',
  mandatory_ratio: 1,
  mandatory_failures: [],
};

function createService(overrides?: {
  prisma?: Record<string, unknown>;
  entitlements?: Record<string, unknown>;
  aiMatching?: Record<string, unknown>;
}) {
  const prisma = {
    candidateProfile: {
      findUnique: jest.fn().mockResolvedValue(candidateProfile),
    },
    resume: {
      findFirst: jest
        .fn()
        .mockResolvedValueOnce({ id: resumeId })
        .mockResolvedValueOnce(resume),
    },
    jobPosting: {
      findFirst: jest.fn().mockResolvedValue(job),
    },
    application: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    candidateJdFitAnalysis: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }) => ({
        id: 'analysis-1',
        ...data,
        createdAt: new Date(),
      })),
    },
    ...(overrides?.prisma ?? {}),
  };

  const entitlements = {
    findUsageByRequestId: jest.fn().mockResolvedValue(null),
    assertCandidateJdFit: jest.fn().mockResolvedValue({
      entitlementId: 'ent-1',
      jdFitAnalysis: true,
      jdFitRemaining: 5,
    }),
    consumeQuotaAtomically: jest.fn().mockResolvedValue({
      reused: false,
      usage: { id: 'usage-1' },
    }),
    getEffectiveEntitlement: jest.fn().mockResolvedValue({
      entitlementId: 'ent-1',
    }),
    refundQuotaForRequest: jest.fn().mockResolvedValue(undefined),
    ...(overrides?.entitlements ?? {}),
  };

  const aiMatching = {
    evaluate: jest.fn().mockResolvedValue(aiResult),
    toHttpException: jest.fn((error: unknown) => {
      throw error;
    }),
    ...(overrides?.aiMatching ?? {}),
  };

  const service = new CandidateInsightsService(
    prisma as never,
    entitlements as never,
    {} as never,
    new EvaluationPayloadBuilder() as never,
    aiMatching as never,
  );

  return { service, prisma, entitlements, aiMatching };
}

describe('CandidateInsightsService.analyzeJdFit', () => {
  it('uses AI overall_score (not heuristic 70/20/10)', async () => {
    const { service, entitlements, aiMatching, prisma } = createService();

    const result = await service.analyzeJdFit(userId, { jobId, requestId });

    expect(aiMatching.evaluate).toHaveBeenCalledTimes(1);
    const payload = aiMatching.evaluate.mock.calls[0][0];
    expect(payload.application_id).toBe(`candidate-jd-fit:${requestId}`);
    expect(payload.candidate_profile.skills[0].skill_name).toBe('NestJS');
    expect(payload.job.required_skills[0].is_mandatory).toBe(true);
    expect(payload.weights).toEqual({
      skills: 40,
      experience: 30,
      education: 15,
      other: 15,
    });

    expect(result.overallScore).toBe(91);
    expect(result.matchLevel).toBe(MatchLevel.HIGH);
    expect(result.analysis).toEqual(
      expect.objectContaining({
        scoreBreakdown: {
          skills: 85,
          experience: 80,
          education: 70,
          other: 60,
        },
      }),
    );
    expect(entitlements.consumeQuotaAtomically).toHaveBeenCalledTimes(1);
    expect(prisma.candidateJdFitAnalysis.create).toHaveBeenCalled();
  });

  it('rejects resume that does not belong to the candidate', async () => {
    const { service } = createService({
      prisma: {
        candidateProfile: {
          findUnique: jest.fn().mockResolvedValue(candidateProfile),
        },
        resume: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        jobPosting: { findFirst: jest.fn() },
        application: { findFirst: jest.fn() },
        candidateJdFitAnalysis: { findUnique: jest.fn(), create: jest.fn() },
      },
    });

    await expect(
      service.analyzeJdFit(userId, {
        jobId,
        resumeId: 'foreign-resume',
        requestId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unparsed resume', async () => {
    const { service } = createService({
      prisma: {
        candidateProfile: {
          findUnique: jest.fn().mockResolvedValue(candidateProfile),
        },
        resume: {
          findFirst: jest.fn().mockResolvedValue({
            id: resumeId,
            parsingStatus: ResumeParsingStatus.PROCESSING,
          }),
        },
        jobPosting: { findFirst: jest.fn() },
        application: { findFirst: jest.fn() },
        candidateJdFitAnalysis: { findUnique: jest.fn(), create: jest.fn() },
      },
    });

    await expect(
      service.analyzeJdFit(userId, {
        jobId,
        resumeId,
        requestId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unpublished / expired job before AI call', async () => {
    const { service, aiMatching } = createService({
      prisma: {
        candidateProfile: {
          findUnique: jest.fn().mockResolvedValue(candidateProfile),
        },
        resume: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: resumeId })
            .mockResolvedValueOnce(resume),
        },
        jobPosting: { findFirst: jest.fn().mockResolvedValue(null) },
        application: { findFirst: jest.fn().mockResolvedValue(null) },
        candidateJdFitAnalysis: { findUnique: jest.fn(), create: jest.fn() },
      },
    });

    await expect(
      service.analyzeJdFit(userId, { jobId, requestId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(aiMatching.evaluate).not.toHaveBeenCalled();
  });

  it('does not consume quota when AI times out', async () => {
    const { service, entitlements } = createService({
      aiMatching: {
        evaluate: jest
          .fn()
          .mockRejectedValue(
            new AiMatchingClientError('timeout', 'TIMEOUT'),
          ),
        toHttpException: jest.fn((error: unknown) => {
          throw new GatewayTimeoutException(
            error instanceof Error ? error.message : 'timeout',
          );
        }),
      },
    });

    await expect(
      service.analyzeJdFit(userId, { jobId, requestId }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
    expect(entitlements.consumeQuotaAtomically).not.toHaveBeenCalled();
  });

  it('does not consume quota when AI response is invalid', async () => {
    const { service, entitlements } = createService({
      aiMatching: {
        evaluate: jest
          .fn()
          .mockRejectedValue(
            new AiMatchingClientError('bad schema', 'INVALID_RESPONSE'),
          ),
        toHttpException: jest.fn((error: unknown) => {
          throw error;
        }),
      },
    });

    await expect(
      service.analyzeJdFit(userId, { jobId, requestId }),
    ).rejects.toBeInstanceOf(AiMatchingClientError);
    expect(entitlements.consumeQuotaAtomically).not.toHaveBeenCalled();
  });

  it('refunds quota when persistence fails after AI success', async () => {
    const { service, entitlements } = createService({
      prisma: {
        candidateProfile: {
          findUnique: jest.fn().mockResolvedValue(candidateProfile),
        },
        resume: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: resumeId })
            .mockResolvedValueOnce(resume),
        },
        jobPosting: { findFirst: jest.fn().mockResolvedValue(job) },
        application: { findFirst: jest.fn().mockResolvedValue(null) },
        candidateJdFitAnalysis: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockRejectedValue(new Error('db down')),
        },
      },
    });

    await expect(
      service.analyzeJdFit(userId, { jobId, requestId }),
    ).rejects.toThrow('db down');
    expect(entitlements.refundQuotaForRequest).toHaveBeenCalledWith(
      expect.objectContaining({ requestId, quotaField: 'jdFitRemaining' }),
    );
  });

  it('reuses prior result for same requestId without calling AI', async () => {
    const existing = {
      id: 'analysis-1',
      jobId,
      resumeId,
      requestId,
      overallScore: 91,
      matchLevel: MatchLevel.HIGH,
      analysis: { scoreBreakdown: { skills: 85 } },
      suggestions: [],
      createdAt: new Date(),
    };
    const { service, entitlements, aiMatching } = createService({
      entitlements: {
        findUsageByRequestId: jest.fn().mockResolvedValue({ id: 'usage-1' }),
        assertCandidateJdFit: jest.fn(),
        consumeQuotaAtomically: jest.fn(),
        getEffectiveEntitlement: jest.fn(),
        refundQuotaForRequest: jest.fn(),
      },
      prisma: {
        candidateProfile: { findUnique: jest.fn() },
        resume: { findFirst: jest.fn() },
        jobPosting: { findFirst: jest.fn() },
        application: { findFirst: jest.fn() },
        candidateJdFitAnalysis: {
          findUnique: jest.fn().mockResolvedValue(existing),
          create: jest.fn(),
        },
      },
    });

    const result = await service.analyzeJdFit(userId, { jobId, requestId });
    expect(result.reused).toBe(true);
    expect(result.overallScore).toBe(91);
    expect(aiMatching.evaluate).not.toHaveBeenCalled();
    expect(entitlements.consumeQuotaAtomically).not.toHaveBeenCalled();
    expect(entitlements.assertCandidateJdFit).not.toHaveBeenCalled();
  });

  it('blocks when entitlement assert fails before AI', async () => {
    const { service, aiMatching } = createService({
      entitlements: {
        findUsageByRequestId: jest.fn().mockResolvedValue(null),
        assertCandidateJdFit: jest
          .fn()
          .mockRejectedValue(new ForbiddenException('Hết lượt')),
        consumeQuotaAtomically: jest.fn(),
        getEffectiveEntitlement: jest.fn(),
        refundQuotaForRequest: jest.fn(),
      },
    });

    await expect(
      service.analyzeJdFit(userId, { jobId, requestId }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(aiMatching.evaluate).not.toHaveBeenCalled();
  });

  it('uses application id as evaluation application_id when already applied', async () => {
    const { service, aiMatching } = createService({
      prisma: {
        candidateProfile: {
          findUnique: jest.fn().mockResolvedValue(candidateProfile),
        },
        resume: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({ id: resumeId })
            .mockResolvedValueOnce(resume),
        },
        jobPosting: { findFirst: jest.fn().mockResolvedValue(job) },
        application: {
          findFirst: jest.fn().mockResolvedValue({ id: 'application-9' }),
        },
        candidateJdFitAnalysis: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(async ({ data }) => ({
            id: 'analysis-1',
            ...data,
            createdAt: new Date(),
          })),
        },
      },
    });

    await service.analyzeJdFit(userId, { jobId, requestId });
    expect(aiMatching.evaluate.mock.calls[0][0].application_id).toBe(
      'application-9',
    );
  });
});
