/* eslint-disable @typescript-eslint/unbound-method */
import { PUBLIC_ROUTE_KEY, REQUIRED_ROLES_KEY } from '../auth/auth.constants';
import { AdminController } from './admin.controller';

describe('AdminController authorization metadata', () => {
  it('requires the ADMIN role and is not public', () => {
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, AdminController)).toEqual([
      'ADMIN',
    ]);
    expect(
      Reflect.getMetadata(PUBLIC_ROUTE_KEY, AdminController),
    ).toBeUndefined();
    for (const handler of [
      AdminController.prototype.getDashboardStats,
      AdminController.prototype.getAdminJobs,
      AdminController.prototype.getAdminUsers,
    ]) {
      expect(Reflect.getMetadata(PUBLIC_ROUTE_KEY, handler)).toBeUndefined();
    }
  });
});
