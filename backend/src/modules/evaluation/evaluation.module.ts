import { Module } from '@nestjs/common';
import { AiMatchingClient } from './ai-matching.client';
import { EvaluationPayloadBuilderService } from './evaluation-payload.builder.service';

@Module({
  providers: [EvaluationPayloadBuilderService, AiMatchingClient],
  exports: [EvaluationPayloadBuilderService, AiMatchingClient],
})
export class EvaluationModule {}
