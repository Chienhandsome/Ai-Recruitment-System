import { RabbitMQService } from './rabbitmq.service';
import { RABBITMQ_EXCHANGE, RABBITMQ_ROUTING_KEYS } from './rabbitmq.constants';

describe('RabbitMQService result delivery policy', () => {
  it('republishes a failed handler delivery with a bounded retry header before ACK', async () => {
    let consumeHandler: ((message: any) => void) | undefined;
    let resolveAck: (() => void) | undefined;
    const acked = new Promise<void>((resolve) => {
      resolveAck = resolve;
    });
    const channel = {
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      prefetch: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockImplementation(async (_queue, handler) => {
        consumeHandler = handler;
        return { consumerTag: 'test' };
      }),
      publish: jest.fn().mockReturnValue(true),
      waitForConfirms: jest.fn().mockResolvedValue(undefined),
      ack: jest.fn().mockImplementation(() => resolveAck?.()),
      nack: jest.fn(),
    };
    const channelWrapper = {
      addSetup: jest.fn().mockImplementation(async (setup) => setup(channel)),
    };
    const config = {
      get: jest.fn((key: string, fallback: unknown) =>
        key === 'RABBITMQ_HANDLER_RETRY_BASE_DELAY_MS' ? 0 : fallback,
      ),
    };
    const service = new RabbitMQService(config as any);
    (service as any).channelWrapper = channelWrapper;

    await service.subscribe(
      'resume_results',
      ['resume.analysis.completed'],
      async () => {
        throw new Error('database temporarily unavailable');
      },
    );

    const content = Buffer.from('{"resumeId":"resume"}');
    consumeHandler?.({
      content,
      fields: { routingKey: RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_COMPLETED },
      properties: {
        contentType: 'application/json',
        headers: { 'x-retry-count': 1 },
      },
    });
    await acked;

    expect(channel.publish).toHaveBeenCalledWith(
      RABBITMQ_EXCHANGE,
      RABBITMQ_ROUTING_KEYS.RESUME_ANALYSIS_COMPLETED,
      content,
      expect.objectContaining({
        persistent: true,
        mandatory: true,
        headers: { 'x-retry-count': 2 },
      }),
    );
    expect(channel.waitForConfirms).toHaveBeenCalled();
    expect(channel.nack).not.toHaveBeenCalled();
  });
});
