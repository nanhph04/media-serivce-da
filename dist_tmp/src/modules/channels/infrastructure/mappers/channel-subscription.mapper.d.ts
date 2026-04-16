import { ChannelSubscriptionEntity } from '../../domain/entities/channel-subscription.entity';
import { ChannelSubscriptionOrmEntity } from '../persistence/channel-subscription.orm-entity';
export declare class ChannelSubscriptionMapper {
    toDomain(ormEntity: ChannelSubscriptionOrmEntity): ChannelSubscriptionEntity;
    toOrm(domainEntity: ChannelSubscriptionEntity, existing?: ChannelSubscriptionOrmEntity): ChannelSubscriptionOrmEntity;
}
