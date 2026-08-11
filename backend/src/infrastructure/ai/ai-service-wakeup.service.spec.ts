import { ConfigService } from '@nestjs/config';
import { AiServiceWakeupService } from './ai-service-wakeup.service';

describe('AiServiceWakeupService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('coalesces concurrent wake-up requests', async () => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'https://ai.example/';
        return undefined;
      }),
    } as unknown as ConfigService;
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const service = new AiServiceWakeupService(config);

    await Promise.all([service.wake(), service.wake()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://ai.example/health');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('does not reject the upload flow when wake-up fails', async () => {
    const config = {
      get: jest.fn((key: string) =>
        key === 'AI_SERVICE_URL' ? 'https://ai.example' : undefined,
      ),
    } as unknown as ConfigService;
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('cold start failed'));
    const service = new AiServiceWakeupService(config);

    await expect(service.wake()).resolves.toBeUndefined();
  });
});
