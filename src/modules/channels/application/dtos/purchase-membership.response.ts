import type { ChannelMembershipResponse } from './channel-membership.response';

export interface PurchaseMembershipResponse {
  membership: ChannelMembershipResponse;
  chargedCoinAmount: number;
  paymentTransactionId: string | null;
}
