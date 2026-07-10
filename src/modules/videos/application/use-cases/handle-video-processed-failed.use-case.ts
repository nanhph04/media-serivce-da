import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';
import type { HandleVideoProcessedFailedCommand } from '../dtos/handle-video-processed-failed.command';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
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
export class HandleVideoProcessedFailedUseCase extends BaseUseCase<
  HandleVideoProcessedFailedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    @Inject(VIDEO_STATUS_EVENT_PUBLISHER)
    private readonly videoStatusEventPublisher: IVideoStatusEventPublisher,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(HandleVideoProcessedFailedUseCase.name);
  }

  async execute(command: HandleVideoProcessedFailedCommand): Promise<void> {
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
      await this.processVideoProcessedFailed(command);
      await this.markEventProcessed(processedKey);
      await this.idempotencyStore.delete(processingKey);
    } catch (error: unknown) {
      await this.releaseProcessingLock(processingKey);
      throw error;
    }
  }

  private async processVideoProcessedFailed(
    command: HandleVideoProcessedFailedCommand,
  ): Promise<void> {
    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    if (video.status !== VideoStatus.PROCESSING) {
      this.loggerService.logWarn(
        'Ignoring stale video processed failed event',
        {
          eventId: command.eventId,
          videoId: command.data.videoId,
          currentStatus: video.status,
        },
      );
      return;
    }

    video.markFailed(command.data.errorMessage);
    await this.videoRepository.save(video);
    this.publishVideoStatusChanged(video);
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
      this.loggerService.logWarn('Failed to release processed failed lock', {
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
}
