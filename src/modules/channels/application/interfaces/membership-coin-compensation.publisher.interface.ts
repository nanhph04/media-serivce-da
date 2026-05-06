export const MEMBERSHIP_COIN_COMPENSATION_PUBLISHER = Symbol(
  'MEMBERSHIP_COIN_COMPENSATION_PUBLISHER',
);

export const MEMBERSHIP_BLOCKED_REASON = {
  ADMIN_CLOSED: 'ADMIN_CLOSED',
  CHANNEL_INACTIVE: 'CHANNEL_INACTIVE',
  CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
  TIER_CLOSED: 'TIER_CLOSED',
  TIER_INVALID: 'TIER_INVALID',
} as const;

export type MembershipBlockedReason =
  (typeof MEMBERSHIP_BLOCKED_REASON)[keyof typeof MEMBERSHIP_BLOCKED_REASON];

export interface MembershipCoinCompensationRequest {
  sourcePaymentEventId: string;
  userId: string;
  channelId: string;
  membershipTierId: string;
  paymentType: 'new' | 'renew' | 'upgrade';
  chargedCoinAmount: number | null;
  ledgerReferenceId: string | null;
  reasonCode: MembershipBlockedReason;
}

export interface IMembershipCoinCompensationPublisher {
  publishCompensationRequest(
    request: MembershipCoinCompensationRequest,
  ): Promise<void>;
}
