import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { ApiError } from '../../presentation/dto/api-response.dto';
import { DomainException } from '../../domain/exceptions/domain.exception';

interface HttpExceptionResponse {
  mess?: string;
  errors?: string[];
  message?: string | string[];
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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof DomainException) {
      status =
        DOMAIN_CODE_TO_HTTP[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      errors = exception.errors || [exception.message];
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errors = [exceptionResponse];
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as HttpExceptionResponse;
        if (resp.mess) {
          message = resp.mess;
          errors = resp.errors ?? [resp.mess];
        } else if (resp.message) {
          message = Array.isArray(resp.message)
            ? resp.message[0]
            : resp.message;
          errors = Array.isArray(resp.message) ? resp.message : [resp.message];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [exception.message];
    }

    const requestId = request.requestId ?? 'unknown';
    const apiError = ApiError.create(
      status,
      message,
      errors,
      requestId,
      request.url,
    );

    this.logger.logError(`HTTP ${status} Error`, exception, {
      requestId,
      path: request.url,
      method: request.method,
      statusCode: status,
    });

    response.status(status).json(apiError);
  }
}
