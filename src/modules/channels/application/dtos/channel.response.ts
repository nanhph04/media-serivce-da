export interface ChannelResponse {
  id: string;
  userId: string;
  name: string;
  bio: string;
  isEligibleForMembership: boolean;
  isMembershipClosedByAdmin: boolean;
  avatarUrl: string;
  bannerUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
