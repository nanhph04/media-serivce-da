export interface ChannelResponse {
  id: string;
  userId: string;
  name: string;
  bio: string;
  isEligibleForMembership: boolean;
  isMembershipClosedByAdmin: boolean;
  membershipReviewStatus: string;
  membershipRejectionReason: string | null;
  membershipRequestedAt: Date | null;
  membershipReviewedAt: Date | null;
  avatarUrl: string;
  bannerUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
