export interface HandleMembershipAutoRenewFailedCommand {
  eventId: string;
  data: {
    membershipRecordId: string;
    userId: string;
    channelId: string;
    membershipTierId: string;
    reasonCode: string;
    retryable: boolean;
    idempotencyKey: string;
  };
}
