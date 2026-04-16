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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordVideoViewUseCase = void 0;
const common_1 = require("@nestjs/common");
const cache_service_1 = require("@shared/infrastructure/cache/cache.service");
const kafka_constants_1 = require("@shared/infrastructure/messaging/kafka.constants");
const kafka_service_1 = require("@shared/infrastructure/messaging/kafka.service");
const config_service_1 = require("@shared/infrastructure/config/config.service");
let RecordVideoViewUseCase = class RecordVideoViewUseCase {
    cacheService;
    kafkaService;
    configService;
    constructor(cacheService, kafkaService, configService) {
        this.cacheService = cacheService;
        this.kafkaService = kafkaService;
        this.configService = configService;
    }
    async execute(input) {
        const dedupeKey = `media:view:${input.userId}:${input.videoId}`;
        const wasCreated = await this.cacheService.setIfNotExists(dedupeKey, '1', this.configService.getNumber('VIDEO_VIEW_DEDUPE_TTL_SECONDS', 60));
        if (!wasCreated) {
            return;
        }
        await this.kafkaService.emit(this.configService.get('KAFKA_VIDEO_VIEW_TOPIC', 'video.viewed'), [
            {
                key: input.videoId,
                value: {
                    eventId: crypto.randomUUID(),
                    eventType: 'video.viewed',
                    aggregateId: input.videoId,
                    timestamp: new Date().toISOString(),
                    version: 1,
                    traceId: crypto.randomUUID(),
                    sourceService: 'media-service',
                    data: {
                        videoId: input.videoId,
                        userId: input.userId,
                    },
                },
            },
        ]);
    }
};
exports.RecordVideoViewUseCase = RecordVideoViewUseCase;
exports.RecordVideoViewUseCase = RecordVideoViewUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(kafka_constants_1.KAFKA_SERVICE)),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        kafka_service_1.KafkaService,
        config_service_1.ConfigService])
], RecordVideoViewUseCase);
//# sourceMappingURL=record-video-view.use-case.js.map