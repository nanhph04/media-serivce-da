"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseUseCase = void 0;
const logger_service_1 = require("../../infrastructure/logger/logger.service");
class BaseUseCase {
    logger;
    constructor() {
        this.logger = new logger_service_1.LoggerService();
        this.logger.setContext(this.constructor.name);
    }
}
exports.BaseUseCase = BaseUseCase;
//# sourceMappingURL=base.use-case.js.map