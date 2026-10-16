import { ConfigService } from '@nestjs/config';
import {
  AiMatchingClient,
  AiMatchingClientError,
} from './ai-matching.client';

describe('AiMatchingClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function createClient(env: Record<string, string | undefined> = {}) {
    const config = {
      get: jest.fn((key: string) => env[key]),
    } as unknown as ConfigService;
    return new AiMatchingClient(config);
  }

  it('posts EvaluationRequest and returns validated AI scores', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        overall_score: 88,
        match_level: 'HIGH',
        skills_score: 80,
        experience_score: 70,
        education_score: 60,
        other_score: 50,
        strengths: [],
        gaps: [],
        matched_skills: [],
        missing_skills: [],
        missing_required_skills: [],
        evidence: [],
        confidence_score: 1,
        summary: 'ok',
      }),
    }) as unknown as typeof fetch;

    const client = createClient({
      AI_SERVICE_URL: 'http://ai.test',
      CANDIDATE_JD_FIT_AI_TIMEOUT_MS: '5000',
    });

    const result = await client.evaluate({
      application_id: 'candidate-jd-fit:r1',
      schema_version: 2,
      evaluation_date: new Date().toISOString(),
      candidate_profile: { profile: {}, skills: [] },
      job: { id: 'job-1', required_skills: [] },
      weights: { skills: 40, experience: 30, education: 15, other: 15 },
    });

    expect(result.overall_score).toBe(88);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://ai.test/api/v1/matching/evaluate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects invalid AI response schema', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    }) as unknown as typeof fetch;

    const client = createClient({ AI_SERVICE_URL: 'http://ai.test' });
    await expect(
      client.evaluate({
        application_id: 'x',
        schema_version: 2,
        evaluation_date: new Date().toISOString(),
        candidate_profile: {},
        job: {},
        weights: { skills: 40, experience: 30, education: 15, other: 15 },
      }),
    ).rejects.toBeInstanceOf(AiMatchingClientError);
  });

  it('maps timeout to AiMatchingClientError TIMEOUT', async () => {
    const timeoutError = new Error('The operation was aborted due to timeout');
    timeoutError.name = 'TimeoutError';
    global.fetch = jest.fn().mockRejectedValue(timeoutError) as unknown as typeof fetch;

    const client = createClient({ AI_SERVICE_URL: 'http://ai.test' });
    await expect(
      client.evaluate({
        application_id: 'x',
        schema_version: 2,
        evaluation_date: new Date().toISOString(),
        candidate_profile: {},
        job: {},
        weights: { skills: 40, experience: 30, education: 15, other: 15 },
      }),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });
});
