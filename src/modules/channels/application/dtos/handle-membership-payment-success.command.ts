export interface HandleMembershipPaymentSuccessCommand {
  eventId: string;
  data: {
    userId: string;
    channelId: string;
    membershipTierId: string;
    paymentType?: 'new' | 'renew' | 'upgrade';
    chargedCoinAmount?: number | null;
    ledgerReferenceId?: string | null;
    expiryDate?: string | null;
  };
}
