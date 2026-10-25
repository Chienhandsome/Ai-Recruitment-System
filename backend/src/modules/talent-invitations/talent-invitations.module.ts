import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TalentInvitationsController } from './talent-invitations.controller';
import { TalentInvitationsService } from './talent-invitations.service';

@Module({
  imports: [ApplicationsModule, BillingModule, NotificationsModule],
  controllers: [TalentInvitationsController],
  providers: [TalentInvitationsService],
})
export class TalentInvitationsModule {}
