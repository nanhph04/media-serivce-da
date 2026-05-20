import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
  type IChannelMembershipEligibilityService,
} from '../../../channels/application/interfaces/channel-membership-eligibility.service.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';
import type { HandleVideoProcessedSuccessCommand } from '../dtos/handle-video-processed-success.command';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';
import {
  VIDEO_STATUS_EVENT_PUBLISHER,
  type IVideoStatusEventPublisher,
} from '../interfaces/video-status-event-publisher.interface';
import { mapVideoStatusToJobFields } from '../dtos/video-job-status';
import type { VideoEntity } from '../../domain/entities/video.entity';

@Injectable()
export class HandleVideoProcessedSuccessUseCase extends BaseUseCase<
  HandleVideoProcessedSuccessCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly loggerService: LoggerService,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
    @Inject(VIDEO_STATUS_EVENT_PUBLISHER)
    private readonly videoStatusEventPublisher: IVideoStatusEventPublisher,
  ) {
    super();
    this.loggerService.setContext(HandleVideoProcessedSuccessUseCase.name);
  }

  async execute(command: HandleVideoProcessedSuccessCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    if (video.status !== VideoStatus.PROCESSING) {
      this.loggerService.logWarn(
        'Ignoring stale video processed success event',
        {
          eventId: command.eventId,
          videoId: command.data.videoId,
          currentStatus: video.status,
        },
      );
      return;
    }

    video.markReady({
      masterPlaylistKey: command.data.masterPlaylistKey,
      durationSeconds: command.data.durationSeconds ?? null,
      thumbnailUrl: command.data.thumbnailUrl ?? null,
      resolutions: command.data.resolution ?? [],
    });

    await this.videoRepository.save(video);
    this.publishVideoStatusChanged(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);
    await this.videoCacheInvalidator.invalidateDiscoveryLists();
    await this.channelMembershipEligibilityService.syncChannelEligibility(
      video.channelId,
    );
    await this.deleteRawFileIfPresent(video.id, video.rawFileKey);
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }

  private async deleteRawFileIfPresent(
    videoId: string,
    rawFileKey: string,
  ): Promise<void> {
    try {
      if (await this.objectStorageService.objectExists('raw', rawFileKey)) {
        await this.objectStorageService.deleteObject('raw', rawFileKey);
      }
    } catch (error: unknown) {
      this.loggerService.logWarn(
        'Failed to delete processed video raw object',
        {
          videoId,
          rawFileKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
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
