"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const ioredis_1 = __importDefault(require("ioredis"));
const cache_service_1 = require("./cache.service");
const cache_service_2 = require("./cache.service");
let CacheModule = class CacheModule {
};
exports.CacheModule = CacheModule;
exports.CacheModule = CacheModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: cache_service_2.CACHE_CLIENT,
                useFactory: (config) => {
                    return new ioredis_1.default({
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                        password: config.get('REDIS_PASSWORD'),
                        db: config.get('REDIS_DB', 0),
                    });
                },
                inject: [config_service_1.ConfigService],
            },
            cache_service_1.CacheService,
        ],
        exports: [cache_service_1.CacheService, cache_service_2.CACHE_CLIENT],
    })
], CacheModule);
//# sourceMappingURL=cache.module.js.map