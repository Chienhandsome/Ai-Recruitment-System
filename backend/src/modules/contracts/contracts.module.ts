import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../../infrastructure/email/email.module';

@Module({
  imports: [AuthModule, ApplicationsModule, NotificationsModule, EmailModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
