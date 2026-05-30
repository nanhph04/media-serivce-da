import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { ApiError } from '../../presentation/dto/api-response.dto';
import { DomainException } from '../../domain/exceptions/domain.exception';

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  errorCode?: string;
}

const DOMAIN_CODE_TO_HTTP: Record<string, number> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  BAD_REQUEST: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  CONFLICT: HttpStatus.CONFLICT,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  INTERNAL_SERVER_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
  TOO_MANY_REQUESTS: HttpStatus.TOO_MANY_REQUESTS,
};

const HTTP_STATUS_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

interface RequestWithId extends Request {
  requestId?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    if (response.headersSent || response.writableEnded) {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = HTTP_STATUS_TO_ERROR_CODE[HttpStatus.INTERNAL_SERVER_ERROR];

    if (exception instanceof DomainException) {
      status =
        DOMAIN_CODE_TO_HTTP[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      errorCode = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = HTTP_STATUS_TO_ERROR_CODE[status];
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as HttpExceptionResponse;
        if (resp.message) {
          message = Array.isArray(resp.message)
            ? resp.message[0]
            : resp.message;
        } else if (resp.error) {
          message = resp.error;
        }

        errorCode = resp.errorCode ?? errorCode;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestId = request.requestId ?? 'unknown';
    const apiError = ApiError.create(status, message, {
      errorCode,
      requestId,
      path: request.url,
    });

    this.logger.logError(`HTTP ${status} Error`, exception, {
      requestId,
      path: request.url,
      method: request.method,
      statusCode: status,
    });

    response.status(status).json(apiError);
  }
}
