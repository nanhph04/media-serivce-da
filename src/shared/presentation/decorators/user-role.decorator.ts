import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.headers['x-user-role'] as string | undefined;
  },
);
