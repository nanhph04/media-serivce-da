"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channels_module_1 = require("../channels/channels.module");
const engagement_module_1 = require("../engagement/engagement.module");
const video_application_service_1 = require("./application/video.application.service");
const video_processing_consumer_1 = require("./infrastructure/consumers/video-processing.consumer");
const video_purchase_unlock_orm_entity_1 = require("./infrastructure/persistence/video-purchase-unlock.orm-entity");
const video_purchase_unlock_repository_1 = require("./infrastructure/persistence/video-purchase-unlock.repository");
const video_orm_entity_1 = require("./infrastructure/persistence/video.orm-entity");
const video_repository_1 = require("./infrastructure/persistence/video.repository");
const videos_controller_1 = require("./presentation/controllers/videos.controller");
let VideosModule = class VideosModule {
};
exports.VideosModule = VideosModule;
exports.VideosModule = VideosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([video_orm_entity_1.VideoOrmEntity, video_purchase_unlock_orm_entity_1.VideoPurchaseUnlockOrmEntity]),
            channels_module_1.ChannelsModule,
            engagement_module_1.EngagementModule,
        ],
        controllers: [videos_controller_1.VideosController],
        providers: [
            video_repository_1.VideoRepository,
            video_purchase_unlock_repository_1.VideoPurchaseUnlockRepository,
            video_application_service_1.VideoApplicationService,
            video_processing_consumer_1.VideoProcessingConsumer,
        ],
        exports: [video_repository_1.VideoRepository, video_application_service_1.VideoApplicationService],
    })
], VideosModule);
//# sourceMappingURL=videos.module.js.map