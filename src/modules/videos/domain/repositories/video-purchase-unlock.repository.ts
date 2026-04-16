import type { VideoPurchaseUnlockEntity } from '../entities/video-purchase-unlock.entity';

export const VIDEO_PURCHASE_UNLOCK_REPOSITORY = Symbol(
  'VIDEO_PURCHASE_UNLOCK_REPOSITORY',
);

export interface IVideoPurchaseUnlockRepository {
  save(unlock: VideoPurchaseUnlockEntity): Promise<void>;
  exists(videoId: string, userId: string): Promise<boolean>;
}
