import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

interface RequestWithId extends Request {
  requestId?: string;
}

export const CurrentRequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithId>();
    const forwardedRequestId = request.headers['x-request-id'];

    if (
      typeof forwardedRequestId === 'string' &&
      forwardedRequestId.length > 0
    ) {
      return forwardedRequestId;
    }

    return request.requestId ?? randomUUID();
  },
);
