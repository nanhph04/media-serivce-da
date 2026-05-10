import type { VideoPurchaseUnlockEntity } from '../entities/video-purchase-unlock.entity';
import type { VideoEntity } from '../entities/video.entity';

export const VIDEO_PURCHASE_UNLOCK_REPOSITORY = Symbol(
  'VIDEO_PURCHASE_UNLOCK_REPOSITORY',
);

export interface PurchasedVideosPageFilters {
  userId: string;
  page: number;
  limit: number;
}

export interface PurchasedVideosPageResult {
  items: VideoEntity[];
  total: number;
}

export interface IVideoPurchaseUnlockRepository {
  save(unlock: VideoPurchaseUnlockEntity): Promise<void>;
  exists(videoId: string, userId: string): Promise<boolean>;
  findPurchasedByUserId(
    filters: PurchasedVideosPageFilters,
  ): Promise<PurchasedVideosPageResult>;
}
