import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
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
import {
  VIDEO_STATUS_EVENT_PUBLISHER,
  type IVideoStatusEventPublisher,
} from '../interfaces/video-status-event-publisher.interface';
import { mapVideoStatusToJobFields } from '../dtos/video-job-status';
import type { VideoEntity } from '../../domain/entities/video.entity';

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
    @Inject(VIDEO_STATUS_EVENT_PUBLISHER)
    private readonly videoStatusEventPublisher: IVideoStatusEventPublisher,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
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
      url: this.objectStorageService.createObjectUrl(
        'public',
        command.data.thumbnailObjectKey,
      ),
    });

    if (video.thumbnailUrl === previousThumbnailUrl) {
      return;
    }

    await this.videoRepository.save(video);
    this.publishVideoStatusChanged(video);
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

  private publishVideoStatusChanged(video: VideoEntity): void {
    const jobFields = mapVideoStatusToJobFields({
      status: video.status,
      errorMessage: video.errorMessage,
      moderationDetails: video.moderationDetails,
    });

    this.videoStatusEventPublisher.publishVideoStatusChanged({
      videoId: video.id,
      userId: video.ownerId,
      status: video.status,
      thumbnailStatus: video.thumbnailStatus,
      thumbnailUrl: video.thumbnailUrl,
      updatedAt: video.updatedAt.toISOString(),
      ...jobFields,
    });
  }
}
