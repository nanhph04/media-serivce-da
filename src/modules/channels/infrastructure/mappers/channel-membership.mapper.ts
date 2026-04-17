import {
  ChannelMembershipEntity,
  ChannelMembershipStatus,
  type ChannelMembershipProps,
} from '../../domain/entities/channel-membership.entity';
import { ChannelMembershipOrmEntity } from '../persistence/channel-membership.orm-entity';

export class ChannelMembershipMapper {
  toDomain(ormEntity: ChannelMembershipOrmEntity): ChannelMembershipEntity {
    const props: ChannelMembershipProps = {
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
    return new ChannelMembershipEntity(props);
  }

  toOrm(
    domainEntity: ChannelMembershipEntity,
    existing?: ChannelMembershipOrmEntity,
  ): ChannelMembershipOrmEntity {
    if (existing) {
      existing.id = domainEntity.id;
      existing.userId = domainEntity.userId;
      existing.channelId = domainEntity.channelId;
      existing.membershipId = domainEntity.membershipId;
      existing.expiryDate = domainEntity.expiryDate;
      existing.retryCount = domainEntity.retryCount;
      existing.status = domainEntity.status as ChannelMembershipStatus;
      existing.updatedAt = domainEntity.updatedAt;
      return existing;
    }

    const ormEntity = new ChannelMembershipOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.userId = domainEntity.userId;
    ormEntity.channelId = domainEntity.channelId;
    ormEntity.membershipId = domainEntity.membershipId;
    ormEntity.expiryDate = domainEntity.expiryDate;
    ormEntity.retryCount = domainEntity.retryCount;
    ormEntity.status = domainEntity.status as ChannelMembershipStatus;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
