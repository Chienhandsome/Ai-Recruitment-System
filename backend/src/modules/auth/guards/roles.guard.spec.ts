import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BOOTSTRAP_ROUTE_KEY,
  PUBLIC_ROUTE_KEY,
  REQUIRED_ROLES_KEY,
} from '../auth.constants';
import { RolesGuard, clearAllUserRoleCache } from './roles.guard';

function buildGuard(options: {
  isBootstrap: boolean;
  dbUser: { status: string; userRoles: { role: { code: string } }[] } | null;
  authUser?: { id: string } | undefined;
  url?: string;
}) {
  const meta: Record<string, unknown> = {
    [PUBLIC_ROUTE_KEY]: false,
    [BOOTSTRAP_ROUTE_KEY]: options.isBootstrap,
    [REQUIRED_ROLES_KEY]: ['ADMIN'],
  };
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => meta[key]),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(options.dbUser),
    },
  };
  const guard = new RolesGuard(reflector as any, prisma as any);
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        // 'authUser' in options distinguishes "no authUser" from default.
        authUser: ('authUser' in options ? options.authUser : { id: 'user-1' }),
        url: options.url ?? '/contracts/admin/all',
      }),
    }),
  };
  return { guard, context: context as any, prisma };
}

describe('RolesGuard bootstrap narrowing (audit run-2)', () => {
  beforeEach(() => {
    clearAllUserRoleCache();
  });

  it('blocks a locked user even when the query string contains /auth/bootstrap', async () => {
    const { guard, context, prisma } = buildGuard({
      isBootstrap: false,
      dbUser: { status: 'LOCKED', userRoles: [{ role: { code: 'ADMIN' } }] },
      url: '/contracts/admin/all?search=/auth/bootstrap',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    // The status check ran: the query string did NOT trigger a bypass.
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });

  it('blocks a non-ADMIN active user on an admin route with a bootstrap query string', async () => {
    const { guard, context } = buildGuard({
      isBootstrap: false,
      dbUser: { status: 'ACTIVE', userRoles: [{ role: { code: 'CANDIDATE' } }] },
      url: '/contracts/admin/all?search=/auth/bootstrap',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lets the real bootstrap handler through without a DB record', async () => {
    const { guard, context, prisma } = buildGuard({
      isBootstrap: true,
      dbUser: null,
      url: '/auth/bootstrap',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('lets an ACTIVE ADMIN through an admin route', async () => {
    const { guard, context } = buildGuard({
      isBootstrap: false,
      dbUser: { status: 'ACTIVE', userRoles: [{ role: { code: 'ADMIN' } }] },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('still requires authentication even on the bootstrap handler', async () => {
    const { guard, context } = buildGuard({
      isBootstrap: true,
      dbUser: null,
      authUser: undefined,
      url: '/auth/bootstrap',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
