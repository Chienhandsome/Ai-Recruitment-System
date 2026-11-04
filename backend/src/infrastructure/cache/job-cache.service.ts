import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';

type Scope = 'jobs' | 'categories';
export type CacheLoad<T> = { value: T; expiresAt?: number };

/** Only public job data belongs here. Never cache candidate/application state. */
@Injectable()
export class JobCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobCacheService.name);
  private client?: Redis;
  private ready = false;
  private readonly pending = new Map<string, Promise<unknown>>();
  private readonly counters = { hits: 0, misses: 0, bypasses: 0, errors: 0 };
  private readonly prefix: string;

  constructor(private readonly config: ConfigService) {
    this.prefix =
      config.get<string>('REDIS_CACHE_PREFIX') || 'recruitment:public:v1';
  }

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.log('Redis cache disabled: REDIS_URL is not configured.');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      autoResendUnfulfilledCommands: false,
      connectTimeout: 1000,
      commandTimeout: 300,
      maxRetriesPerRequest: 1,
      retryStrategy: () => 2000,
    });
    this.client.on('error', () => {
      if (this.ready)
        this.logger.warn('Redis unavailable; using database directly.');
      this.ready = false;
    });
    this.client.on('close', () => {
      this.ready = false;
    });
    this.client.on('ready', () => {
      // Writes during an outage may not have invalidated old entries. Rotate
      // generations before serving cache again. Never log connection URLs.
      void this.rotate().then((ok) => {
        this.ready = ok && this.client?.status === 'ready';
        if (this.ready) this.logger.log('Redis public jobs cache connected.');
      });
    });
    void this.client.connect().catch(() => {
      this.logger.warn('Redis connection deferred; using database directly.');
    });
  }

  onModuleDestroy() {
    this.ready = false;
    this.client?.disconnect();
  }

  getStats() {
    return { connected: this.ready, ...this.counters };
  }

  private versionKey(scope: Scope) {
    return `${this.prefix}:${scope}:generation`;
  }

  private async rotate(): Promise<boolean> {
    if (!this.client || this.client.status !== 'ready') return false;
    try {
      await this.client.mset(
        this.versionKey('jobs'),
        randomUUID(),
        this.versionKey('categories'),
        randomUUID(),
      );
      return true;
    } catch {
      this.counters.errors++;
      return false;
    }
  }

  /** Call after commit. Old payloads expire naturally; no KEYS/FLUSHDB needed. */
  async invalidate(): Promise<void> {
    this.ready = (await this.rotate()) && this.client?.status === 'ready';
  }

  async remember<T>(
    scope: Scope,
    identity: string,
    ttlMs: number,
    load: () => Promise<CacheLoad<T>>,
  ): Promise<T> {
    // A command timeout can happen without a socket reconnect. Retry generation
    // rotation on a later read so that cache does not remain disabled forever.
    if (!this.ready && this.client?.status === 'ready') {
      this.ready = (await this.rotate()) && this.client.status === 'ready';
    }
    if (!this.ready || !this.client) {
      this.counters.bypasses++;
      return (await load()).value;
    }
    let key: string;
    try {
      // Random generations also prevent resurrection if the generation key is
      // evicted under allkeys-lru. NX handles concurrent initialization.
      await this.client.set(this.versionKey(scope), randomUUID(), 'NX');
      const generation = await this.client.get(this.versionKey(scope));
      if (!generation) throw new Error('Missing cache generation');
      const digest = createHash('sha256').update(identity).digest('hex');
      key = `${this.prefix}:${scope}:${generation}:${digest}`;
      const encoded = await this.client.get(key);
      if (encoded) {
        const cached = JSON.parse(encoded) as { value: T; expiresAt: number };
        if (cached.expiresAt > Date.now()) {
          this.counters.hits++;
          if (this.counters.hits === 1 || this.counters.hits % 100 === 0) {
            this.logger.log(
              `Public cache hits=${this.counters.hits} misses=${this.counters.misses}`,
            );
          }
          return cached.value;
        }
      }
    } catch {
      this.counters.errors++;
      this.counters.bypasses++;
      return (await load()).value;
    }

    const existing = this.pending.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    this.counters.misses++;
    const startedAt = Date.now();
    const request = (async () => {
      const loaded = await load();
      const expiresAt = Math.min(
        startedAt + ttlMs,
        loaded.expiresAt ?? Infinity,
      );
      const remaining = expiresAt - Date.now();
      if (remaining > 0 && this.ready && this.client) {
        try {
          // A concurrent invalidation makes this old-generation key unreachable.
          await this.client.set(
            key,
            JSON.stringify({ value: loaded.value, expiresAt }),
            'PX',
            remaining,
          );
        } catch {
          this.counters.errors++;
        }
      }
      return loaded.value;
    })();
    this.pending.set(key, request);
    try {
      return await request;
    } finally {
      this.pending.delete(key);
    }
  }
}
