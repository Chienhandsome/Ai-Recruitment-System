import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { UploadResumeUseCase } from './application/upload-resume.use-case';
import { RetryStuckResumesUseCase } from './application/retry-stuck-resumes.use-case';
import { ResumeGuardService } from './domain/resume-guard.service';
import { SkillNormalizerService } from './domain/skill-normalizer.service';
import { ResumeHydrationService } from './hydration/resume-hydration.service';
import { SkillResolverService } from './hydration/skill-resolver.service';
import { CertificateWriter } from './hydration/writers/certificate-writer';
import { EducationWriter } from './hydration/writers/education-writer';
import { ExperienceWriter } from './hydration/writers/experience-writer';
import { ProfileWriter } from './hydration/writers/profile-writer';
import { ProjectWriter } from './hydration/writers/project-writer';
import { SkillWriter } from './hydration/writers/skill-writer';
import { ResumeResultListener } from './transport/resume-result.listener';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule, RabbitMQModule],
  controllers: [ResumesController],
  providers: [
    ResumesService,
    UploadResumeUseCase,
    RetryStuckResumesUseCase,
    ResumeGuardService,
    SkillNormalizerService,
    ResumeHydrationService,
    SkillResolverService,
    ExperienceWriter,
    EducationWriter,
    ProjectWriter,
    CertificateWriter,
    SkillWriter,
    ProfileWriter,
    ResumeResultListener,
  ],
  exports: [ResumesService],
})
export class ResumesModule {}
