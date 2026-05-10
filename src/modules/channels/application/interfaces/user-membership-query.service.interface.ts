import { ChannelMembershipStatus } from '../../domain/entities/channel-membership.entity';

export const USER_MEMBERSHIP_QUERY_SERVICE = Symbol(
  'USER_MEMBERSHIP_QUERY_SERVICE',
);

export interface UserMembershipQuery {
  userId: string;
  page: number;
  limit: number;
}

export interface UserMembershipQueryItem {
  membershipId: string;
  channelId: string;
  channelName: string;
  channelAvatarUrl: string | null;
  tierId: string;
  tierName: string;
  tierLevel: number;
  priceCoin: number;
  startedAt: Date;
  expiryDate: Date | null;
  status: ChannelMembershipStatus;
  isMembershipClosedByAdmin: boolean;
}

export interface UserMembershipQueryResult {
  items: UserMembershipQueryItem[];
  total: number;
}

export interface IUserMembershipQueryService {
  getMembershipsByUserId(
    query: UserMembershipQuery,
  ): Promise<UserMembershipQueryResult>;
}
