import type { PaginationDto, PaginationMeta } from './pagination.dto';

export interface ApiResponseOptions<T> {
  data?: T;
  message?: string;
  pagination?: PaginationDto;
}

export interface ApiErrorOptions {
  requestId?: string;
  path?: string;
  errorCode?: string;
}

export class ApiResponse<T> {
  readonly success: true;
  readonly statusCode: number;
  readonly data: T | null;
  readonly message?: string;
  readonly pagination?: PaginationMeta;

  constructor(statusCode: number, options: ApiResponseOptions<T> = {}) {
    this.success = true;
    this.statusCode = statusCode;
    this.data = options.data ?? null;
    this.message = options.message;
    this.pagination = options.pagination
      ? {
          page: options.pagination.page,
          limit: options.pagination.limit,
          total: options.pagination.total,
          totalPages: options.pagination.totalPages,
        }
      : undefined;
  }

  static withStatus<T>(
    statusCode: number,
    data: T,
    message?: string,
    pagination?: PaginationDto,
  ): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, { data, message, pagination });
  }

  static success<T>(
    data: T,
    message?: string,
    pagination?: PaginationDto,
  ): ApiResponse<T> {
    return ApiResponse.withStatus(200, data, message, pagination);
  }

  static created<T>(data: T, message?: string): ApiResponse<T> {
    return ApiResponse.withStatus(201, data, message);
  }
}

export class ApiError {
  readonly success: false;
  readonly statusCode: number;
  readonly message: string;
  readonly data: null;
  readonly errorCode?: string;
  readonly requestId?: string;
  readonly timestamp: string;
  readonly path?: string;

  constructor(
    statusCode: number,
    message: string,
    options: ApiErrorOptions = {},
  ) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.errorCode = options.errorCode;
    this.requestId = options.requestId;
    this.timestamp = new Date().toISOString();
    this.path = options.path;
  }

  static create(
    statusCode: number,
    message: string,
    options: ApiErrorOptions = {},
  ): ApiError {
    return new ApiError(statusCode, message, options);
  }
}

// Controllers return the inner DTO; the global interceptor wraps it at runtime.
export function apiResponseContract<T>(data: T): ApiResponse<T> {
  return data as unknown as ApiResponse<T>;
}
