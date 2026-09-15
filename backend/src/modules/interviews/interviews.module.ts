import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiInterviewsService } from './ai-interviews.service';
import { InterviewProcessService } from './interview-process.service';

@Module({
  imports: [AuthModule, ApplicationsModule, NotificationsModule],
  controllers: [InterviewsController],
  providers: [InterviewsService, AiInterviewsService, InterviewProcessService],
  exports: [InterviewsService, AiInterviewsService, InterviewProcessService],
})
export class InterviewsModule {}
