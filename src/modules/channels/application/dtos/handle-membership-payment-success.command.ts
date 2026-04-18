export interface HandleMembershipPaymentSuccessCommand {
  eventId: string;
  data: {
    userId: string;
    channelId: string;
    membershipTierId: string;
    expiryDate?: string | null;
  };
}
