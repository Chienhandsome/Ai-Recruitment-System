import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { SupabaseModule } from './infrastructure/supabase/supabase.module';
import { RabbitMQModule } from './infrastructure/rabbitmq/rabbitmq.module';

import { CompaniesModule } from './modules/companies/companies.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SkillsModule } from './modules/skills/skills.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { ScreeningsModule } from './modules/screenings/screenings.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { RecruitersModule } from './modules/recruiters/recruiters.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SupabaseModule,
    RabbitMQModule,
    CompaniesModule,
    DepartmentsModule,
    UsersModule,
    RolesModule,
    JobsModule,
    SkillsModule,
    CandidatesModule,
    ResumesModule,
    ApplicationsModule,
    ScreeningsModule,
    InterviewsModule,
    NotificationsModule,
    AuthModule,
    RecruitersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
