import { Inject, Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoProgressStore,
  VIDEO_PROGRESS_STORE,
} from '../interfaces/video-progress-store.interface';
import {
  type IVideoProgressStream,
  VIDEO_PROGRESS_STREAM,
} from '../interfaces/video-progress-stream.interface';
import type {
  VideoProgressSnapshot,
  VideoProgressStage,
} from '../dtos/video-progress.snapshot';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import { VideoStatus } from '../../domain/entities/video.entity';

@Injectable()
export class VideoProgressService {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_PROGRESS_STORE)
    private readonly videoProgressStore: IVideoProgressStore,
    @Inject(VIDEO_PROGRESS_STREAM)
    private readonly videoProgressStream: IVideoProgressStream,
    private readonly loggerService: LoggerService,
  ) {}

  async getSnapshotForOwner(
    videoId: string,
    userId: string,
  ): Promise<VideoProgressSnapshot> {
    const video = await this.videoRepository.findBasicById(videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    if (video.ownerId !== userId) {
      throw new ForbiddenException('You do not own this video');
    }

    const snapshot = await this.videoProgressStore.get(videoId);
    return snapshot ?? this.createSnapshotFromStatus(videoId, video.status);
  }

  async applyProgressUpdate(
    snapshot: VideoProgressSnapshot,
  ): Promise<VideoProgressSnapshot | null> {
    const accepted =
      await this.videoProgressStore.applyProgressUpdate(snapshot);
    if (accepted) {
      this.videoProgressStream.publish(accepted);
      this.loggerService.setContext(VideoProgressService.name);
      this.loggerService.logInfo('Published video progress snapshot to stream', {
        videoId: accepted.videoId,
        stage: accepted.stage,
        percent: accepted.percent,
        terminal: accepted.terminal,
        message: accepted.message,
      });
    } else {
      this.loggerService.setContext(VideoProgressService.name);
      this.loggerService.logWarn('Rejected stale video progress snapshot', {
        videoId: snapshot.videoId,
        stage: snapshot.stage,
        percent: snapshot.percent,
        terminal: snapshot.terminal,
        message: snapshot.message,
      });
    }
    return accepted;
  }

  createSnapshot(input: {
    videoId: string;
    stage: VideoProgressStage;
    percent: number;
    message: string;
    terminal: boolean;
    detail?: Record<string, unknown> | null;
    errorCode?: string | null;
  }): VideoProgressSnapshot {
    return {
      videoId: input.videoId,
      stage: input.stage,
      percent: input.percent,
      message: input.message,
      terminal: input.terminal,
      updatedAt: new Date().toISOString(),
      detail: input.detail ?? null,
      errorCode: input.errorCode ?? null,
    };
  }

  private createSnapshotFromStatus(
    videoId: string,
    status: VideoStatus,
  ): VideoProgressSnapshot {
    switch (status) {
      case VideoStatus.DRAFT:
        return this.createSnapshot({
          videoId,
          stage: 'pending_moderation',
          percent: 0,
          message: 'Upload initialized',
          terminal: false,
        });
      case VideoStatus.PENDING_MODERATION:
        return this.createSnapshot({
          videoId,
          stage: 'pending_moderation',
          percent: 10,
          message: 'Video queued for moderation',
          terminal: false,
        });
      case VideoStatus.PROCESSING:
        return this.createSnapshot({
          videoId,
          stage: 'processing',
          percent: 5,
          message: 'Video queued for processing',
          terminal: false,
        });
      case VideoStatus.PENDING_MANUAL_REVIEW:
        return this.createSnapshot({
          videoId,
          stage: 'pending_manual_review',
          percent: 100,
          message: 'Video requires manual review',
          terminal: true,
        });
      case VideoStatus.REJECTED:
        return this.createSnapshot({
          videoId,
          stage: 'rejected',
          percent: 100,
          message: 'Video rejected by moderation',
          terminal: true,
        });
      case VideoStatus.READY:
        return this.createSnapshot({
          videoId,
          stage: 'ready',
          percent: 100,
          message: 'Video processing completed',
          terminal: true,
        });
      case VideoStatus.FAILED:
      default:
        return this.createSnapshot({
          videoId,
          stage: 'failed',
          percent: 100,
          message: 'Video processing failed',
          terminal: true,
        });
    }
  }
}
