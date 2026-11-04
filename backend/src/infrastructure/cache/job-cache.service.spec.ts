/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { JobCacheService } from './job-cache.service';
import { JobsService } from '../../modules/jobs/jobs.service';

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const integration = process.env.REDIS_TEST_URL ? describe : describe.skip;

describe('JobCacheService without Redis', () => {
  it('loads data without requiring a Redis connection', async () => {
    const cache = new JobCacheService(new ConfigService({ REDIS_URL: '' }));
    cache.onModuleInit();
    const load = jest.fn().mockResolvedValue({ value: ['database'] });
    expect(await cache.remember('jobs', 'all', 30_000, load)).toEqual([
      'database',
    ]);
    await expect(cache.invalidate()).resolves.toBeUndefined();
    expect(cache.getStats().bypasses).toBe(1);
    cache.onModuleDestroy();
  });

  it('does not wait for an unreachable Redis server on startup or reads', async () => {
    const cache = new JobCacheService(
      new ConfigService({ REDIS_URL: 'redis://127.0.0.1:1' }),
    );
    cache.onModuleInit();
    expect(
      await cache.remember('jobs', 'all', 30_000, async () => ({
        value: 'db',
      })),
    ).toBe('db');
    cache.onModuleDestroy();
  });
});

integration('Public job cache with real Redis', () => {
  let cache: JobCacheService;
  let peer: JobCacheService;
  let redis: Redis;
  let prefix: string;

  beforeEach(async () => {
    prefix = `test:public-cache:${randomUUID()}`;
    redis = new Redis(process.env.REDIS_TEST_URL!);
    await redis.ping();
    const config = new ConfigService({
      REDIS_URL: process.env.REDIS_TEST_URL,
      REDIS_CACHE_PREFIX: prefix,
    });
    cache = new JobCacheService(config);
    peer = new JobCacheService(config);
    cache.onModuleInit();
    peer.onModuleInit();
    for (
      let n = 0;
      n < 100 && (!cache.getStats().connected || !peer.getStats().connected);
      n++
    )
      await pause(20);
    expect(cache.getStats().connected && peer.getStats().connected).toBe(true);
  });

  afterEach(async () => {
    cache?.onModuleDestroy();
    peer?.onModuleDestroy();
    // Test-only unique namespace, never flush a shared database.
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length) await redis.del(...keys);
    redis.disconnect();
  });

  it('shares values across instances, expires them, and invalidates both namespaces', async () => {
    const load = jest.fn().mockResolvedValue({ value: { data: [1] } });
    await cache.remember('jobs', 'all', 100, load);
    await peer.remember('jobs', 'all', 100, load);
    expect(load).toHaveBeenCalledTimes(1);
    await pause(150);
    await peer.remember('jobs', 'all', 100, load);
    expect(load).toHaveBeenCalledTimes(2);
    await cache.remember('categories', 'all', 1_800_000, load);
    await peer.invalidate();
    await cache.remember('jobs', 'all', 100, load);
    await cache.remember('categories', 'all', 1_800_000, load);
    expect(load).toHaveBeenCalledTimes(5);
  });

  it('coalesces concurrent misses and never resurrects an old in-flight result', async () => {
    let finish!: (result: { value: string }) => void;
    let began!: () => void;
    const started = new Promise<void>((resolve) => {
      began = resolve;
    });
    const load = jest.fn(() => {
      began();
      return new Promise<{ value: string }>((resolve) => {
        finish = resolve;
      });
    });
    const first = cache.remember('jobs', 'all', 30_000, load);
    await started;
    const second = cache.remember('jobs', 'all', 30_000, load);
    await pause(30);
    expect(load).toHaveBeenCalledTimes(1);
    await peer.invalidate();
    finish({ value: 'old' });
    expect(await first).toBe('old');
    expect(await second).toBe('old');
    expect(
      await peer.remember('jobs', 'all', 30_000, async () => ({
        value: 'new',
      })),
    ).toBe('new');
  });

  it('does not reuse payloads when a generation key is evicted', async () => {
    await cache.remember('jobs', 'all', 30_000, () =>
      Promise.resolve({ value: 'old' }),
    );
    await redis.del(`${prefix}:jobs:generation`);
    expect(
      await peer.remember('jobs', 'all', 30_000, async () => ({
        value: 'new',
      })),
    ).toBe('new');
  });

  it('recovers after invalidation times out without a socket disconnect', async () => {
    await cache.remember('jobs', 'all', 30_000, async () => ({ value: 'old' }));
    const client = (cache as unknown as { client: Redis }).client;
    jest
      .spyOn(client, 'mset')
      .mockRejectedValueOnce(new Error('Command timed out'));
    await expect(cache.invalidate()).resolves.toBeUndefined();
    expect(cache.getStats().connected).toBe(false);
    expect(
      await cache.remember('jobs', 'all', 30_000, async () => ({
        value: 'new',
      })),
    ).toBe('new');
    expect(cache.getStats().connected).toBe(true);
  });

  it('returns database results when Redis reads or writes fail', async () => {
    const client = (cache as unknown as { client: Redis }).client;
    jest.spyOn(client, 'get').mockRejectedValueOnce(new Error('read timeout'));
    expect(
      await cache.remember('jobs', 'read-error', 30_000, async () => ({
        value: 'db-read',
      })),
    ).toBe('db-read');
    jest
      .spyOn(client, 'set')
      .mockImplementationOnce(() => Promise.reject(new Error('write timeout')));
    expect(
      await cache.remember('jobs', 'write-error', 30_000, async () => ({
        value: 'db-write',
      })),
    ).toBe('db-write');
    expect(cache.getStats().errors).toBeGreaterThanOrEqual(2);
  });

  it('uses the earliest matching expiry, including off-page records', async () => {
    const expiry = Date.now() + 180;
    const prisma = {
      jobPosting: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest
          .fn()
          .mockResolvedValue({ _min: { expiryDate: new Date(expiry) } }),
      },
    } as any;
    const jobs = new JobsService(prisma, {} as never, {} as never, cache);
    await jobs.findCandidateJobs({ page: 2, limit: 1 });
    await jobs.findCandidateJobs({ page: 2, limit: 1 });
    expect(prisma.jobPosting.count).toHaveBeenCalledTimes(1);
    expect(prisma.jobPosting.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED' }),
        _min: { expiryDate: true },
      }),
    );
    await pause(220);
    await jobs.findCandidateJobs({ page: 2, limit: 1 });
    expect(prisma.jobPosting.count).toHaveBeenCalledTimes(2);
  });

  it('separates every filter/page and normalizes whitespace/defaults', async () => {
    const prisma = {
      jobPosting: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _min: { expiryDate: null } }),
      },
      jobCategory: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const jobs = new JobsService(prisma, {} as never, {} as never, cache);
    await jobs.findCandidateJobs({} as never);
    await jobs.findCandidateJobs({
      page: 1,
      limit: 12,
      search: ' ',
      location: ' ',
    });
    expect(prisma.jobPosting.count).toHaveBeenCalledTimes(1);
    for (const query of [
      { search: 'NestJS' },
      { categoryId: 'category' },
      { employmentType: 'FULL_TIME' },
      { workingModel: 'REMOTE' },
      { location: 'Hanoi' },
      { page: 2 },
      { limit: 20 },
    ])
      await jobs.findCandidateJobs(query as never);
    expect(prisma.jobPosting.count).toHaveBeenCalledTimes(8);
    await jobs.getJobCategories();
    await jobs.getJobCategories();
    expect(prisma.jobCategory.findMany).toHaveBeenCalledTimes(1);
    const keys = await redis.keys(`${prefix}:categories:*`);
    const payload = keys.find((key) => !key.endsWith(':generation'))!;
    expect(await redis.pttl(payload)).toBeGreaterThan(1_790_000);
  });

  it('bypasses Redis after disconnect and never caches loader failures', async () => {
    await expect(
      cache.remember('jobs', 'bad', 30_000, () =>
        Promise.reject(new Error('DB failed')),
      ),
    ).rejects.toThrow('DB failed');
    expect(
      await cache.remember('jobs', 'bad', 30_000, async () => ({
        value: 'recovered',
      })),
    ).toBe('recovered');
    cache.onModuleDestroy();
    expect(
      await cache.remember('jobs', 'bad', 30_000, async () => ({
        value: 'database',
      })),
    ).toBe('database');
  });
});
