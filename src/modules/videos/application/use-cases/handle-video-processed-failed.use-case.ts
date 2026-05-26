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
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

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
      processingWarnings: video.processingWarnings,
      updatedAt: video.updatedAt.toISOString(),
      ...jobFields,
    });
  }
}
