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
exports.LoggerInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("../../infrastructure/logger/logger.service");
let LoggerInterceptor = class LoggerInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, ip } = request;
        const body = request.body;
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
        return next.handle().pipe((0, operators_1.tap)({
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
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logger.logError(`Request failed`, error, {
                    requestId,
                    method,
                    url,
                    duration: `${duration}ms`,
                });
            },
        }));
    }
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    maskSensitiveData(body) {
        if (!body)
            return body;
        const masked = { ...body };
        if (masked.password)
            masked.password = '***';
        if (masked.refreshToken)
            masked.refreshToken = '***';
        return masked;
    }
};
exports.LoggerInterceptor = LoggerInterceptor;
exports.LoggerInterceptor = LoggerInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], LoggerInterceptor);
//# sourceMappingURL=logger.interceptor.js.map