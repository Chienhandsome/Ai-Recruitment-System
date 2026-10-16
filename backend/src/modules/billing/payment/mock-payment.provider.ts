import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentTransactionStatus,
} from '@prisma/client';
import {
  PaymentCheckoutRequest,
  PaymentCheckoutResult,
  PaymentConfirmResult,
  PaymentProviderAdapter,
} from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.MOCK;

  constructor(private readonly config: ConfigService) {}

  async createCheckout(
    request: PaymentCheckoutRequest,
  ): Promise<PaymentCheckoutResult> {
    const siteUrl =
      this.config.get<string>('FRONTEND_SITE_URL') ?? 'http://localhost:3000';
    const providerSessionId = `mock_${request.orderCode}_${Date.now()}`;
    const checkoutUrl = new URL('/recruiter/billing/checkout', siteUrl);
    checkoutUrl.searchParams.set('orderId', request.orderId);
    checkoutUrl.searchParams.set('session', providerSessionId);

    return {
      provider: PaymentProvider.MOCK,
      checkoutUrl: checkoutUrl.toString(),
      providerSessionId,
    };
  }

  async confirmMockPayment(orderId: string): Promise<PaymentConfirmResult> {
    const providerTxnId = `MOCK-TXN-${orderId.slice(0, 8)}-${Date.now()}`;
    return {
      provider: PaymentProvider.MOCK,
      providerTxnId,
      status: PaymentTransactionStatus.SUCCESS,
      rawPayload: {
        mock: true,
        orderId,
        confirmedAt: new Date().toISOString(),
        note: 'Sandbox payment — replace with MoMo/VNPay webhook later',
      },
    };
  }
}
