import { PaginationDto, PaginationMeta } from './pagination.dto';
export interface ApiResponseOptions<T> {
    data?: T;
    mess?: string;
    pagination?: PaginationDto;
}
export declare class ApiResponse<T> {
    success: true;
    code: number;
    data: T | null;
    mess?: string;
    pagination?: PaginationMeta;
    constructor(success: true, code: number, options: ApiResponseOptions<T>);
    static success<T>(data: T, mess?: string, pagination?: PaginationDto): ApiResponse<T>;
    static created<T>(data: T, mess?: string): ApiResponse<T>;
}
export declare class ApiError {
    success: false;
    code: number;
    mess: string;
    data: null;
    errors: string[];
    requestId?: string;
    timestamp: string;
    path?: string;
    constructor(code: number, mess: string, errors?: string[], requestId?: string, path?: string);
    static create(code: number, mess: string, errors?: string[], requestId?: string, path?: string): ApiError;
}
