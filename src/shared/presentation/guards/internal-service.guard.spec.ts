import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import type { IInternalServiceConfig } from '@shared/application/interfaces/internal-service-config.interface';

import { InternalServiceGuard } from './internal-service.guard';

class FakeInternalServiceConfig implements IInternalServiceConfig {
  constructor(
    private readonly allowedServices: string[],
    private readonly secretsByService: Map<string, string>,
  ) {}

  public getAllowedInternalServices(): string[] {
    return this.allowedServices;
  }

  public getInternalServiceSecret(serviceName: string): string | null {
    return this.secretsByService.get(serviceName) ?? null;
  }
}

describe('InternalServiceGuard', () => {
  it('allows configured internal service with matching secret', () => {
    const guard = new InternalServiceGuard(
      new FakeInternalServiceConfig(
        ['finance-service'],
        new Map([['finance-service', 'secret-1']]),
      ),
    );

    expect(
      guard.canActivate(
        createHttpContext({
          'x-internal-service': 'finance-service',
          'x-internal-service-secret': 'secret-1',
        }),
      ),
    ).toBe(true);
  });

  it('rejects missing internal service credentials', () => {
    const guard = new InternalServiceGuard(
      new FakeInternalServiceConfig(
        ['finance-service'],
        new Map([['finance-service', 'secret-1']]),
      ),
    );

    expect(() => guard.canActivate(createHttpContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects callers outside the allowlist', () => {
    const guard = new InternalServiceGuard(
      new FakeInternalServiceConfig(
        ['finance-service'],
        new Map([['finance-service', 'secret-1']]),
      ),
    );

    expect(() =>
      guard.canActivate(
        createHttpContext({
          'x-internal-service': 'identity-service',
          'x-internal-service-secret': 'secret-1',
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects callers with mismatched secret', () => {
    const guard = new InternalServiceGuard(
      new FakeInternalServiceConfig(
        ['finance-service'],
        new Map([['finance-service', 'secret-1']]),
      ),
    );

    expect(() =>
      guard.canActivate(
        createHttpContext({
          'x-internal-service': 'finance-service',
          'x-internal-service-secret': 'wrong-secret',
        }),
      ),
    ).toThrow(UnauthorizedException);
  });
});

function createHttpContext(headers: Record<string, string>): ExecutionContext {
  const request = { headers };

  return {
    getArgs: () => [request],
    getArgByIndex: () => request,
    switchToRpc: () => ({
      getData: () => undefined,
      getContext: () => undefined,
    }),
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
    switchToWs: () => ({
      getClient: () => undefined,
      getData: () => undefined,
      getPattern: () => undefined,
    }),
    getType: () => 'http',
    getClass: () => InternalServiceGuard,
    getHandler: () => createHttpContext,
  } as ExecutionContext;
}
