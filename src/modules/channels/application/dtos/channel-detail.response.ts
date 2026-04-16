import type { PublicChannelVideoSummary } from '../../../videos/application/interfaces/video-query.service.interface';
import type { ChannelResponse } from './channel.response';
import type { MembershipTierResponse } from './membership-tier.response';

export interface ChannelDetailResponse {
  channel: ChannelResponse;
  membershipTiers: MembershipTierResponse[];
  publicVideos: PublicChannelVideoSummary[];
}
