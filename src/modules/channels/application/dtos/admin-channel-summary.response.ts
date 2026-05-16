export interface AdminChannelSummaryResponse {
  totalChannels: number;
  activeCreators30d: number;
  eligibleForMembership: number;
  membershipClosedByAdmin: number;
  membershipPendingReview: number;
  membershipApproved: number;
  membershipRejected: number;
  uploadingNow: number;
}
