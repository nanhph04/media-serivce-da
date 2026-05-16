export const MEMBERSHIP_AUTO_RENEW_PUBLISHER = Symbol(
  'MEMBERSHIP_AUTO_RENEW_PUBLISHER',
);

export interface MembershipRenewalReminderRequest {
  membershipRecordId: string;
  userId: string;
  channelId: string;
  channelName: string;
  membershipTierId: string;
  tierName: string;
  coinAmount: number;
  renewalDate: string;
}

export interface MembershipAutoRenewRequest {
  membershipRecordId: string;
  userId: string;
  channelId: string;
  channelOwnerId: string;
  membershipTierId: string;
  coinAmount: number;
  currentExpiryDate: string;
  paymentType: 'renew';
  idempotencyKey: string;
}

export interface IMembershipAutoRenewPublisher {
  publishReminderRequested(
    request: MembershipRenewalReminderRequest,
  ): Promise<void>;
  publishRenewalRequested(request: MembershipAutoRenewRequest): Promise<void>;
}
