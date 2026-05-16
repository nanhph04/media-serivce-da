import type { ChannelMembershipEntity } from '../entities/channel-membership.entity';

export const CHANNEL_MEMBERSHIP_REPOSITORY = Symbol(
  'CHANNEL_MEMBERSHIP_REPOSITORY',
);

export interface IChannelMembershipRepository {
  create(membership: ChannelMembershipEntity): Promise<void>;
  update(membership: ChannelMembershipEntity): Promise<void>;
  findById(id: string): Promise<ChannelMembershipEntity | null>;
  findByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null>;
  findByChannelId(channelId: string): Promise<ChannelMembershipEntity[]>;
  findByUserId(userId: string): Promise<ChannelMembershipEntity[]>;
  countByChannelId(channelId: string): Promise<number>;
  findByUserIdAndChannelIdActive(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null>;
  findDueRenewalReminders(input: {
    now: Date;
    reminderBefore: Date;
    limit: number;
  }): Promise<ChannelMembershipEntity[]>;
  findDueRenewals(input: {
    now: Date;
    limit: number;
  }): Promise<ChannelMembershipEntity[]>;
  upsert(membership: ChannelMembershipEntity): Promise<void>;
}
