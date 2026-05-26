import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import type { Request } from 'express';

import { IInternalServiceConfig } from '@shared/application/interfaces/internal-service-config.interface';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(private readonly internalServiceConfig: IInternalServiceConfig) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const serviceName = request.headers['x-internal-service'];
    const serviceSecret = request.headers['x-internal-service-secret'];

    if (
      typeof serviceName !== 'string' ||
      serviceName.trim().length === 0 ||
      typeof serviceSecret !== 'string' ||
      serviceSecret.length === 0
    ) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.INTERNAL_SERVICE_SECRET_REQUIRED,
      );
    }

    const normalizedServiceName = serviceName.trim().toLowerCase();
    const isAllowed = this.internalServiceConfig
      .getAllowedInternalServices()
      .map((allowedService) => allowedService.trim().toLowerCase())
      .includes(normalizedServiceName);

    if (!isAllowed) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.INTERNAL_SERVICE_NOT_ALLOWED,
      );
    }

    const expectedSecret = this.internalServiceConfig.getInternalServiceSecret(
      normalizedServiceName,
    );

    if (!expectedSecret || serviceSecret !== expectedSecret) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.INTERNAL_SERVICE_SECRET_REQUIRED,
      );
    }

    return true;
  }
}
