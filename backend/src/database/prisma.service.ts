import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'error' },
              { emit: 'stdout', level: 'warn' },
            ]
          : ['error', 'warn'],
    });

    if (process.env.NODE_ENV === 'development') {
      // Log slow queries (> 200ms) in development
      (this as any).$on('query', (e: any) => {
        if (e.duration > 200) {
          this.logger.warn(
            `Slow query (${e.duration}ms): ${e.query.substring(0, 200)}`,
          );
        }
      });
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Prisma disconnected from Supabase PostgreSQL database.');
      this.isConnected = false;
    }
  }

  private async connectWithRetry() {
    const dbUrl = process.env.DATABASE_URL;
    if (
      !dbUrl ||
      dbUrl.includes('your-password') ||
      dbUrl.includes('your-project-ref')
    ) {
      this.logger.warn(
        'Prisma: DATABASE_URL contains placeholder credentials. Connection deferred.',
      );
      this.isConnected = false;
      return;
    }

    // Log sanitized connection info (hide password)
    const sanitizedUrl = dbUrl.replace(
      /\/\/([^:]+):([^@]+)@/,
      '//$1:****@',
    );
    this.logger.log(`Prisma: Connecting to ${sanitizedUrl}`);

    const startTime = Date.now();
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log(
        `Prisma successfully connected to Supabase PostgreSQL database (${Date.now() - startTime}ms).`,
      );
    } catch (error: unknown) {
      this.isConnected = false;
      this.logger.error(
        `Prisma connection error after ${Date.now() - startTime}ms: ${
          error instanceof Error ? error.message : 'Database connection failed'
        }`,
      );
      this.logger.error(
        `Connection target: ${sanitizedUrl}`,
      );
    }
  }

  async checkHealth(): Promise<{
    service: string;
    status: string;
    message?: string;
  }> {
    const dbUrl = process.env.DATABASE_URL;
    if (
      !dbUrl ||
      dbUrl.includes('your-password') ||
      dbUrl.includes('your-project-ref')
    ) {
      return {
        service: 'supabase-postgres',
        status: 'DOWN',
        message: 'DATABASE_URL is unconfigured or contains placeholder values',
      };
    }

    try {
      await this.$queryRaw`SELECT 1`;
      this.isConnected = true;
      return {
        service: 'supabase-postgres',
        status: 'UP',
      };
    } catch {
      this.isConnected = false;
      return {
        service: 'supabase-postgres',
        status: 'DOWN',
        message: 'Database connection check failed',
      };
    }
  }
}
