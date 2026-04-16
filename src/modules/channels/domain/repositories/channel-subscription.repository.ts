import { ChannelSubscriptionEntity } from '../entities/channel-subscription.entity';

export const CHANNEL_SUBSCRIPTION_REPOSITORY = Symbol(
  'CHANNEL_SUBSCRIPTION_REPOSITORY',
);

export interface IChannelSubscriptionRepository {
  create(subscription: ChannelSubscriptionEntity): Promise<void>;
  update(subscription: ChannelSubscriptionEntity): Promise<void>;
  findById(id: string): Promise<ChannelSubscriptionEntity | null>;
  findByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<ChannelSubscriptionEntity | null>;
  findByChannelId(channelId: string): Promise<ChannelSubscriptionEntity[]>;
  findByUserId(userId: string): Promise<ChannelSubscriptionEntity[]>;
  countByChannelId(channelId: string): Promise<number>;
  findByUserIdAndChannelIdActive(
    userId: string,
    channelId: string,
  ): Promise<ChannelSubscriptionEntity | null>;
  upsert(subscription: ChannelSubscriptionEntity): Promise<void>;
}
