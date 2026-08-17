import { ApplicationsConsumer } from './applications.consumer';

describe('ApplicationsConsumer experience-level persistence', () => {
  it('persists a validated level assessment with the AI result', async () => {
    const tx = {
      aiMatchingResult: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'result-1' }),
      },
      application: {
        update: jest.fn().mockResolvedValue({ id: 'application-1' }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
      ),
    };
    const evaluationService = { markForRetry: jest.fn() };
    const consumer = new ApplicationsConsumer(
      prisma as never,
      { subscribe: jest.fn() } as never,
      evaluationService as never,
    );

    await consumer.handleMessage({
      applicationId: 'application-1',
      status: 'COMPLETED',
      result: {
        overall_score: 81.4,
        match_level: 'HIGH',
        skills_score: 85,
        experience_score: 80.5,
        education_score: 70,
        other_score: 80,
        strengths: [],
        gaps: [],
        matched_skills: [],
        missing_skills: [],
        missing_required_skills: [],
        evidence: [],
        confidence_score: 0.9,
        summary: 'Strong match',
        experience_assessment: {
          candidate_level: 'JUNIOR',
          required_level: 'MIDDLE',
          total_experience_years: 2.4,
          duration_score: 80,
          relevance_score: 90,
          level_fit_score: 70,
          level_gap: 1,
          level_eligible: false,
          level_confidence: 0.9,
          level_requirement_mode: 'ADVISORY',
          recommendation: 'ADVISORY_LEVEL_GAP',
          evidence: ['2.4 năm kinh nghiệm không trùng thời gian'],
          reason_codes: ['YEARS_BASELINE', 'RECENT_TITLE_SIGNAL'],
        },
      },
    });

    expect(tx.aiMatchingResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        candidateExperienceLevel: 'JUNIOR',
        requiredExperienceLevel: 'MIDDLE',
        totalExperienceYears: 2.4,
        levelFitScore: 70,
        levelGap: 1,
        levelEligible: false,
        levelConfidence: 0.9,
        levelEvidence: {
          evidence: ['2.4 năm kinh nghiệm không trùng thời gian'],
          reasonCodes: ['YEARS_BASELINE', 'RECENT_TITLE_SIGNAL'],
          recommendation: 'ADVISORY_LEVEL_GAP',
          requirementMode: 'ADVISORY',
          durationScore: 80,
          relevanceScore: 90,
        },
        modelVersion: 'experience-level-v1',
      }),
    });
    expect(evaluationService.markForRetry).not.toHaveBeenCalled();
  });

  it('rejects an invalid assessment before starting a persistence transaction', async () => {
    const prisma = { $transaction: jest.fn() };
    const evaluationService = { markForRetry: jest.fn() };
    const consumer = new ApplicationsConsumer(
      prisma as never,
      { subscribe: jest.fn() } as never,
      evaluationService as never,
    );

    await consumer.handleMessage({
      applicationId: 'application-1',
      status: 'COMPLETED',
      result: {
        overall_score: 50,
        experience_assessment: {
          candidate_level: 'JUNIOR',
          required_level: 'MIDDLE',
          total_experience_years: 2,
          duration_score: 80,
          relevance_score: 70,
          level_fit_score: 70,
          level_gap: 1,
          level_eligible: false,
          level_confidence: 2,
          level_requirement_mode: 'ADVISORY',
          recommendation: 'ADVISORY_LEVEL_GAP',
        },
      },
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(evaluationService.markForRetry).toHaveBeenCalledWith(
      'application-1',
      expect.stringContaining('level_confidence'),
    );
  });
});
