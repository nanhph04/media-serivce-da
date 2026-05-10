export interface MyMembershipItemResponse {
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
  isActive: boolean;
  canRenew: boolean;
  canUpgrade: boolean;
  isMembershipClosedByAdmin: boolean;
  membershipBlockedReason: string | null;
}
