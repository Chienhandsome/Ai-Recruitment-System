import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { PUBLIC_ROUTE_KEY, REQUIRED_ROLES_KEY, BOOTSTRAP_ROUTE_KEY, type AuthRole } from '../auth.constants';
import type { AuthenticatedRequest } from '../auth.types';

const CACHE_TTL_MS = 15 * 1000; // 15 seconds (prevents DB flooding while ensuring near-instant revocation)
const roleCache = new Map<string, { assignedRoles: string[], status: string, expiresAt: number }>();

export function invalidateUserRoleCache(userId: string): void {
  roleCache.delete(userId);
}

export function clearAllUserRoleCache(): void {
  roleCache.clear();
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.authUser) {
      throw new UnauthorizedException('Authenticated user is unavailable.');
    }

    // Bootstrap is identified by handler metadata, never by URL substring.
    // request.url includes the query string, so any route whose query
    // contained '/auth/bootstrap' previously skipped every check below.
    // Only the real bootstrap handler skips the DB-record/status/role
    // checks, because a Supabase user without a DB record cannot pass them
    // yet. Authentication itself is still enforced above.
    const isBootstrap = this.reflector.getAllAndOverride<boolean>(
      BOOTSTRAP_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isBootstrap) {
      return true;
    }

    const userId = request.authUser.id;
    const now = Date.now();
    let cacheEntry = roleCache.get(userId);

    // Clean up expired cache periodically if map gets too large
    if (roleCache.size > 10000) {
      for (const [key, val] of roleCache.entries()) {
        if (val.expiresAt < now) roleCache.delete(key);
      }
    }

    if (!cacheEntry || cacheEntry.expiresAt < now) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          status: true,
          userRoles: { select: { role: { select: { code: true } } } },
        },
      });

      if (!user) {
        throw new ForbiddenException('Hồ sơ người dùng chưa được khởi tạo trên hệ thống.');
      }

      cacheEntry = {
        status: user.status,
        assignedRoles: user.userRoles.map((ur) => ur.role.code),
        expiresAt: now + CACHE_TTL_MS,
      };

      roleCache.set(userId, cacheEntry);
    }

    // CRITICAL P0 SECURITY ENFORCEMENT:
    // Block any locked or suspended user on ANY authenticated endpoint!
    if (cacheEntry.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Tài khoản của bạn đang ở trạng thái ${cacheEntry.status.toLowerCase()} (bị khóa hoặc tạm ngưng hoạt động).`,
      );
    }

    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no specific role is required, passing active status check is sufficient
    if (!requiredRoles?.length) {
      return true;
    }

    const assignedRoles = new Set(cacheEntry.assignedRoles);

    if (!requiredRoles.some((role) => assignedRoles.has(role))) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này.',
      );
    }

    return true;
  }
}
