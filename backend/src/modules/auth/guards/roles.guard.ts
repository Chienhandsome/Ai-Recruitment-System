import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { REQUIRED_ROLES_KEY, type AuthRole } from '../auth.constants';
import type { AuthenticatedRequest } from '../auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const user = await this.prisma.user.findUnique({
      where: { id: request.authUser.id },
      select: {
        userStatus: true,
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'The application profile has not been initialized.',
      );
    }

    if (user.userStatus !== 'ACTIVE') {
      throw new ForbiddenException(
        `This account is ${user.userStatus?.toLowerCase() || 'unavailable'}.`,
      );
    }

    const assignedRoles = new Set(user.role ? [user.role] : []);

    if (!requiredRoles.some((role) => assignedRoles.has(role))) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
