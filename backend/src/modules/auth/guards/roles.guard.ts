import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { PUBLIC_ROUTE_KEY, REQUIRED_ROLES_KEY, type AuthRole } from '../auth.constants';
import type { AuthenticatedRequest } from '../auth.types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const roleCache = new Map<string, { assignedRoles: string[], status: string, expiresAt: number }>();

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

    const requiredRoles = this.reflector.getAllAndOverride<AuthRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.authUser) {
      throw new UnauthorizedException('Authenticated user is unavailable.');
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
        throw new ForbiddenException('The application profile has not been initialized.');
      }

      cacheEntry = {
        status: user.status,
        assignedRoles: user.userRoles.map((ur) => ur.role.code),
        expiresAt: now + CACHE_TTL_MS,
      };

      roleCache.set(userId, cacheEntry);
    }

    if (cacheEntry.status !== 'ACTIVE') {
      throw new ForbiddenException(`This account is ${cacheEntry.status.toLowerCase()}.`);
    }

    const assignedRoles = new Set(cacheEntry.assignedRoles);

    if (!requiredRoles.some((role) => assignedRoles.has(role))) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
