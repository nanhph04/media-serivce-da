import { PaginationDto, PaginationMeta } from './pagination.dto';

export interface ApiResponseOptions<T> {
  data?: T;
  mess?: string;
  pagination?: PaginationDto;
}

export class ApiResponse<T> {
  success: true;
  code: number;
  data: T | null;
  mess?: string;
  pagination?: PaginationMeta;

  constructor(success: true, code: number, options: ApiResponseOptions<T>) {
    this.success = success;
    this.code = code;
    this.data = options.data ?? null;
    this.mess = options.mess;
    this.pagination = options.pagination
      ? {
          page: options.pagination.page,
          limit: options.pagination.limit,
          total: options.pagination.total,
          totalPages: options.pagination.totalPages,
        }
      : undefined;
  }

  static success<T>(
    data: T,
    mess?: string,
    pagination?: PaginationDto,
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, 200, { data, mess, pagination });
  }

  static created<T>(data: T, mess?: string): ApiResponse<T> {
    return new ApiResponse<T>(true, 201, { data, mess });
  }
}

export class ApiError {
  success: false;
  code: number;
  mess: string;
  data: null;
  errors: string[];
  requestId?: string;
  timestamp: string;
  path?: string;

  constructor(
    code: number,
    mess: string,
    errors: string[] = [],
    requestId?: string,
    path?: string,
  ) {
    this.success = false;
    this.code = code;
    this.mess = mess;
    this.data = null;
    this.errors = errors;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }

  static create(
    code: number,
    mess: string,
    errors: string[] = [],
    requestId?: string,
    path?: string,
  ): ApiError {
    return new ApiError(code, mess, errors, requestId, path);
  }
}
