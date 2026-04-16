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
exports.VideoRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const video_entity_1 = require("../../domain/entities/video.entity");
const video_orm_entity_1 = require("./video.orm-entity");
let VideoRepository = class VideoRepository {
    ormRepository;
    constructor(ormRepository) {
        this.ormRepository = ormRepository;
    }
    async save(video) {
        await this.ormRepository.save({
            id: video.id,
            channelId: video.channelId,
            ownerId: video.ownerId,
            title: video.title,
            description: video.description,
            category: video.category,
            visibility: video.visibility,
            status: video.status,
            price: video.price,
            requiredTierLevel: video.requiredTierLevel,
            rawFileKey: video.rawFileKey,
            masterPlaylistKey: video.masterPlaylistKey,
            thumbnailUrl: video.thumbnailUrl,
            durationSeconds: video.durationSeconds,
            resolutions: video.resolutions,
            errorMessage: video.errorMessage,
            viewCount: video.viewCount,
            publishedAt: video.publishedAt,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
        });
    }
    async findById(id) {
        const row = await this.ormRepository.findOne({ where: { id } });
        return row ? this.toDomain(row) : null;
    }
    async findPublicByChannelId(channelId) {
        const rows = await this.ormRepository.find({
            where: {
                channelId,
                status: video_entity_1.VideoStatus.PUBLIC,
                visibility: video_entity_1.VideoVisibility.PUBLIC,
            },
            order: { publishedAt: 'DESC', createdAt: 'DESC' },
        });
        return rows.map((row) => this.toDomain(row));
    }
    async findLatestPublic(limit) {
        const rows = await this.ormRepository.find({
            where: {
                status: video_entity_1.VideoStatus.PUBLIC,
                visibility: video_entity_1.VideoVisibility.PUBLIC,
            },
            order: { publishedAt: 'DESC', createdAt: 'DESC' },
            take: limit,
        });
        return rows.map((row) => this.toDomain(row));
    }
    async findByCategory(category, limit) {
        const rows = await this.ormRepository.find({
            where: {
                category,
                status: video_entity_1.VideoStatus.PUBLIC,
                visibility: video_entity_1.VideoVisibility.PUBLIC,
            },
            order: { publishedAt: 'DESC', createdAt: 'DESC' },
            take: limit,
        });
        return rows.map((row) => this.toDomain(row));
    }
    async findByChannelIds(channelIds, limit) {
        if (channelIds.length === 0) {
            return [];
        }
        const rows = await this.ormRepository.find({
            where: {
                channelId: (0, typeorm_2.In)(channelIds),
                status: video_entity_1.VideoStatus.PUBLIC,
                visibility: video_entity_1.VideoVisibility.PUBLIC,
            },
            order: { publishedAt: 'DESC', createdAt: 'DESC' },
            take: limit,
        });
        return rows.map((row) => this.toDomain(row));
    }
    toDomain(row) {
        return new video_entity_1.VideoEntity({
            id: row.id,
            channelId: row.channelId,
            ownerId: row.ownerId,
            title: row.title,
            description: row.description,
            category: row.category,
            visibility: row.visibility,
            status: row.status,
            price: row.price,
            requiredTierLevel: row.requiredTierLevel,
            rawFileKey: row.rawFileKey,
            masterPlaylistKey: row.masterPlaylistKey,
            thumbnailUrl: row.thumbnailUrl,
            durationSeconds: row.durationSeconds,
            resolutions: row.resolutions.filter((value) => value.length > 0),
            errorMessage: row.errorMessage,
            viewCount: row.viewCount,
            publishedAt: row.publishedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        });
    }
};
exports.VideoRepository = VideoRepository;
exports.VideoRepository = VideoRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(video_orm_entity_1.VideoOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VideoRepository);
//# sourceMappingURL=video.repository.js.map