import { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { of, lastValueFrom } from 'rxjs';
import { ApiResponse } from '../dto/api-response.dto';
import { SuccessResponseInterceptor } from './success-response.interceptor';

describe('SuccessResponseInterceptor', () => {
  const interceptor = new SuccessResponseInterceptor();

  it('wraps object responses with ApiResponse.success for status 200', async () => {
    const body = { id: 'channel-1' };
    const response = createResponse(200);

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext(response), {
        handle: () => of(body),
      }),
    );

    expect(result).toEqual(ApiResponse.success(body));
  });

  it('wraps array responses with ApiResponse.success for status 200', async () => {
    const body = [{ id: 'video-1' }];
    const response = createResponse(200);

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext(response), {
        handle: () => of(body),
      }),
    );

    expect(result).toEqual(ApiResponse.success(body));
  });

  it('wraps responses with ApiResponse.created for status 201', async () => {
    const body = { id: 'video-1' };
    const response = createResponse(201);

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext(response), {
        handle: () => of(body),
      }),
    );

    expect(result).toEqual(ApiResponse.created(body));
  });

  it('does not double-wrap ApiResponse instances', async () => {
    const body = ApiResponse.success({ id: 'video-1' });
    const response = createResponse(200);

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext(response), {
        handle: () => of(body),
      }),
    );

    expect(result).toBe(body);
  });

  it('skips wrapping when headers were already sent', async () => {
    const body = { id: 'segment-1' };
    const response = createResponse(200, true);

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext(response), {
        handle: () => of(body),
      }),
    );

    expect(result).toBe(body);
  });

  it('normalizes undefined to null in wrapped responses', async () => {
    const response = createResponse(200);

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext(response), {
        handle: () => of(undefined),
      }),
    );

    expect(result).toEqual(ApiResponse.success(null));
  });
});

function createHttpContext(response: Response): ExecutionContext {
  const request = {
    headers: {},
  } as Request;

  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function createResponse(
  statusCode: number,
  headersSent = false,
): Response {
  return {
    statusCode,
    headersSent,
    writableEnded: headersSent,
  } as Response;
}
