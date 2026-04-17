export interface ChannelMembershipResponseDto {
  id: string;
  userId: string;
  channelId: string;
  membershipId: string;
  expiryDate: string | null;
  retryCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
