import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY } from '../auth.constants';
import type { AuthenticatedRequest } from '../auth.types';
import { SupabaseAuthService } from '../supabase-auth.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const route = `${request.method} ${request.url}`;

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      this.logger.debug(`[${route}] Public route — skipping auth`);
      return true;
    }

    let accessToken: string | undefined;
    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      accessToken = authorization.slice('Bearer '.length).trim();
    } else if (typeof request.query?.token === 'string' && request.query.token.trim()) {
      accessToken = request.query.token.trim();
    }

    if (!accessToken) {
      this.logger.warn(`[${route}] Missing or malformed Authorization header or token query parameter`);
      throw new UnauthorizedException('A bearer access token is required.');
    }

    try {
      request.authUser =
        await this.supabaseAuthService.verifyAccessToken(accessToken);
      this.logger.debug(
        `[${route}] Authenticated user: ${request.authUser.email} (${request.authUser.id})`,
      );
      return true;
    } catch (error) {
      this.logger.warn(
        `[${route}] Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
