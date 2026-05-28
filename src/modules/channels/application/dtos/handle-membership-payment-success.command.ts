export interface HandleMembershipPaymentSuccessCommand {
  eventId: string;
  data: {
    userId: string;
    channelId: string;
    membershipTierId: string;
    paymentType?: 'new' | 'renew' | 'upgrade';
    chargedCoinAmount?: number | null;
    ledgerReferenceId?: string | null;
    membershipRecordId?: string;
    currentExpiryDate?: string;
    expiryDate?: string | null;
  };
}
