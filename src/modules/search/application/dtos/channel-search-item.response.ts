export interface ChannelSearchItemResponse {
  id: string;
  userId: string;
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  status: string;
  isEligibleForMembership: boolean;
  createdAt: Date;
  updatedAt: Date;
}
