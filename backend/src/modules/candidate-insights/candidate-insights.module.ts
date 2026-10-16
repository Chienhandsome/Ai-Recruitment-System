import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { CandidateInsightsController } from './candidate-insights.controller';
import { CandidateInsightsService } from './candidate-insights.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BillingModule,
    InterviewsModule,
    EvaluationModule,
  ],
  controllers: [CandidateInsightsController],
  providers: [CandidateInsightsService],
  exports: [CandidateInsightsService],
})
export class CandidateInsightsModule {}
