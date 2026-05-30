import { FinancePaymentClientService } from './finance-payment-client.service';

import type { ConfigService } from '../config/config.service';

describe('FinancePaymentClientService', () => {
  const originalFetch = global.fetch;

  afterEach((): void => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('sends the finance internal gateway secret to finance', async (): Promise<void> => {
    const fetchMock = mockSuccessfulFetch();
    const service = new FinancePaymentClientService(
      createConfigService({
        FINANCE_INTERNAL_GATEWAY_SECRET: 'finance-gateway-secret',
        INTERNAL_GATEWAY_SECRET: 'media-gateway-secret',
      }),
    );

    await service.charge(createChargeInput());

    const requestInit = getLastRequestInit(fetchMock);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:4004/api/internal/payments/charge',
    );
    expect(getHeaderValue(requestInit.headers, 'x-internal-secret')).toBe(
      'finance-gateway-secret',
    );
    expect(getHeaderValue(requestInit.headers, 'idempotency-key')).toBe(
      'video-purchase:payer-id:video-id',
    );
  });

  it('requires the finance internal gateway secret', async (): Promise<void> => {
    const fetchMock = mockSuccessfulFetch();
    const service = new FinancePaymentClientService(
      createConfigService({
        INTERNAL_GATEWAY_SECRET: 'gateway-secret',
      }),
    );

    await expect(service.charge(createChargeInput())).rejects.toThrow(
      'Config key "FINANCE_INTERNAL_GATEWAY_SECRET" is not defined',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function mockSuccessfulFetch(): jest.MockedFunction<typeof fetch> {
  const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            statusCode: 201,
            data: {
              payerWalletId: 'payer-wallet-id',
              channelWalletId: 'channel-wallet-id',
              systemWalletId: 'system-wallet-id',
              serviceType: 'video',
              serviceId: 'video-id',
              channelId: 'channel-id',
              channelOwnerId: 'owner-id',
              coinAmount: 100,
              splitPercent: 80,
              creatorCoins: 80,
              systemCoins: 20,
              transactions: [
                {
                  id: 'payment-transaction-id',
                  type: 'payment',
                  status: 'success',
                  amount: 100,
                },
              ],
            },
          }),
          { status: 201 },
        ),
      ),
  );

  global.fetch = fetchMock;

  return fetchMock;
}

function getLastRequestInit(
  fetchMock: jest.MockedFunction<typeof fetch>,
): RequestInit {
  const requestInit = fetchMock.mock.calls[0]?.[1];

  if (!requestInit) {
    throw new Error('Expected fetch to be called with request options');
  }

  return requestInit;
}

function getHeaderValue(
  headers: HeadersInit | undefined,
  name: string,
): string {
  if (!headers) {
    throw new Error(`Expected request header "${name}" to be set`);
  }

  if (headers instanceof Headers) {
    const value = headers.get(name);

    if (!value) {
      throw new Error(`Expected request header "${name}" to be set`);
    }

    return value;
  }

  if (Array.isArray(headers)) {
    const match = headers.find(
      ([headerName]) => headerName.toLowerCase() === name.toLowerCase(),
    );

    if (!match) {
      throw new Error(`Expected request header "${name}" to be set`);
    }

    return match[1];
  }

  const value = headers[name];

  if (!value) {
    throw new Error(`Expected request header "${name}" to be set`);
  }

  return value;
}

function createConfigService(values: Record<string, string>): ConfigService {
  return {
    get<T = string>(key: string, defaultValue?: T): T {
      if (key in values) {
        return values[key] as T;
      }

      return defaultValue ?? (null as T);
    },
    getOrThrow<T = string>(key: string): T {
      if (key in values) {
        return values[key] as T;
      }

      throw new Error(`Config key "${key}" is not defined`);
    },
  } as ConfigService;
}

function createChargeInput(): Parameters<
  FinancePaymentClientService['charge']
>[0] {
  return {
    payerUserId: 'payer-id',
    idempotencyKey: 'video-purchase:payer-id:video-id',
    traceId: 'request-id',
    serviceType: 'video',
    serviceId: 'video-id',
    channelId: 'channel-id',
    channelOwnerId: 'owner-id',
    coinAmount: 100,
    metadata: {
      videoTitle: 'Video title',
    },
  };
}
