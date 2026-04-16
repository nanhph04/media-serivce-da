import {
  ChannelSubscriptionEntity,
  SubscriptionStatus,
  ChannelSubscriptionProps,
} from '../../domain/entities/channel-subscription.entity';
import { ChannelSubscriptionOrmEntity } from '../persistence/channel-subscription.orm-entity';

export class ChannelSubscriptionMapper {
  toDomain(ormEntity: ChannelSubscriptionOrmEntity): ChannelSubscriptionEntity {
    const props: ChannelSubscriptionProps = {
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
    return new ChannelSubscriptionEntity(props);
  }

  toOrm(
    domainEntity: ChannelSubscriptionEntity,
    existing?: ChannelSubscriptionOrmEntity,
  ): ChannelSubscriptionOrmEntity {
    if (existing) {
      existing.id = domainEntity.id;
      existing.userId = domainEntity.userId;
      existing.channelId = domainEntity.channelId;
      existing.membershipId = domainEntity.membershipId;
      existing.expiryDate = domainEntity.expiryDate;
      existing.retryCount = domainEntity.retryCount;
      existing.status = domainEntity.status as unknown as SubscriptionStatus;
      existing.updatedAt = domainEntity.updatedAt;
      return existing;
    }

    const ormEntity = new ChannelSubscriptionOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.userId = domainEntity.userId;
    ormEntity.channelId = domainEntity.channelId;
    ormEntity.membershipId = domainEntity.membershipId;
    ormEntity.expiryDate = domainEntity.expiryDate;
    ormEntity.retryCount = domainEntity.retryCount;
    ormEntity.status = domainEntity.status as unknown as SubscriptionStatus;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
