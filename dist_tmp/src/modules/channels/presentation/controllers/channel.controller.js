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
exports.ChannelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_id_decorator_1 = require("@shared/presentation/decorators/user-id.decorator");
const channel_application_service_1 = require("../../application/channel.application.service");
let ChannelController = class ChannelController {
    channelApplicationService;
    constructor(channelApplicationService) {
        this.channelApplicationService = channelApplicationService;
    }
    async createChannel(userId, dto) {
        const channel = await this.channelApplicationService.createChannel({
            userId,
            name: dto.name,
            bio: dto.bio,
        });
        return this.mapToResponseDto(channel);
    }
    async updateChannel(userId, channelId, dto) {
        const channel = await this.channelApplicationService.updateChannel({
            channelId,
            userId,
            name: dto.name,
            bio: dto.bio,
            avatarUrl: dto.avatarUrl,
            bannerUrl: dto.bannerUrl,
        });
        return this.mapToResponseDto(channel);
    }
    async getChannelDetail(channelId) {
        const result = await this.channelApplicationService.getChannelDetail(channelId);
        return {
            id: result.channel.id,
            userId: result.channel.userId,
            name: result.channel.name,
            bio: result.channel.bio,
            avatarUrl: result.channel.avatarUrl,
            bannerUrl: result.channel.bannerUrl,
            status: result.channel.status,
            membershipTiers: result.membershipTiers.map((tier) => ({
                id: tier.id,
                channelId: tier.channelId,
                name: tier.name,
                level: tier.level,
                priceCoin: tier.priceCoin,
                isAcceptingNew: tier.isAcceptingNew,
                createdAt: tier.createdAt.toISOString(),
                updatedAt: tier.updatedAt.toISOString(),
            })),
            publicVideos: result.publicVideos.map((video) => ({
                id: video.id,
                title: video.title,
                category: video.category,
                status: video.status,
                thumbnailUrl: video.thumbnailUrl,
                publishedAt: video.publishedAt?.toISOString() ?? null,
            })),
        };
    }
    async getSubscriptionStatus(userId, channelId) {
        const status = await this.channelApplicationService.getSubscriptionStatus({
            channelId,
            userId,
        });
        return {
            isActive: status.isActive,
            membershipId: status.membershipId,
            expiryDate: status.expiryDate?.toISOString() ?? null,
        };
    }
    mapToResponseDto(app) {
        return {
            id: app.id,
            userId: app.userId,
            name: app.name,
            bio: app.bio,
            isEligibleForMembership: app.isEligibleForMembership,
            avatarUrl: app.avatarUrl,
            bannerUrl: app.bannerUrl,
            status: app.status,
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
        };
    }
};
exports.ChannelController = ChannelController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "updateChannel", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getChannelDetail", null);
__decorate([
    (0, common_1.Get)(':id/subscription-status'),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getSubscriptionStatus", null);
exports.ChannelController = ChannelController = __decorate([
    (0, swagger_1.ApiTags)('channels'),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', required: true }),
    (0, common_1.Controller)('channels'),
    __metadata("design:paramtypes", [channel_application_service_1.ChannelApplicationService])
], ChannelController);
//# sourceMappingURL=channel.controller.js.map