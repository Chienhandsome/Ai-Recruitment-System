import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { ResumeHydrationService } from './resume-hydration.service';
import { ResumeResultListener } from './resume-result.listener';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule, RabbitMQModule],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeHydrationService, ResumeResultListener],
  exports: [ResumesService],
})
export class ResumesModule {}
