export interface VideoDeleteRequestedEventData {
  videoId: string;
  channelId: string;
  ownerId: string;
  deletedBy: string;
  deletedAt: string;
  refundWindowHours: number;
}

export interface VideoDeleteRefundCompletedEventData {
  videoId: string;
  requestedEventId: string;
  refundedPurchaseCount: number;
  skippedPurchaseCount: number;
  completedAt: string;
}
