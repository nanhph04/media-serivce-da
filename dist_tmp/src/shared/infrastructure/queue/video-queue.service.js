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
exports.VideoQueueService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const config_service_1 = require("../config/config.service");
let VideoQueueService = class VideoQueueService {
    configService;
    queue;
    constructor(configService) {
        this.configService = configService;
        this.queue = new bullmq_1.Queue(this.configService.get('BULLMQ_QUEUE_NAME', 'video-processing'), {
            connection: {
                host: this.configService.get('REDIS_HOST', 'localhost'),
                port: this.configService.getNumber('REDIS_PORT', 6379),
                password: this.configService.get('REDIS_PASSWORD'),
                db: this.configService.getNumber('REDIS_DB', 0),
            },
        });
    }
    async enqueueTranscodeJob(payload) {
        await this.queue.add('transcode-job', payload, { attempts: 3 });
    }
    async onModuleDestroy() {
        await this.queue.close();
    }
};
exports.VideoQueueService = VideoQueueService;
exports.VideoQueueService = VideoQueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], VideoQueueService);
//# sourceMappingURL=video-queue.service.js.map