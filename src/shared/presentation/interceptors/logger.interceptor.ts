import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { Request, Response } from 'express';

interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const body = request.body as Record<string, unknown> | undefined;
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    request.requestId = requestId;

    const safeBody = this.maskSensitiveData(body);

    this.logger.logInfo(`Incoming request`, {
      requestId,
      method,
      url,
      ip,
      body: safeBody,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;

          this.logger.logInfo(`Response sent`, {
            requestId,
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error: unknown) => {
          const duration = Date.now() - startTime;

          this.logger.logError(`Request failed`, error, {
            requestId,
            method,
            url,
            duration: `${duration}ms`,
          });
        },
      }),
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private maskSensitiveData(
    body: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!body) return body;
    const masked = { ...body };
    if (masked.password) masked.password = '***';
    if (masked.refreshToken) masked.refreshToken = '***';
    return masked;
  }
}
