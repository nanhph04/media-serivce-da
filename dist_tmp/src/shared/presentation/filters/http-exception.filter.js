"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
const api_response_dto_1 = require("../../presentation/dto/api-response.dto");
const domain_exception_1 = require("../../domain/exceptions/domain.exception");
const DOMAIN_CODE_TO_HTTP = {
    NOT_FOUND: common_1.HttpStatus.NOT_FOUND,
    BAD_REQUEST: common_1.HttpStatus.BAD_REQUEST,
    UNAUTHORIZED: common_1.HttpStatus.UNAUTHORIZED,
    CONFLICT: common_1.HttpStatus.CONFLICT,
    FORBIDDEN: common_1.HttpStatus.FORBIDDEN,
    INTERNAL_SERVER_ERROR: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
    TOO_MANY_REQUESTS: common_1.HttpStatus.TOO_MANY_REQUESTS,
};
let HttpExceptionFilter = class HttpExceptionFilter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors = [];
        if (exception instanceof domain_exception_1.DomainException) {
            status =
                DOMAIN_CODE_TO_HTTP[exception.code] || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            errors = exception.errors || [exception.message];
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                errors = [exceptionResponse];
            }
            else if (typeof exceptionResponse === 'object' &&
                exceptionResponse !== null) {
                const resp = exceptionResponse;
                if (resp.mess) {
                    message = resp.mess;
                    errors = resp.errors ?? [resp.mess];
                }
                else if (resp.message) {
                    message = Array.isArray(resp.message)
                        ? resp.message[0]
                        : resp.message;
                    errors = Array.isArray(resp.message) ? resp.message : [resp.message];
                }
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
            errors = [exception.message];
        }
        const requestId = request.requestId ?? 'unknown';
        const apiError = api_response_dto_1.ApiError.create(status, message, errors, requestId, request.url);
        this.logger.logError(`HTTP ${status} Error`, exception, {
            requestId,
            path: request.url,
            method: request.method,
            statusCode: status,
        });
        response.status(status).json(apiError);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map