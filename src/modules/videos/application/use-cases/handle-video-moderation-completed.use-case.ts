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
import { VideoProgressService } from '../services/video-progress.service';

const EVENT_PROCESSED_TTL_SECONDS = 60 * 60 * 24;
const EVENT_PROCESSING_LOCK_TTL_SECONDS = 300;

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
    private readonly videoProgressService: VideoProgressService,
  ) {
    super();
    this.loggerService.setContext(HandleVideoModerationCompletedUseCase.name);
  }

  async execute(command: HandleVideoModerationCompletedCommand): Promise<void> {
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

    let shouldReleaseProcessingLock = true;
    try {
      await this.processModerationResult(command);
      shouldReleaseProcessingLock = false;
      await this.markEventProcessed(processedKey);
      await this.idempotencyStore.delete(processingKey);
    } catch (error: unknown) {
      if (shouldReleaseProcessingLock) {
        await this.releaseProcessingLock(processingKey);
      }
      throw error;
    }
  }

  private async processModerationResult(
    command: HandleVideoModerationCompletedCommand,
  ): Promise<void> {
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
      await this.videoProgressService.applyProgressUpdate(
        this.videoProgressService.createSnapshot({
          videoId: command.data.videoId,
          stage: 'processing',
          percent: 5,
          message: 'Video queued for processing',
          terminal: false,
        }),
      );
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
      await this.videoProgressService.applyProgressUpdate(
        this.videoProgressService.createSnapshot({
          videoId: command.data.videoId,
          stage: 'pending_manual_review',
          percent: 100,
          message: command.data.reason || 'Video requires manual review',
          terminal: true,
        }),
      );
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
      await this.videoProgressService.applyProgressUpdate(
        this.videoProgressService.createSnapshot({
          videoId: command.data.videoId,
          stage: 'rejected',
          percent: 100,
          message: command.data.reason || 'Video rejected by moderation',
          terminal: true,
        }),
      );
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
    await this.videoProgressService.applyProgressUpdate(
      this.videoProgressService.createSnapshot({
        videoId: command.data.videoId,
        stage: 'failed',
        percent: 100,
        message: command.data.reason || 'Video moderation failed',
        terminal: true,
      }),
    );
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
      this.loggerService.logWarn('Failed to release moderation event lock', {
        processingKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private getProcessedKey(eventId: string): string {
    return `media:event:processed:${eventId}`;
  }

  private getProcessingKey(eventId: string): string {
    return `media:event:processing:${eventId}`;
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
