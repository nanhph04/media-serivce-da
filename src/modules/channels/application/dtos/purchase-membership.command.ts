export interface PurchaseMembershipCommand {
  userId: string;
  channelId: string;
  tierId: string;
  traceId?: string;
}
