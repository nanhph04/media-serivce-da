export interface MembershipReviewResponse {
  channelId: string;
  userId: string;
  name: string;
  status: string;
  isEligibleForMembership: boolean;
  isMembershipClosedByAdmin: boolean;
  membershipReviewStatus: string;
  membershipRejectionReason: string | null;
  membershipRequestedAt: Date | null;
  membershipReviewedAt: Date | null;
  readyVideoCount: number;
  minReadyVideoCount: number;
  totalVideoViews: number;
  minTotalVideoViews: number;
}
