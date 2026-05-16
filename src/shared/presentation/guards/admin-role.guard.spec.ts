import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import { AdminRoleGuard } from './admin-role.guard';

describe('AdminRoleGuard', () => {
  const guard = new AdminRoleGuard();

  it('allows admin callers', () => {
    expect(guard.canActivate(createContext('admin'))).toBe(true);
  });

  it('rejects non-admin callers', () => {
    expect(() => guard.canActivate(createContext('creator'))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects callers without role header', () => {
    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});

function createContext(role: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: role === undefined ? {} : { 'x-user-role': role },
      }),
    }),
  } as ExecutionContext;
}
