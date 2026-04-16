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
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_id_decorator_1 = require("@shared/presentation/decorators/user-id.decorator");
const video_application_service_1 = require("../../application/video.application.service");
const video_dto_1 = require("../dtos/video.dto");
let VideosController = class VideosController {
    videoApplicationService;
    constructor(videoApplicationService) {
        this.videoApplicationService = videoApplicationService;
    }
    async initUpload(userId, dto) {
        return this.videoApplicationService.initUpload({
            userId,
            channelId: dto.channelId,
            title: dto.title,
            description: dto.description,
            category: dto.category,
            visibility: dto.visibility,
            price: dto.price,
            requiredTierLevel: dto.requiredTierLevel ?? null,
        });
    }
    async confirmUpload(userId, videoId, dto) {
        return this.videoApplicationService.confirmUpload({
            userId,
            videoId,
            resolutions: dto.resolutions,
        });
    }
    async playVideo(userId, videoId) {
        return this.videoApplicationService.playVideo({
            userId,
            videoId,
        });
    }
    async latest(limit) {
        const rows = await this.videoApplicationService.getLatest(Number(limit) || 20);
        return rows.map((row) => this.toDto(row));
    }
    async byCategory(category, limit) {
        const rows = await this.videoApplicationService.getByCategory(category, Number(limit) || 20);
        return rows.map((row) => this.toDto(row));
    }
    async subscribed(userId, limit) {
        const rows = await this.videoApplicationService.getSubscribed(userId, Number(limit) || 20);
        return rows.map((row) => this.toDto(row));
    }
    toDto(video) {
        return {
            id: video.id,
            channelId: video.channelId,
            title: video.title,
            description: video.description,
            category: video.category,
            status: video.status,
            price: video.price,
            requiredTierLevel: video.requiredTierLevel,
            thumbnailUrl: video.thumbnailUrl,
            durationSeconds: video.durationSeconds,
            resolutions: video.resolutions,
            viewCount: video.viewCount,
            publishedAt: video.publishedAt?.toISOString() ?? null,
            createdAt: video.createdAt.toISOString(),
            updatedAt: video.updatedAt.toISOString(),
        };
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, common_1.Post)('init-upload'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a draft video and return a presigned upload URL' }),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, video_dto_1.InitVideoUploadRequestDto]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "initUpload", null);
__decorate([
    (0, common_1.Post)(':id/confirm-upload'),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, video_dto_1.ConfirmVideoUploadRequestDto]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "confirmUpload", null);
__decorate([
    (0, common_1.Get)(':id/play'),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "playVideo", null);
__decorate([
    (0, common_1.Get)('discovery/latest'),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "latest", null);
__decorate([
    (0, common_1.Get)('discovery/by-category'),
    (0, swagger_1.ApiQuery)({ name: 'category', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "byCategory", null);
__decorate([
    (0, common_1.Get)('discovery/subscribed'),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "subscribed", null);
exports.VideosController = VideosController = __decorate([
    (0, swagger_1.ApiTags)('videos'),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', required: true }),
    (0, common_1.Controller)('videos'),
    __metadata("design:paramtypes", [video_application_service_1.VideoApplicationService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map