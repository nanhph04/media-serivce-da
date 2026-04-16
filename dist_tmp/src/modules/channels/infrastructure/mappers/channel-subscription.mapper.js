"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSubscriptionMapper = void 0;
const channel_subscription_entity_1 = require("../../domain/entities/channel-subscription.entity");
const channel_subscription_orm_entity_1 = require("../persistence/channel-subscription.orm-entity");
class ChannelSubscriptionMapper {
    toDomain(ormEntity) {
        const props = {
            id: ormEntity.id,
            userId: ormEntity.userId,
            channelId: ormEntity.channelId,
            membershipId: ormEntity.membershipId,
            expiryDate: ormEntity.expiryDate,
            retryCount: ormEntity.retryCount,
            status: ormEntity.status,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
        };
        return new channel_subscription_entity_1.ChannelSubscriptionEntity(props);
    }
    toOrm(domainEntity, existing) {
        if (existing) {
            existing.id = domainEntity.id;
            existing.userId = domainEntity.userId;
            existing.channelId = domainEntity.channelId;
            existing.membershipId = domainEntity.membershipId;
            existing.expiryDate = domainEntity.expiryDate;
            existing.retryCount = domainEntity.retryCount;
            existing.status = domainEntity.status;
            existing.updatedAt = domainEntity.updatedAt;
            return existing;
        }
        const ormEntity = new channel_subscription_orm_entity_1.ChannelSubscriptionOrmEntity();
        ormEntity.id = domainEntity.id;
        ormEntity.userId = domainEntity.userId;
        ormEntity.channelId = domainEntity.channelId;
        ormEntity.membershipId = domainEntity.membershipId;
        ormEntity.expiryDate = domainEntity.expiryDate;
        ormEntity.retryCount = domainEntity.retryCount;
        ormEntity.status = domainEntity.status;
        ormEntity.createdAt = domainEntity.createdAt;
        ormEntity.updatedAt = domainEntity.updatedAt;
        return ormEntity;
    }
}
exports.ChannelSubscriptionMapper = ChannelSubscriptionMapper;
//# sourceMappingURL=channel-subscription.mapper.js.map