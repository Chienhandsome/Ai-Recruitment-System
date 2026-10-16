import { isMockPaymentAllowed, vietnamMonthWindow } from './billing.types';

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

describe('vietnamMonthWindow', () => {
  it('returns Asia/Ho_Chi_Minh calendar month bounds', () => {
    const { start, end } = vietnamMonthWindow(
      new Date('2026-10-06T08:00:00+07:00'),
    );
    expect(start.toISOString()).toBe(
      new Date('2026-10-01T00:00:00+07:00').toISOString(),
    );
    expect(end.toISOString()).toBe(
      new Date('2026-11-01T00:00:00+07:00').toISOString(),
    );
  });
});
