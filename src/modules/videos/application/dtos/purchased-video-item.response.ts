export type PurchasedVideoAccessStatus = 'ACTIVE';

export interface PurchasedVideoItemResponse {
  videoId: string;
  channelId: string;
  channelName: string | null;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  categories: string[];
  tags: string[];
  priceCoin: number;
  purchasedAt: Date;
  publishedAt: Date | null;
  viewCount: number;
  accessStatus: PurchasedVideoAccessStatus;
}
