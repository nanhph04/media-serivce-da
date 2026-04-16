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
exports.MembershipTierController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_id_decorator_1 = require("@shared/presentation/decorators/user-id.decorator");
const channel_application_service_1 = require("../../application/channel.application.service");
let MembershipTierController = class MembershipTierController {
    channelApplicationService;
    constructor(channelApplicationService) {
        this.channelApplicationService = channelApplicationService;
    }
    async getMembershipTiers(channelId) {
        const appResult = await this.channelApplicationService.getTiers(channelId);
        return appResult.map((tier) => this.mapToResponseDto(tier));
    }
    async getMembershipTier(channelId, tierId) {
        const appResult = await this.channelApplicationService.getTier(channelId, tierId);
        return this.mapToResponseDto(appResult);
    }
    async createMembershipTier(userId, channelId, dto) {
        const appResult = await this.channelApplicationService.createTier({
            channelId,
            userId,
            name: dto.name,
            level: dto.level,
            priceCoin: dto.priceCoin,
        });
        return this.mapToResponseDto(appResult);
    }
    async updateMembershipTier(userId, channelId, tierId, dto) {
        const appResult = await this.channelApplicationService.updateTier({
            channelId,
            tierId,
            userId,
            name: dto.name,
            priceCoin: dto.priceCoin,
            isAcceptingNew: dto.isAcceptingNew,
        });
        return this.mapToResponseDto(appResult);
    }
    async deleteMembershipTier(userId, channelId, tierId) {
        const appResult = await this.channelApplicationService.disableTier({
            channelId,
            tierId,
            userId,
        });
        return this.mapToResponseDto(appResult);
    }
    mapToResponseDto = (app) => {
        return {
            id: app.id,
            channelId: app.channelId,
            name: app.name,
            level: app.level,
            priceCoin: app.priceCoin,
            isAcceptingNew: app.isAcceptingNew,
            createdAt: app.createdAt.toISOString(),
            updatedAt: app.updatedAt.toISOString(),
        };
    };
};
exports.MembershipTierController = MembershipTierController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('channelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MembershipTierController.prototype, "getMembershipTiers", null);
__decorate([
    (0, common_1.Get)(':tierId'),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Param)('tierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MembershipTierController.prototype, "getMembershipTier", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Function]),
    __metadata("design:returntype", Promise)
], MembershipTierController.prototype, "createMembershipTier", null);
__decorate([
    (0, common_1.Patch)(':tierId'),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Param)('tierId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Function]),
    __metadata("design:returntype", Promise)
], MembershipTierController.prototype, "updateMembershipTier", null);
__decorate([
    (0, common_1.Delete)(':tierId'),
    __param(0, (0, user_id_decorator_1.CurrentUserId)()),
    __param(1, (0, common_1.Param)('channelId')),
    __param(2, (0, common_1.Param)('tierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MembershipTierController.prototype, "deleteMembershipTier", null);
exports.MembershipTierController = MembershipTierController = __decorate([
    (0, swagger_1.ApiTags)('membership-tiers'),
    (0, swagger_1.ApiHeader)({ name: 'x-user-id', required: true }),
    (0, common_1.Controller)('channels/:channelId/membership-tiers'),
    __metadata("design:paramtypes", [channel_application_service_1.ChannelApplicationService])
], MembershipTierController);
//# sourceMappingURL=membership-tier.controller.js.map