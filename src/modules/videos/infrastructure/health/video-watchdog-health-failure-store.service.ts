import { Injectable } from '@nestjs/common';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import type { IVideoWatchdogHealthFailureStore } from '../../application/interfaces/video-watchdog-health-failure-store.interface';
import type { VideoWorkerPipeline } from '../../application/interfaces/video-worker-health-checker.interface';

@Injectable()
export class VideoWatchdogHealthFailureStore implements IVideoWatchdogHealthFailureStore {
  constructor(private readonly cacheService: CacheService) {}

  async increment(
    pipeline: VideoWorkerPipeline,
    ttlSeconds: number,
  ): Promise<number> {
    return this.cacheService.increment(this.getKey(pipeline), ttlSeconds);
  }

  async reset(pipeline: VideoWorkerPipeline): Promise<void> {
    await this.cacheService.delete(this.getKey(pipeline));
  }

  private getKey(pipeline: VideoWorkerPipeline): string {
    return `media:watchdog:health-failures:${pipeline}`;
  }
}
