import { Module } from '@nestjs/common';
import { RecruitersController } from './recruiters.controller';
import { RecruitersService } from './recruiters.service';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [PrismaModule, AuthModule, BillingModule],
  controllers: [RecruitersController],
  providers: [RecruitersService],
  exports: [RecruitersService],
})
export class RecruitersModule {}
