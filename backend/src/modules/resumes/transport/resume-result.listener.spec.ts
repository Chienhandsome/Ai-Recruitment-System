import { ResumeResultListener } from './resume-result.listener';

describe('ResumeResultListener', () => {
  it('lets hydration errors reach the RabbitMQ ACK/NACK boundary', async () => {
    let handler: ((message: unknown) => Promise<void>) | undefined;
    const rabbitMQ = {
      subscribe: jest
        .fn()
        .mockImplementation(
          async (
            _queue: string,
            _routingKeys: string[],
            callback: (message: unknown) => Promise<void>,
          ) => {
            handler = callback;
          },
        ),
    } as any;
    const hydration = {
      hydrateProfile: jest
        .fn()
        .mockRejectedValue(new Error('database unavailable')),
      handleFailure: jest.fn(),
    } as any;
    const listener = new ResumeResultListener(rabbitMQ, hydration);
    await listener.onModuleInit();

    await expect(
      handler?.({
        resumeId: 'resume',
        candidateProfileId: 'candidate',
        parsedData: {
          skills: [],
          work_experiences: [],
          educations: [],
          projects: [],
          certificates: [],
        },
        completedAt: '2026-08-03T00:00:00Z',
      }),
    ).rejects.toThrow('database unavailable');
  });
});
