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
import {
  EVENT_PROCESSED_TTL_SECONDS,
  EVENT_PROCESSING_LOCK_TTL_SECONDS,
} from '../constants/video-event.constants';

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
    const processedKey = this.getProcessedKey(command.eventId);
    const processingKey = this.getProcessingKey(command.eventId);
    if (await this.idempotencyStore.exists(processedKey)) {
      return;
    }

    const hasProcessingLock = await this.idempotencyStore.setIfNotExists(
      processingKey,
      '1',
      EVENT_PROCESSING_LOCK_TTL_SECONDS,
    );
    if (!hasProcessingLock) {
      return;
    }

    try {
      await this.processVideoProcessedSuccess(command);
      await this.markEventProcessed(processedKey);
      await this.idempotencyStore.delete(processingKey);
    } catch (error: unknown) {
      await this.releaseProcessingLock(processingKey);
      throw error;
    }
  }

  private async processVideoProcessedSuccess(
    command: HandleVideoProcessedSuccessCommand,
  ): Promise<void> {
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

    const processedResolutions = command.data.resolution ?? [];
    const processingWarnings = this.buildProcessingWarnings({
      requestedResolutions: video.resolutions,
      processedResolutions,
      skippedResolutions: command.data.skippedResolutions ?? [],
    });

    video.markReady({
      masterPlaylistKey: command.data.masterPlaylistKey,
      durationSeconds: command.data.durationSeconds ?? null,
      thumbnailUrl: command.data.thumbnailUrl ?? null,
      resolutions: processedResolutions,
      processingWarnings,
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

  private async markEventProcessed(processedKey: string): Promise<void> {
    await this.idempotencyStore.setIfNotExists(
      processedKey,
      '1',
      EVENT_PROCESSED_TTL_SECONDS,
    );
  }

  private async releaseProcessingLock(processingKey: string): Promise<void> {
    try {
      await this.idempotencyStore.delete(processingKey);
    } catch (error: unknown) {
      this.loggerService.logWarn('Failed to release processed success lock', {
        processingKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private getProcessedKey(eventId: string): string {
    return `media:event:${eventId}`;
  }

  private getProcessingKey(eventId: string): string {
    return `media:event:processing:${eventId}`;
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
      processingWarnings: video.processingWarnings,
      updatedAt: video.updatedAt.toISOString(),
      ...jobFields,
    });
  }

  private buildProcessingWarnings(input: {
    requestedResolutions: string[];
    processedResolutions: string[];
    skippedResolutions: Array<{ resolution: string; reason?: string }>;
  }): string[] {
    const processedSet = new Set(input.processedResolutions);
    const explicitSkippedResolutions = input.skippedResolutions.map(
      (item) => item.resolution,
    );
    const explicitSkippedSet = new Set(explicitSkippedResolutions);
    const inferredSkippedResolutions = input.requestedResolutions.filter(
      (resolution) =>
        !processedSet.has(resolution) && !explicitSkippedSet.has(resolution),
    );

    return [
      ...input.skippedResolutions.map((item) =>
        this.formatSkippedResolutionWarning(item.resolution, item.reason),
      ),
      ...inferredSkippedResolutions.map((resolution) =>
        this.formatSkippedResolutionWarning(resolution),
      ),
    ];
  }

  private formatSkippedResolutionWarning(
    resolution: string,
    reason?: string,
  ): string {
    const normalizedReason = reason?.trim();
    if (normalizedReason) {
      return `Skipped ${resolution}: ${normalizedReason}`;
    }

    return `Skipped ${resolution} because it is not available for the uploaded source video.`;
  }
}
