import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import {
  VIDEO_PROCESSING_JOB_DISPATCHER,
  type IVideoProcessingJobDispatcher,
} from '@shared/application/interfaces/video-processing-job-dispatcher.interface';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';
import type { HandleVideoModerationCompletedCommand } from '../dtos/handle-video-moderation-completed.command';
import type { VideoModerationOutcomeEventData } from '../dtos/video-moderation-outcome.event-data';
import {
  VIDEO_MODERATION_OUTCOME_PUBLISHER,
  type IVideoModerationOutcomePublisher,
} from '../interfaces/video-moderation-outcome-publisher.interface';

@Injectable()
export class HandleVideoModerationCompletedUseCase extends BaseUseCase<
  HandleVideoModerationCompletedCommand,
  void
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_PROCESSING_JOB_DISPATCHER)
    private readonly videoProcessingJobDispatcher: IVideoProcessingJobDispatcher,
    @Inject(VIDEO_MODERATION_OUTCOME_PUBLISHER)
    private readonly moderationOutcomePublisher: IVideoModerationOutcomePublisher,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    private readonly loggerService: LoggerService,
  ) {
    super();
    this.loggerService.setContext(HandleVideoModerationCompletedUseCase.name);
  }

  async execute(command: HandleVideoModerationCompletedCommand): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const video = await this.videoRepository.findById(command.data.videoId);
    if (!video) {
      return;
    }

    if (command.data.status === 'SAFE') {
      video.markProcessing();
      await this.videoRepository.save(video);
      await this.videoProcessingJobDispatcher.enqueueTranscodeJob({
        videoId: command.data.videoId,
        rawFileKey: command.data.rawFileKey,
        resolution: command.data.resolutions,
        userId: command.data.userId,
      });
      await this.publishOutcome({
        videoId: command.data.videoId,
        moderationStatus: command.data.status,
        videoStatus: VideoStatus.PROCESSING,
        outcome: 'QUEUED_FOR_PROCESSING',
        reason: command.data.reason,
        confidence: command.data.confidence,
        evidenceTimestampSeconds: command.data.evidenceTimestampSeconds,
        transcodeQueued: true,
      });
      return;
    }

    if (command.data.status === 'PENDING_MANUAL_REVIEW') {
      video.markPendingManualReview(command.data.reason);
      await this.videoRepository.save(video);
      await this.publishOutcome({
        videoId: command.data.videoId,
        moderationStatus: command.data.status,
        videoStatus: VideoStatus.PENDING_MANUAL_REVIEW,
        outcome: 'PENDING_MANUAL_REVIEW',
        reason: command.data.reason,
        confidence: command.data.confidence,
        evidenceTimestampSeconds: command.data.evidenceTimestampSeconds,
        transcodeQueued: false,
      });
      return;
    }

    if (command.data.status === 'REJECTED') {
      video.markRejected(command.data.reason);
      await this.videoRepository.save(video);
      await this.publishOutcome({
        videoId: command.data.videoId,
        moderationStatus: command.data.status,
        videoStatus: VideoStatus.REJECTED,
        outcome: 'REJECTED',
        reason: command.data.reason,
        confidence: command.data.confidence,
        evidenceTimestampSeconds: command.data.evidenceTimestampSeconds,
        transcodeQueued: false,
      });
      return;
    }

    video.markFailed(command.data.reason);
    await this.videoRepository.save(video);
    await this.publishOutcome({
      videoId: command.data.videoId,
      moderationStatus: command.data.status,
      videoStatus: VideoStatus.FAILED,
      outcome: 'FAILED',
      reason: command.data.reason,
      confidence: command.data.confidence,
      evidenceTimestampSeconds: command.data.evidenceTimestampSeconds,
      transcodeQueued: false,
    });
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }

  private async publishOutcome(
    outcome: VideoModerationOutcomeEventData,
  ): Promise<void> {
    this.loggerService.logInfo('Video moderation outcome resolved', {
      ...outcome,
    });
    await this.moderationOutcomePublisher.publishModerationOutcome(outcome);
  }
}
