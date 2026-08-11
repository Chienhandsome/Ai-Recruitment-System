import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_WAKE_TIMEOUT_MS = 65_000;

@Injectable()
export class AiServiceWakeupService {
  private readonly logger = new Logger(AiServiceWakeupService.name);
  private wakeupInFlight: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) {}

  wake(): Promise<void> {
    const aiServiceUrl = this.configService
      .get<string>('AI_SERVICE_URL')
      ?.trim()
      .replace(/\/+$/, '');
    if (!aiServiceUrl) {
      this.logger.warn(
        'AI_SERVICE_URL is not configured; cannot wake AI worker.',
      );
      return Promise.resolve();
    }

    if (this.wakeupInFlight) return this.wakeupInFlight;

    this.wakeupInFlight = this.requestWakeup(aiServiceUrl).finally(() => {
      this.wakeupInFlight = null;
    });
    return this.wakeupInFlight;
  }

  private async requestWakeup(aiServiceUrl: string): Promise<void> {
    const configuredTimeout = Number(
      this.configService.get<string>('AI_SERVICE_WAKE_TIMEOUT_MS'),
    );
    const timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : DEFAULT_WAKE_TIMEOUT_MS;

    try {
      const response = await fetch(`${aiServiceUrl}/health`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        this.logger.warn(
          `AI service wake-up returned HTTP ${response.status}.`,
        );
        return;
      }
      this.logger.log('AI service is awake and ready to consume queued work.');
    } catch (error) {
      this.logger.warn(
        `AI service wake-up failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
