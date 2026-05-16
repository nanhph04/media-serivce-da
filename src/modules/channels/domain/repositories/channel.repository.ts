import {
  ChannelEntity,
  MembershipReviewStatus,
} from '../entities/channel.entity';

export const CHANNEL_REPOSITORY = Symbol('CHANNEL_REPOSITORY');

export interface AdminChannelCounts {
  totalChannels: number;
  eligibleForMembership: number;
  membershipClosedByAdmin: number;
  membershipPendingReview: number;
  membershipApproved: number;
  membershipRejected: number;
}

export interface IChannelRepository {
  create(channel: ChannelEntity): Promise<void>;
  update(channel: ChannelEntity): Promise<void>;
  delete(channel: ChannelEntity): Promise<void>;
  findById(id: string): Promise<ChannelEntity | null>;
  findByUserId(userId: string): Promise<ChannelEntity | null>;
  findByMembershipReviewStatus(
    status: MembershipReviewStatus,
  ): Promise<ChannelEntity[]>;
  getAdminChannelCounts(): Promise<AdminChannelCounts>;
}
