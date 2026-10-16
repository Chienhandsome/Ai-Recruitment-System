import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsConsumer } from './applications.consumer';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { RetryApplicationEvaluationsUseCase } from './retry-application-evaluations.use-case';
import { ApplicationAccessService } from './application-access.service';
import { BillingModule } from '../billing/billing.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [
    AuthModule,
    RabbitMQModule,
    NotificationsModule,
    BillingModule,
    EvaluationModule,
  ],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsConsumer,
    ApplicationEvaluationService,
    RetryApplicationEvaluationsUseCase,
    ApplicationAccessService,
  ],
  exports: [
    ApplicationsService,
    ApplicationsConsumer,
    ApplicationAccessService,
  ],
})
export class ApplicationsModule {}
