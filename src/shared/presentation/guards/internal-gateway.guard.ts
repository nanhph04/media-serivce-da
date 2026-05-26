import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import type { Request } from 'express';
import { ConfigService } from '../../infrastructure/config/config.service';
import { SKIP_INTERNAL_GATEWAY_GUARD } from '../decorators/skip-internal-gateway.decorator';

@Injectable()
export class InternalGatewayGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_INTERNAL_GATEWAY_GUARD,
      [context.getHandler(), context.getClass()],
    );

    if (shouldSkip) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const gatewaySecret = request.headers['x-internal-secret'];
    const expectedSecret = this.configService.getOrThrow<string>(
      'INTERNAL_GATEWAY_SECRET',
    );

    if (
      typeof gatewaySecret !== 'string' ||
      gatewaySecret.length === 0 ||
      gatewaySecret !== expectedSecret
    ) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.INTERNAL_GATEWAY_SECRET_REQUIRED,
      );
    }

    return true;
  }
}
