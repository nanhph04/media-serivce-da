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
exports.VideoOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const video_entity_1 = require("../../domain/entities/video.entity");
let VideoOrmEntity = class VideoOrmEntity {
    id;
    channelId;
    ownerId;
    title;
    description;
    category;
    visibility;
    status;
    price;
    requiredTierLevel;
    rawFileKey;
    masterPlaylistKey;
    thumbnailUrl;
    durationSeconds;
    resolutions;
    errorMessage;
    viewCount;
    publishedAt;
    createdAt;
    updatedAt;
};
exports.VideoOrmEntity = VideoOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'channel_id' }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'owner_id' }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'general' }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: video_entity_1.VideoVisibility, default: video_entity_1.VideoVisibility.PUBLIC }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: video_entity_1.VideoStatus, default: video_entity_1.VideoStatus.DRAFT }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], VideoOrmEntity.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'required_tier_level', nullable: true }),
    __metadata("design:type", Object)
], VideoOrmEntity.prototype, "requiredTierLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'raw_file_key' }),
    __metadata("design:type", String)
], VideoOrmEntity.prototype, "rawFileKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'master_playlist_key', nullable: true }),
    __metadata("design:type", Object)
], VideoOrmEntity.prototype, "masterPlaylistKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'thumbnail_url', nullable: true }),
    __metadata("design:type", Object)
], VideoOrmEntity.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'duration_seconds', nullable: true }),
    __metadata("design:type", Object)
], VideoOrmEntity.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', default: '' }),
    __metadata("design:type", Array)
], VideoOrmEntity.prototype, "resolutions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'error_message', nullable: true }),
    __metadata("design:type", Object)
], VideoOrmEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'view_count', default: 0 }),
    __metadata("design:type", Number)
], VideoOrmEntity.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'published_at', nullable: true }),
    __metadata("design:type", Object)
], VideoOrmEntity.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], VideoOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], VideoOrmEntity.prototype, "updatedAt", void 0);
exports.VideoOrmEntity = VideoOrmEntity = __decorate([
    (0, typeorm_1.Entity)('videos'),
    (0, typeorm_1.Index)(['channelId', 'status']),
    (0, typeorm_1.Index)(['category', 'status'])
], VideoOrmEntity);
//# sourceMappingURL=video.orm-entity.js.map