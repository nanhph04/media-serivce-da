"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("../config/config.module");
const config_service_1 = require("../config/config.service");
const logger_module_1 = require("../logger/logger.module");
const logger_service_1 = require("../logger/logger.service");
const kafka_service_1 = require("./kafka.service");
const kafka_constants_1 = require("./kafka.constants");
let KafkaModule = class KafkaModule {
};
exports.KafkaModule = KafkaModule;
exports.KafkaModule = KafkaModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_module_1.ConfigModule, logger_module_1.LoggerModule],
        providers: [
            {
                provide: kafka_constants_1.KAFKA_SERVICE,
                inject: [config_service_1.ConfigService, logger_service_1.LoggerService],
                useFactory: (configService, loggerService) => {
                    const enableEnv = configService.get('KAFKA_ENABLE');
                    const isKafkaEnabled = enableEnv === 'true';
                    const brokersEnv = configService.get('KAFKA_BROKERS');
                    const brokersArray = brokersEnv
                        ? brokersEnv.split(',')
                        : ['localhost:9092'];
                    const kafkaOptions = {
                        enable: isKafkaEnabled,
                        client: {
                            clientId: configService.get('KAFKA_CLIENT_ID') || 'user-service',
                            brokers: brokersArray,
                        },
                        consumer: {
                            groupId: configService.get('KAFKA_CONSUMER_GROUP_ID') ||
                                'user-service-group',
                        },
                    };
                    return new kafka_service_1.KafkaService(kafkaOptions, loggerService);
                },
            },
        ],
        exports: [kafka_constants_1.KAFKA_SERVICE],
    })
], KafkaModule);
//# sourceMappingURL=kafka.module.js.map