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
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConfigService = class ConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get(key, defaultValue) {
        const value = this.configService.get(key);
        return value ?? defaultValue ?? null;
    }
    getOrThrow(key) {
        const value = this.configService.get(key);
        if (value === undefined || value === null) {
            throw new Error(`Config key "${key}" is not defined`);
        }
        return value;
    }
    isProduction() {
        return this.get('NODE_ENV') === 'production';
    }
    isDevelopment() {
        return this.get('NODE_ENV') === 'development';
    }
    getMinPriceForLevel(level) {
        const key = `MEMBERSHIP_MIN_PRICE_LV${level}`;
        const value = this.get(key);
        if (value === null) {
            return 0;
        }
        return value;
    }
    getNumber(key, defaultValue) {
        const value = this.get(key, defaultValue);
        if (typeof value === 'number') {
            return value;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? defaultValue : parsed;
    }
    getBoolean(key, defaultValue = false) {
        const value = this.get(key, defaultValue);
        if (typeof value === 'boolean') {
            return value;
        }
        return value === 'true';
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map