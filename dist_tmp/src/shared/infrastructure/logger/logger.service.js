"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
let LoggerService = class LoggerService extends common_1.ConsoleLogger {
    logInfo(message, meta) {
        if (meta && Object.keys(meta).length > 0) {
            super.log(`${message} ${this.formatMeta(meta)}`);
        }
        else {
            super.log(message);
        }
    }
    logWarn(message, meta) {
        if (meta && Object.keys(meta).length > 0) {
            super.warn(`${message} ${this.formatMeta(meta)}`);
        }
        else {
            super.warn(message);
        }
    }
    logError(message, error, meta) {
        const stack = error instanceof Error ? error.stack : undefined;
        const errorInfo = error instanceof Error ? { errorMessage: error.message } : {};
        const merged = { ...errorInfo, ...meta };
        if (Object.keys(merged).length > 0) {
            super.error(`${message} ${this.formatMeta(merged)}`, stack);
        }
        else {
            super.error(message, stack);
        }
    }
    setContext(context) {
        super.setContext(context);
    }
    setLogLevels(levels) {
        super.setLogLevels(levels);
    }
    formatMeta(meta) {
        try {
            return JSON.stringify(meta);
        }
        catch {
            return '[Unserializable meta]';
        }
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT })
], LoggerService);
//# sourceMappingURL=logger.service.js.map