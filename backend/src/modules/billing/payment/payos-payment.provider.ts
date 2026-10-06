import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentTransactionStatus,
} from '@prisma/client';
import { PayOS } from '@payos/node';
import type { Webhook, WebhookData } from '@payos/node/lib/resources/webhooks/webhook';
import {
  PaymentCheckoutRequest,
  PaymentCheckoutResult,
  PaymentConfirmResult,
  PaymentProviderAdapter,
} from './payment-provider.interface';

@Injectable()
export class PayosPaymentProvider implements PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  private readonly logger = new Logger(PayosPaymentProvider.name);
  private payOS: PayOS | null = null;

  constructor(private readonly config: ConfigService) {
    // Fallback to VNPAY/MOCK if PAYOS enum not compiled, but PostgreSQL now has PAYOS
    this.provider =
      ((PaymentProvider as any).PAYOS as PaymentProvider) ??
      PaymentProvider.MOCK;

    const clientId = this.config.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.config.get<string>('PAYOS_API_KEY');
    const checksumKey = this.config.get<string>('PAYOS_CHECKSUM_KEY');

    if (clientId && apiKey && checksumKey) {
      try {
        this.payOS = new PayOS({
          clientId,
          apiKey,
          checksumKey,
        });
        this.logger.log('PayOS client initialized with real bank integration.');
      } catch (err: any) {
        this.logger.error(`Failed to initialize PayOS client: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'PayOS environment variables (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY) not found. PayOS checkout will use fallback until keys are set.',
      );
    }
  }

  isConfigured(): boolean {
    return this.payOS !== null;
  }

  async createCheckout(
    request: PaymentCheckoutRequest,
  ): Promise<PaymentCheckoutResult> {
    if (!this.payOS) {
      throw new Error(
        'PayOS chưa được cấu hình các biến PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY trong file .env.',
      );
    }

    // PayOS requires an integer number for orderCode (<= Number.MAX_SAFE_INTEGER)
    let numericOrderCode: number;
    const digitsOnly = request.orderCode.replace(/\D/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length <= 15) {
      numericOrderCode = Number(digitsOnly);
    } else {
      numericOrderCode = Number(
        `${Date.now()}`.slice(-9) + Math.floor(100 + Math.random() * 900),
      );
    }

    // PayOS description: max 25 alphanumeric chars without accents
    const description = `Don hang ${String(numericOrderCode).slice(-6)}`;

    this.logger.log(
      `Creating PayOS VietQR payment link for order ${request.orderId} (code: ${numericOrderCode}, amount: ${request.amountVnd} VND)...`,
    );

    const paymentLink = await this.payOS.paymentRequests.create({
      orderCode: numericOrderCode,
      amount: request.amountVnd,
      description,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
    });

    this.logger.log(
      `PayOS payment link created successfully! checkoutUrl: ${paymentLink.checkoutUrl}`,
    );

    return {
      provider: this.provider,
      checkoutUrl: paymentLink.checkoutUrl,
      providerSessionId: paymentLink.paymentLinkId,
    };
  }

  async verifyWebhook(body: Webhook): Promise<WebhookData> {
    if (!this.payOS) {
      throw new Error('PayOS client is not configured.');
    }
    return this.payOS.webhooks.verify(body);
  }

  async getPaymentInformation(orderCode: number | string) {
    if (!this.payOS) return null;
    const numericCode = Number(String(orderCode).replace(/\D/g, ''));
    if (!numericCode) return null;
    try {
      return await this.payOS.paymentRequests.get(numericCode);
    } catch (err: any) {
      this.logger.warn(
        `Failed to query PayOS payment info for orderCode ${orderCode}: ${err.message}`,
      );
      return null;
    }
  }

  async confirmMockPayment(orderId: string): Promise<PaymentConfirmResult> {
    const providerTxnId = `PAYOS-MOCK-${orderId.slice(0, 8)}-${Date.now()}`;
    return {
      provider: this.provider,
      providerTxnId,
      status: PaymentTransactionStatus.SUCCESS,
      rawPayload: {
        mock: true,
        orderId,
        confirmedAt: new Date().toISOString(),
        note: 'Fallback confirmation when PayOS webhook is bypassed.',
      },
    };
  }
}
