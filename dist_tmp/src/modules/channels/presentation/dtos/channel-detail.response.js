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
exports.ChannelSubscriptionStatusResponseDto = exports.ChannelDetailResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const membership_tier_response_1 = require("./membership-tier.response");
class PublicVideoDto {
    id;
    title;
    category;
    status;
    thumbnailUrl;
    publishedAt;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PublicVideoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PublicVideoDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PublicVideoDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PublicVideoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PublicVideoDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], PublicVideoDto.prototype, "publishedAt", void 0);
class ChannelDetailResponseDto {
    id;
    userId;
    name;
    bio;
    avatarUrl;
    bannerUrl;
    status;
    membershipTiers;
    publicVideos;
}
exports.ChannelDetailResponseDto = ChannelDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "bannerUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChannelDetailResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [membership_tier_response_1.MembershipTierResponseDto] }),
    __metadata("design:type", Array)
], ChannelDetailResponseDto.prototype, "membershipTiers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PublicVideoDto] }),
    __metadata("design:type", Array)
], ChannelDetailResponseDto.prototype, "publicVideos", void 0);
class ChannelSubscriptionStatusResponseDto {
    isActive;
    membershipId;
    expiryDate;
}
exports.ChannelSubscriptionStatusResponseDto = ChannelSubscriptionStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ChannelSubscriptionStatusResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ChannelSubscriptionStatusResponseDto.prototype, "membershipId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ChannelSubscriptionStatusResponseDto.prototype, "expiryDate", void 0);
//# sourceMappingURL=channel-detail.response.js.map