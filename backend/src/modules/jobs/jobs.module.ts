import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobCategoriesController } from './job-categories.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CandidateJobsController } from './candidate-jobs.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    JobsController,
    CandidateJobsController,
    JobCategoriesController,
  ],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
