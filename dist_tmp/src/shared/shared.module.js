"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const cache_module_1 = require("./infrastructure/cache/cache.module");
const database_module_1 = require("./infrastructure/database/database.module");
const logger_module_1 = require("./infrastructure/logger/logger.module");
const config_module_1 = require("./infrastructure/config/config.module");
const kafka_module_1 = require("./infrastructure/messaging/kafka.module");
const queue_module_1 = require("./infrastructure/queue/queue.module");
const security_module_1 = require("./infrastructure/security/security.module");
const storage_module_1 = require("./infrastructure/storage/storage.module");
const http_exception_filter_1 = require("./presentation/filters/http-exception.filter");
const logger_service_1 = require("./infrastructure/logger/logger.service");
const logger_interceptor_1 = require("./presentation/interceptors/logger.interceptor");
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            cache_module_1.CacheModule,
            database_module_1.DatabaseModule,
            logger_module_1.LoggerModule,
            config_module_1.ConfigModule,
            kafka_module_1.KafkaModule,
            queue_module_1.QueueModule,
            security_module_1.SecurityModule,
            storage_module_1.StorageModule,
        ],
        providers: [
            logger_interceptor_1.LoggerInterceptor,
            {
                provide: http_exception_filter_1.HttpExceptionFilter,
                useFactory: (logger) => new http_exception_filter_1.HttpExceptionFilter(logger),
                inject: [logger_service_1.LoggerService],
            },
        ],
        exports: [
            cache_module_1.CacheModule,
            database_module_1.DatabaseModule,
            logger_module_1.LoggerModule,
            config_module_1.ConfigModule,
            http_exception_filter_1.HttpExceptionFilter,
            logger_interceptor_1.LoggerInterceptor,
            queue_module_1.QueueModule,
            security_module_1.SecurityModule,
            storage_module_1.StorageModule,
        ],
    })
], SharedModule);
//# sourceMappingURL=shared.module.js.map