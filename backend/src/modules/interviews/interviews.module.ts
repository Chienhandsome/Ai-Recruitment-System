import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiInterviewsService } from './ai-interviews.service';

@Module({
  imports: [AuthModule, ApplicationsModule, NotificationsModule],
  controllers: [InterviewsController],
  providers: [InterviewsService, AiInterviewsService],
  exports: [InterviewsService, AiInterviewsService],
})
export class InterviewsModule {}
