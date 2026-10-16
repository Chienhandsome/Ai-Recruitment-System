import { PaymentProvider, PaymentTransactionStatus } from '@prisma/client';

export type PaymentCheckoutRequest = {
  orderId: string;
  orderCode: string;
  amountVnd: number;
  returnUrl: string;
  cancelUrl: string;
};

export type PaymentCheckoutResult = {
  provider: PaymentProvider;
  checkoutUrl: string;
  providerSessionId: string;
};

export type PaymentConfirmResult = {
  provider: PaymentProvider;
  providerTxnId: string;
  status: PaymentTransactionStatus;
  rawPayload: Record<string, unknown>;
};

/**
 * Abstraction so MOCK can later be swapped for MoMo / VNPay implementations.
 */
export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;
  createCheckout(request: PaymentCheckoutRequest): Promise<PaymentCheckoutResult>;
  confirmMockPayment?(orderId: string): Promise<PaymentConfirmResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
