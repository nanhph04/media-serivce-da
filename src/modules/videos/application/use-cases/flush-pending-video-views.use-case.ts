import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoViewAggregation,
  VIDEO_VIEW_AGGREGATION,
} from '../interfaces/video-view-aggregation.interface';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class FlushPendingVideoViewsUseCase {
  constructor(
    @Inject(VIDEO_VIEW_AGGREGATION)
    private readonly videoViewAggregation: IVideoViewAggregation,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(FlushPendingVideoViewsUseCase.name);
  }

  async execute(): Promise<void> {
    const dirtyVideoIds = await this.videoViewAggregation.getDirtyVideoIds();

    for (const videoId of dirtyVideoIds) {
      const delta = await this.videoViewAggregation.claimPendingViewDelta(
        videoId,
      );

      if (delta === null) {
        continue;
      }

      try {
        await this.videoRepository.incrementViewCountBy(videoId, delta);
        await this.videoCacheInvalidator.invalidateMetadata(videoId);
        await this.videoViewAggregation.completeFlush(videoId);
      } catch (error: unknown) {
        await this.videoViewAggregation.restoreInflightViewDelta(videoId);
        this.logger.logError('Failed to flush pending video views', error, {
          videoId,
          delta,
        });
      }
    }
  }
}
