import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import type { HandleVideoThumbnailGeneratedCommand } from '../dtos/handle-video-thumbnail-generated.command';

@Injectable()
export class HandleVideoThumbnailGeneratedUseCase extends BaseUseCase<
  HandleVideoThumbnailGeneratedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(HandleVideoThumbnailGeneratedUseCase.name);
  }

  async execute(command: HandleVideoThumbnailGeneratedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      this.loggerService.logWarn('Ignoring thumbnail generated for missing video', {
        eventId: command.eventId,
        videoId: command.data.videoId,
      });
      return;
    }

    const previousThumbnailUrl = video.thumbnailUrl;
    video.markAutoThumbnailReady({
      objectKey: command.data.thumbnailObjectKey,
      url: command.data.thumbnailUrl,
    });

    if (video.thumbnailUrl === previousThumbnailUrl) {
      return;
    }

    await this.videoRepository.save(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);
    await this.videoCacheInvalidator.invalidateDiscoveryLists();
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
