"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ApiResponse = void 0;
class ApiResponse {
    success;
    code;
    data;
    mess;
    pagination;
    constructor(success, code, options) {
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
    static success(data, mess, pagination) {
        return new ApiResponse(true, 200, { data, mess, pagination });
    }
    static created(data, mess) {
        return new ApiResponse(true, 201, { data, mess });
    }
}
exports.ApiResponse = ApiResponse;
class ApiError {
    success;
    code;
    mess;
    data;
    errors;
    requestId;
    timestamp;
    path;
    constructor(code, mess, errors = [], requestId, path) {
        this.success = false;
        this.code = code;
        this.mess = mess;
        this.data = null;
        this.errors = errors;
        this.requestId = requestId;
        this.timestamp = new Date().toISOString();
        this.path = path;
    }
    static create(code, mess, errors = [], requestId, path) {
        return new ApiError(code, mess, errors, requestId, path);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=api-response.dto.js.map