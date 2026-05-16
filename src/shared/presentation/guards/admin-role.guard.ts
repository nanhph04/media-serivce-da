import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import type { Request } from 'express';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const role = request.headers['x-user-role'];

    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }

    return true;
  }
}
