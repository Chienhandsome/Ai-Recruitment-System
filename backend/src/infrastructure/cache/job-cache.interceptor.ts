import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, concatMap, Observable } from 'rxjs';
import { JobCacheService } from './job-cache.service';

@Injectable()
export class JobCacheInterceptor implements NestInterceptor {
  constructor(private readonly cache: JobCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<{ method: string }>();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method))
      return next.handle();

    // Invalidate after the handler resolves, including its DB transaction. Apply
    // conservatively to all writes: company/skill edits and hiring/billing flows
    // affect public jobs too. Error paths may have partially committed writes.
    return next.handle().pipe(
      concatMap(async (value: unknown) => {
        await this.cache.invalidate();
        return value;
      }),
      catchError(async (error: unknown) => {
        await this.cache.invalidate();
        throw error;
      }),
    );
  }
}
