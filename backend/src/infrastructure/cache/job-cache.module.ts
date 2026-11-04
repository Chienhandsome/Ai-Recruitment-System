import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JobCacheService } from './job-cache.service';
import { JobCacheInterceptor } from './job-cache.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    JobCacheService,
    { provide: APP_INTERCEPTOR, useClass: JobCacheInterceptor },
  ],
  exports: [JobCacheService],
})
export class JobCacheModule {}
