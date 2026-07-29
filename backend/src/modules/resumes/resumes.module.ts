import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule, RabbitMQModule],
  controllers: [ResumesController],
  providers: [ResumesService],
  exports: [ResumesService],
})
export class ResumesModule {}
