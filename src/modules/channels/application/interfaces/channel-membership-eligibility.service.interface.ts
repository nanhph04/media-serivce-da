import type { ChannelMembershipEligibilityResponse } from '../dtos/channel-membership-eligibility.response';

export const CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE = Symbol(
  'CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE',
);

export interface IChannelMembershipEligibilityService {
  getChannelEligibility(
    channelId: string,
  ): Promise<ChannelMembershipEligibilityResponse>;
  syncChannelEligibility(
    channelId: string,
  ): Promise<ChannelMembershipEligibilityResponse>;
}
