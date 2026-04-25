import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggerInterceptor } from './logger.interceptor';

describe('LoggerInterceptor', () => {
  const logger = {
    logInfo: jest.fn(),
    logError: jest.fn(),
  };

  const interceptor = new LoggerInterceptor(logger as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs masked body for mutation requests outside streaming routes', () => {
    const context = createContext({
      method: 'POST',
      url: '/api/media/videos/init-upload',
      body: {
        title: 'Video',
        password: 'secret',
      },
    });

    interceptor.intercept(context as ExecutionContext, createNext());

    expect(logger.logInfo).toHaveBeenCalledWith(
      'Incoming request',
      expect.objectContaining({
        body: {
          title: 'Video',
          password: '***',
        },
      }),
    );
  });

  it('does not include body for streaming routes', () => {
    const context = createContext({
      method: 'GET',
      url: '/api/media/stream/video-1/master.m3u8',
      body: {
        token: 'secret-token',
      },
    });

    interceptor.intercept(context as ExecutionContext, createNext());

    expect(logger.logInfo).toHaveBeenCalledWith(
      'Incoming request',
      expect.not.objectContaining({
        body: expect.anything(),
      }),
    );
  });

  it('truncates oversized bodies before logging', () => {
    const context = createContext({
      method: 'PATCH',
      url: '/api/media/videos/video-1/metadata',
      body: {
        description: 'a'.repeat(3000),
      },
    });

    interceptor.intercept(context as ExecutionContext, createNext());

    expect(logger.logInfo).toHaveBeenCalledWith(
      'Incoming request',
      expect.objectContaining({
        body: expect.objectContaining({
          truncated: true,
          originalSize: expect.any(Number),
        }),
      }),
    );
  });
});

function createContext(input: {
  method: string;
  url: string;
  body: Record<string, unknown>;
}): Partial<ExecutionContext> {
  const request = {
    method: input.method,
    url: input.url,
    ip: '127.0.0.1',
    body: input.body,
    headers: {},
  };
  const response = {
    statusCode: 200,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };
}

function createNext(): CallHandler {
  return {
    handle: () => of({ ok: true }),
  };
}
