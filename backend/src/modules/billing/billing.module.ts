import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { EntitlementsService } from './entitlements.service';
import { TalentPoolService } from './talent-pool.service';
import { MockPaymentProvider } from './payment/mock-payment.provider';
import { PayosPaymentProvider } from './payment/payos-payment.provider';
import { PAYMENT_PROVIDER } from './payment/payment-provider.interface';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { TalentResumeService } from './talent-resume.service';

@Module({
  imports: [PrismaModule, AuthModule, SupabaseModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    EntitlementsService,
    TalentPoolService,
    TalentResumeService,
    PayosPaymentProvider,
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (payos: PayosPaymentProvider, mock: MockPaymentProvider) => {
        return payos.isConfigured() ? payos : mock;
      },
      inject: [PayosPaymentProvider, MockPaymentProvider],
    },
  ],
  exports: [
    EntitlementsService,
    BillingService,
    TalentPoolService,
    PayosPaymentProvider,
  ],
})
export class BillingModule {}
