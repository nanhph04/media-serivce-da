import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();
    const acceptHeader = request.headers.accept;
    const isSseRequest =
      typeof acceptHeader === 'string' &&
      acceptHeader.includes('text/event-stream');

    if (isSseRequest) {
      return next.handle();
    }

    return next.handle().pipe(
      map((body: unknown) => {
        if (response.headersSent || response.writableEnded) {
          return body;
        }

        if (body instanceof ApiResponse) {
          return body;
        }

        if (response.statusCode === 201) {
          return ApiResponse.created(body ?? null);
        }

        if (response.statusCode === 204) {
          return body;
        }

        return ApiResponse.success(body ?? null);
      }),
    );
  }
}
