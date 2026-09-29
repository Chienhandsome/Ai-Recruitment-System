import { isMockPaymentAllowed } from './billing.types';

describe('isMockPaymentAllowed', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalAllow = process.env.ALLOW_MOCK_PAYMENT;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalAllow === undefined) {
      delete process.env.ALLOW_MOCK_PAYMENT;
    } else {
      process.env.ALLOW_MOCK_PAYMENT = originalAllow;
    }
  });

  it('allows mock payment outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_MOCK_PAYMENT;
    expect(isMockPaymentAllowed()).toBe(true);
  });

  it('blocks mock payment in production by default', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_MOCK_PAYMENT;
    expect(isMockPaymentAllowed()).toBe(false);
  });

  it('allows mock payment in production only with explicit flag', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_PAYMENT = 'true';
    expect(isMockPaymentAllowed()).toBe(true);
  });
});
