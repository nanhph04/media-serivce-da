import { Injectable } from '@nestjs/common';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import type {
  IVideoCacheInvalidator,
} from '../../application/interfaces/video-cache-invalidator.interface';
import { VIDEO_CACHE_KEYS } from '../cache.constants';

@Injectable()
export class VideoCacheInvalidator implements IVideoCacheInvalidator {
  constructor(private readonly cacheService: CacheService) {}

  async invalidateMetadata(videoId: string): Promise<void> {
    try {
      await this.cacheService.del(VIDEO_CACHE_KEYS.metadata(videoId));
    } catch {
      // Cache invalidation failure must not fail writes.
    }
  }

  async invalidateDiscoveryLists(): Promise<void> {
    try {
      await Promise.all([
        this.cacheService.increment(VIDEO_CACHE_KEYS.latestVersion()),
        this.cacheService.increment(VIDEO_CACHE_KEYS.categoryLatestVersion()),
        this.cacheService.increment(VIDEO_CACHE_KEYS.publicSearchVersion()),
      ]);
    } catch {
      // Cache invalidation failure must not fail writes.
    }
  }
}
