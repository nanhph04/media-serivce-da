export interface ChannelResponse {
  id: string;
  userId: string;
  name: string;
  bio: string;
  isEligibleForMembership: boolean;
  avatarUrl: string;
  bannerUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
