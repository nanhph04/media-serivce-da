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
exports.VideoResponseDto = exports.ConfirmVideoUploadRequestDto = exports.InitVideoUploadRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class InitVideoUploadRequestDto {
    channelId;
    title;
    description = '';
    category = 'general';
    visibility = 'public';
    price = 0;
    requiredTierLevel;
}
exports.InitVideoUploadRequestDto = InitVideoUploadRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitVideoUploadRequestDto.prototype, "channelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], InitVideoUploadRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InitVideoUploadRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 'general' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InitVideoUploadRequestDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['public', 'private'], default: 'public' }),
    (0, class_validator_1.IsIn)(['public', 'private']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InitVideoUploadRequestDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InitVideoUploadRequestDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], InitVideoUploadRequestDto.prototype, "requiredTierLevel", void 0);
class ConfirmVideoUploadRequestDto {
    resolutions;
}
exports.ConfirmVideoUploadRequestDto = ConfirmVideoUploadRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['360p', '720p', '1080p'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ConfirmVideoUploadRequestDto.prototype, "resolutions", void 0);
class VideoResponseDto {
    id;
    channelId;
    title;
    description;
    category;
    status;
    price;
    requiredTierLevel;
    thumbnailUrl;
    durationSeconds;
    resolutions;
    viewCount;
    publishedAt;
    createdAt;
    updatedAt;
}
exports.VideoResponseDto = VideoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "channelId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], VideoResponseDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], VideoResponseDto.prototype, "requiredTierLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], VideoResponseDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], VideoResponseDto.prototype, "durationSeconds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], VideoResponseDto.prototype, "resolutions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], VideoResponseDto.prototype, "viewCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], VideoResponseDto.prototype, "publishedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], VideoResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=video.dto.js.map