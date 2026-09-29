import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiResultDto,
  AiResultSchema,
} from '../applications/dto/ai-result.dto';
import type { EvaluationRequestPayload } from './evaluation-payload.builder';

export class AiMatchingClientError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NOT_CONFIGURED'
      | 'TIMEOUT'
      | 'NETWORK'
      | 'HTTP_ERROR'
      | 'INVALID_RESPONSE',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AiMatchingClientError';
  }
}

const DEFAULT_TIMEOUT_MS = 90_000;

@Injectable()
export class AiMatchingClient {
  private readonly logger = new Logger(AiMatchingClient.name);

  constructor(private readonly configService: ConfigService) {}

  async evaluate(payload: EvaluationRequestPayload): Promise<AiResultDto> {
    const aiServiceUrl = this.configService
      .get<string>('AI_SERVICE_URL')
      ?.trim()
      .replace(/\/+$/, '');
    if (!aiServiceUrl) {
      throw new AiMatchingClientError(
        'AI_SERVICE_URL chưa được cấu hình.',
        'NOT_CONFIGURED',
      );
    }

    const configuredTimeout = Number(
      this.configService.get<string>('CANDIDATE_JD_FIT_AI_TIMEOUT_MS'),
    );
    const timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : DEFAULT_TIMEOUT_MS;

    const applicationId = payload.application_id;
    this.logger.log(
      `Calling AI matching evaluate application_id=${applicationId} timeoutMs=${timeoutMs}`,
    );

    let response: Response;
    try {
      response = await fetch(`${aiServiceUrl}/api/v1/matching/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const cause =
        error instanceof Error &&
        'cause' in error &&
        error.cause instanceof Error
          ? error.cause.message
          : null;
      const isTimeout =
        (error instanceof Error && error.name === 'TimeoutError') ||
        /timeout|aborted/i.test(message);
      const detail = [message, cause].filter(Boolean).join(' — ');
      throw new AiMatchingClientError(
        isTimeout
          ? `AI matching timeout sau ${timeoutMs}ms (${aiServiceUrl}).`
          : `Không kết nối được AI matching tại ${aiServiceUrl}: ${detail}`,
        isTimeout ? 'TIMEOUT' : 'NETWORK',
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new AiMatchingClientError(
        `AI matching trả về body không phải JSON (HTTP ${response.status}).`,
        'INVALID_RESPONSE',
        response.status,
      );
    }

    if (!response.ok) {
      const detail =
        typeof body === 'object' &&
        body &&
        'detail' in body &&
        typeof (body as { detail: unknown }).detail === 'string'
          ? (body as { detail: string }).detail
          : `HTTP ${response.status}`;
      throw new AiMatchingClientError(
        `AI matching lỗi: ${detail}`,
        'HTTP_ERROR',
        response.status,
      );
    }

    if (!this.hasRequiredScoreFields(body)) {
      throw new AiMatchingClientError(
        'Phản hồi AI matching thiếu trường điểm bắt buộc (overall_score / pillar scores).',
        'INVALID_RESPONSE',
        response.status,
      );
    }

    const parsed = AiResultSchema.safeParse(body);
    if (!parsed.success) {
      this.logger.warn(
        `AI matching response schema invalid for ${applicationId}: ${parsed.error.message}`,
      );
      throw new AiMatchingClientError(
        'Phản hồi AI matching không đúng schema EvaluationResponse.',
        'INVALID_RESPONSE',
        response.status,
      );
    }

    return parsed.data;
  }

  private hasRequiredScoreFields(body: unknown): boolean {
    if (!body || typeof body !== 'object') return false;
    const record = body as Record<string, unknown>;
    const required = [
      'overall_score',
      'match_level',
      'skills_score',
      'experience_score',
      'education_score',
      'other_score',
    ] as const;
    return required.every((key) => key in record && record[key] !== undefined);
  }

  toHttpException(error: unknown): never {
    if (error instanceof AiMatchingClientError) {
      if (error.code === 'TIMEOUT') {
        throw new GatewayTimeoutException(error.message);
      }
      if (error.code === 'NOT_CONFIGURED' || error.code === 'NETWORK') {
        throw new ServiceUnavailableException(error.message);
      }
      throw new BadGatewayException(error.message);
    }
    throw new BadGatewayException(
      error instanceof Error ? error.message : 'AI matching thất bại.',
    );
  }
}
