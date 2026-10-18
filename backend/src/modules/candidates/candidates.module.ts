import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { CandidateJobSeekingService } from './candidate-job-seeking.service';

@Module({
  imports: [PrismaModule, AuthModule, BillingModule],
  controllers: [CandidatesController],
  providers: [CandidatesService, CandidateJobSeekingService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
