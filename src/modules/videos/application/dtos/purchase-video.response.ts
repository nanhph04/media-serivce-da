export interface PurchaseVideoResponse {
  videoId: string;
  channelId: string;
  priceCoin: number;
  unlocked: boolean;
  paymentTransactionId: string | null;
}
