import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'] as string | undefined;

    if (!userId) {
      throw new UnauthorizedException(
        'Missing user identity from gateway headers',
      );
    }

    return userId;
  },
);
