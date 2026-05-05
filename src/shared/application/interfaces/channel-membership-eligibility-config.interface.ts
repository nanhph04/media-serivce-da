export const CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG = Symbol(
  'CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG',
);

export interface IChannelMembershipEligibilityConfig {
  getMinReadyVideosForMembership(): number;
  getMinTotalViewsForMembership(): number;
}
