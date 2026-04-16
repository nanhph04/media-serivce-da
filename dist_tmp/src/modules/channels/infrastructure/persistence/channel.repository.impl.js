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
exports.ChannelRepositoryImpl = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const channel_entity_1 = require("../../domain/entities/channel.entity");
const channel_orm_entity_1 = require("./channel.orm-entity");
let ChannelRepositoryImpl = class ChannelRepositoryImpl {
    ormRepository;
    constructor(ormRepository) {
        this.ormRepository = ormRepository;
    }
    async create(channel) {
        const ormEntity = {
            id: channel.id,
            userId: channel.userId,
            name: channel.name,
            bio: channel.bio,
            avatarUrl: channel.avatarUrl,
            bannerUrl: channel.bannerUrl,
            status: channel.status,
            isEligibleForMembership: channel.isEligibleForMembership,
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
        };
        await this.ormRepository.save(ormEntity);
    }
    async update(channel) {
        await this.ormRepository.save({
            id: channel.id,
            userId: channel.userId,
            name: channel.name,
            bio: channel.bio,
            avatarUrl: channel.avatarUrl,
            bannerUrl: channel.bannerUrl,
            status: channel.status,
            isEligibleForMembership: channel.isEligibleForMembership,
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
        });
    }
    async delete(channel) {
        await this.ormRepository.update({ id: channel.id }, { status: channel_entity_1.ChannelStatus.INACTIVE, updatedAt: new Date() });
    }
    async findById(id) {
        const ormEntity = await this.ormRepository.findOne({ where: { id } });
        if (!ormEntity) {
            return null;
        }
        return new channel_entity_1.ChannelEntity({
            id: ormEntity.id,
            userId: ormEntity.userId,
            name: ormEntity.name,
            bio: ormEntity.bio,
            avatarUrl: ormEntity.avatarUrl,
            bannerUrl: ormEntity.bannerUrl,
            status: ormEntity.status,
            isEligibleForMembership: ormEntity.isEligibleForMembership,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
        });
    }
    async findByUserId(userId) {
        const ormEntity = await this.ormRepository.findOne({ where: { userId } });
        if (!ormEntity) {
            return null;
        }
        return new channel_entity_1.ChannelEntity({
            id: ormEntity.id,
            userId: ormEntity.userId,
            name: ormEntity.name,
            bio: ormEntity.bio,
            avatarUrl: ormEntity.avatarUrl,
            bannerUrl: ormEntity.bannerUrl,
            status: ormEntity.status,
            isEligibleForMembership: ormEntity.isEligibleForMembership,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
        });
    }
};
exports.ChannelRepositoryImpl = ChannelRepositoryImpl;
exports.ChannelRepositoryImpl = ChannelRepositoryImpl = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(channel_orm_entity_1.ChannelOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChannelRepositoryImpl);
//# sourceMappingURL=channel.repository.impl.js.map