import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsConsumer } from './applications.consumer';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { ApplicationEvaluationService } from './application-evaluation.service';
import { RetryApplicationEvaluationsUseCase } from './retry-application-evaluations.use-case';

@Module({
  imports: [AuthModule, RabbitMQModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsConsumer,
    ApplicationEvaluationService,
    RetryApplicationEvaluationsUseCase,
  ],
  exports: [ApplicationsService, ApplicationsConsumer],
})
export class ApplicationsModule {}
