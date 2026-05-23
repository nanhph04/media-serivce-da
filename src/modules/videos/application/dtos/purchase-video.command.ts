export interface PurchaseVideoCommand {
  userId: string;
  videoId: string;
  traceId?: string;
}
