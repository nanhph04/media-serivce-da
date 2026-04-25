import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import type { HandleVideoViewedCommand } from '../dtos/handle-video-viewed.command';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';

@Injectable()
export class HandleVideoViewedUseCase extends BaseUseCase<
  HandleVideoViewedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async execute(command: HandleVideoViewedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    await this.videoRepository.incrementViewCount(command.data.videoId);
    await this.videoCacheInvalidator.invalidateMetadata(command.data.videoId);
    await this.videoCacheInvalidator.invalidateDiscoveryLists();
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.cacheService.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
