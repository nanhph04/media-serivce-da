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
exports.ChannelSubscriptionRepositoryImpl = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const channel_subscription_entity_1 = require("../../domain/entities/channel-subscription.entity");
const channel_subscription_orm_entity_1 = require("../persistence/channel-subscription.orm-entity");
const channel_subscription_mapper_1 = require("../mappers/channel-subscription.mapper");
let ChannelSubscriptionRepositoryImpl = class ChannelSubscriptionRepositoryImpl {
    ormRepository;
    mapper;
    constructor(ormRepository, mapper) {
        this.ormRepository = ormRepository;
        this.mapper = mapper;
    }
    async create(subscription) {
        const ormEntity = this.mapper.toOrm(subscription);
        await this.ormRepository.save(ormEntity);
    }
    async update(subscription) {
        const ormEntity = await this.ormRepository.findOne({
            where: { id: subscription.id },
        });
        if (!ormEntity) {
            throw new Error('Subscription not found');
        }
        const updatedEntity = this.mapper.toOrm(subscription, ormEntity);
        await this.ormRepository.save(updatedEntity);
    }
    async upsert(subscription) {
        const existing = await this.ormRepository.findOne({
            where: {
                userId: subscription.userId,
                channelId: subscription.channelId,
            },
        });
        if (!existing) {
            await this.create(subscription);
            return;
        }
        const updated = this.mapper.toOrm(subscription, existing);
        updated.id = existing.id;
        await this.ormRepository.save(updated);
    }
    async findById(id) {
        const ormEntity = await this.ormRepository.findOne({
            where: { id },
        });
        if (!ormEntity) {
            return null;
        }
        return this.mapper.toDomain(ormEntity);
    }
    async findByUserIdAndChannelId(userId, channelId) {
        const ormEntity = await this.ormRepository.findOne({
            where: { userId, channelId },
        });
        if (!ormEntity) {
            return null;
        }
        return this.mapper.toDomain(ormEntity);
    }
    async findByChannelId(channelId) {
        const ormEntities = await this.ormRepository.find({
            where: { channelId },
        });
        return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
    }
    async findByUserId(userId) {
        const ormEntities = await this.ormRepository.find({
            where: { userId },
        });
        return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
    }
    async countByChannelId(channelId) {
        return this.ormRepository.count({
            where: { channelId, status: (0, typeorm_2.Equal)(channel_subscription_entity_1.SubscriptionStatus.ACTIVE) },
        });
    }
    async findByUserIdAndChannelIdActive(userId, channelId) {
        const ormEntity = await this.ormRepository.findOne({
            where: { userId, channelId, status: channel_subscription_entity_1.SubscriptionStatus.ACTIVE },
        });
        if (!ormEntity) {
            return null;
        }
        const domain = this.mapper.toDomain(ormEntity);
        return domain.isCurrentlyActive() ? domain : null;
    }
};
exports.ChannelSubscriptionRepositoryImpl = ChannelSubscriptionRepositoryImpl;
exports.ChannelSubscriptionRepositoryImpl = ChannelSubscriptionRepositoryImpl = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(channel_subscription_orm_entity_1.ChannelSubscriptionOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        channel_subscription_mapper_1.ChannelSubscriptionMapper])
], ChannelSubscriptionRepositoryImpl);
//# sourceMappingURL=channel-subscription.repository.impl.js.map