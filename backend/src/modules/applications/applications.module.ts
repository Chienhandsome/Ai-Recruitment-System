import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsConsumer } from './applications.consumer';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [AuthModule, RabbitMQModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsConsumer],
  exports: [ApplicationsService, ApplicationsConsumer],
})
export class ApplicationsModule {}
