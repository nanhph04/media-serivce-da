export interface HandleMembershipAutoRenewFailedCommand {
  eventId: string;
  data: {
    sourceEventId?: string;
    membershipRecordId: string;
    userId: string;
    channelId: string;
    membershipTierId: string;
    reasonCode: string;
    retryable: boolean;
    idempotencyKey: string;
  };
}
