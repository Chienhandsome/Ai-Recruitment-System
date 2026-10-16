import { Injectable } from '@nestjs/common';
import { EvaluationPayloadBuilder } from './evaluation-payload.builder';

/**
 * Nest-friendly provider wrapping the shared payload builder.
 * Keeps HR/Candidate modules able to inject the same instance.
 */
@Injectable()
export class EvaluationPayloadBuilderService extends EvaluationPayloadBuilder {}
