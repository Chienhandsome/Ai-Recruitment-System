import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { JobCacheInterceptor } from './job-cache.interceptor';
import { JobCacheService } from './job-cache.service';

describe('JobCacheInterceptor', () => {
  const context = (method: string) =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => ({ method }) }),
    }) as ExecutionContext;

  it('awaits invalidation after a successful transaction/handler resolves', async () => {
    const events: string[] = [];
    const cache = {
      invalidate: jest.fn(() => {
        events.push('invalidated');
        return Promise.resolve();
      }),
    };
    const interceptor = new JobCacheInterceptor(
      cache as unknown as JobCacheService,
    );
    const next: CallHandler = {
      handle: () => {
        events.push('committed');
        return of('ok');
      },
    };
    expect(
      await lastValueFrom(interceptor.intercept(context('PATCH'), next)),
    ).toBe('ok');
    expect(events).toEqual(['committed', 'invalidated']);
  });

  it('does not invalidate on reads', async () => {
    const cache = { invalidate: jest.fn() };
    const interceptor = new JobCacheInterceptor(
      cache as unknown as JobCacheService,
    );
    await lastValueFrom(
      interceptor.intercept(context('GET'), { handle: () => of('ok') }),
    );
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it('preserves handler errors and invalidates possibly committed writes', async () => {
    const cache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    const interceptor = new JobCacheInterceptor(
      cache as unknown as JobCacheService,
    );
    const error = new Error('mutation failed');
    await expect(
      lastValueFrom(
        interceptor.intercept(context('POST'), {
          handle: () => throwError(() => error),
        }),
      ),
    ).rejects.toBe(error);
    expect(cache.invalidate).toHaveBeenCalledTimes(1);
  });
});
