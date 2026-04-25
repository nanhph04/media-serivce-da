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

const BODY_LOG_METHODS = new Set(['POST', 'PATCH']);
const MAX_LOGGED_BODY_LENGTH = 2048;

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const body = request.body as Record<string, unknown> | undefined;
    const requestId = this.resolveRequestId(request);
    const startTime = Date.now();

    request.requestId = requestId;

    const safeBody = this.buildSafeBody(body, method, url);

    this.logger.logInfo('Incoming request', {
      requestId,
      method,
      url,
      ip,
      ...(safeBody ? { body: safeBody } : {}),
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

  private resolveRequestId(request: Request): string {
    const forwardedRequestId = request.headers['x-request-id'];

    if (
      typeof forwardedRequestId === 'string' &&
      forwardedRequestId.trim().length > 0
    ) {
      return forwardedRequestId;
    }

    return this.generateRequestId();
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

  private buildSafeBody(
    body: Record<string, unknown> | undefined,
    method: string,
    url: string,
  ): Record<string, unknown> | undefined {
    if (!body || !this.shouldLogBody(method, url)) {
      return undefined;
    }

    const masked = this.maskSensitiveData(body);
    if (!masked) {
      return undefined;
    }

    const serialized = JSON.stringify(masked);
    if (serialized.length <= MAX_LOGGED_BODY_LENGTH) {
      return masked;
    }

    return {
      truncated: true,
      preview: serialized.slice(0, MAX_LOGGED_BODY_LENGTH),
      originalSize: serialized.length,
    };
  }

  private shouldLogBody(method: string, url: string): boolean {
    return BODY_LOG_METHODS.has(method.toUpperCase()) && !url.includes('/stream/');
  }
}
