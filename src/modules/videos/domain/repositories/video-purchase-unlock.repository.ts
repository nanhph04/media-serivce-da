import type { VideoPurchaseUnlockEntity } from '../entities/video-purchase-unlock.entity';

export const VIDEO_PURCHASE_UNLOCK_REPOSITORY = Symbol(
  'VIDEO_PURCHASE_UNLOCK_REPOSITORY',
);

export interface PurchasedVideosPageFilters {
  userId: string;
  page: number;
  limit: number;
}

export type PurchasedVideoAccessStatus = 'ACTIVE';

export interface PurchasedVideoItemReadModel {
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

export interface PurchasedVideosPageResult {
  items: PurchasedVideoItemReadModel[];
  total: number;
}

export interface IVideoPurchaseUnlockRepository {
  save(unlock: VideoPurchaseUnlockEntity): Promise<void>;
  exists(videoId: string, userId: string): Promise<boolean>;
  findPurchasedByUserId(
    filters: PurchasedVideosPageFilters,
  ): Promise<PurchasedVideosPageResult>;
}
